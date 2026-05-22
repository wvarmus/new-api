package controller

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type SubscriptionDirectPayRequest struct {
	PlanId int `json:"plan_id"`
}

func SubscriptionRequestWechatNativePay(c *gin.Context) {
	plan, userId, ok := validateSubscriptionDirectPayRequest(c)
	if !ok {
		return
	}
	if !isWechatNativeTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "当前管理员未配置微信支付信息"})
		return
	}

	payMoney := getSubscriptionDirectPayMoney(plan)
	moneyCents := decimal.NewFromFloat(payMoney).Mul(decimal.NewFromInt(100)).Round(0).IntPart()
	if moneyCents < 1 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "套餐金额过低"})
		return
	}

	tradeNo := fmt.Sprintf("SUBWCN%dNO%s%d", userId, common.GetRandomString(6), time.Now().Unix())
	order := &model.SubscriptionOrder{
		UserId:        userId,
		PlanId:        plan.Id,
		Money:         payMoney,
		TradeNo:       tradeNo,
		PaymentMethod: model.PaymentMethodDirectWechat,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 Native 创建订阅订单失败 user_id=%d trade_no=%s plan_id=%d error=%q", userId, tradeNo, plan.Id, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	codeURL, err := createWechatNativeTransaction(c.Request.Context(), tradeNo, fmt.Sprintf("SUB%d", plan.Id), moneyCents)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 Native 拉起订阅支付失败 user_id=%d trade_no=%s plan_id=%d error=%q", userId, tradeNo, plan.Id, err.Error()))
		_ = model.ExpireSubscriptionOrder(tradeNo, model.PaymentMethodDirectWechat)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success", "data": gin.H{"code_url": codeURL, "trade_no": tradeNo}})
}

func SubscriptionRequestAlipayPay(c *gin.Context) {
	plan, userId, ok := validateSubscriptionDirectPayRequest(c)
	if !ok {
		return
	}
	if !isAlipayTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "当前管理员未配置支付宝支付信息"})
		return
	}

	payMoney := getSubscriptionDirectPayMoney(plan)
	if payMoney < 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "套餐金额过低"})
		return
	}

	tradeNo := fmt.Sprintf("SUBALP%dNO%s%d", userId, common.GetRandomString(6), time.Now().Unix())
	order := &model.SubscriptionOrder{
		UserId:        userId,
		PlanId:        plan.Id,
		Money:         payMoney,
		TradeNo:       tradeNo,
		PaymentMethod: model.PaymentMethodAlipayDirect,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝创建订阅订单失败 user_id=%d trade_no=%s plan_id=%d error=%q", userId, tradeNo, plan.Id, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	qrCode, err := createAlipayTradePrecreate(c.Request.Context(), tradeNo, fmt.Sprintf("SUB%d", plan.Id), payMoney)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝拉起订阅支付失败 user_id=%d trade_no=%s plan_id=%d error=%q", userId, tradeNo, plan.Id, err.Error()))
		_ = model.ExpireSubscriptionOrder(tradeNo, model.PaymentMethodAlipayDirect)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success", "data": gin.H{"qr_code": qrCode, "trade_no": tradeNo}})
}

func validateSubscriptionDirectPayRequest(c *gin.Context) (*model.SubscriptionPlan, int, bool) {
	var req SubscriptionDirectPayRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return nil, 0, false
	}
	plan, err := model.GetSubscriptionPlanById(req.PlanId)
	if err != nil {
		common.ApiError(c, err)
		return nil, 0, false
	}
	if !plan.Enabled {
		common.ApiErrorMsg(c, "套餐未启用")
		return nil, 0, false
	}
	if plan.PriceAmount < 0.01 {
		common.ApiErrorMsg(c, "套餐金额过低")
		return nil, 0, false
	}

	userId := c.GetInt("id")
	if plan.MaxPurchasePerUser > 0 {
		count, err := model.CountUserSubscriptionsByPlan(userId, plan.Id)
		if err != nil {
			common.ApiError(c, err)
			return nil, 0, false
		}
		if count >= int64(plan.MaxPurchasePerUser) {
			common.ApiErrorMsg(c, "已达到该套餐购买上限")
			return nil, 0, false
		}
	}
	return plan, userId, true
}

func getSubscriptionDirectPayMoney(plan *model.SubscriptionPlan) float64 {
	if plan == nil {
		return 0
	}
	rate := operation_setting.USDExchangeRate
	if rate <= 0 {
		rate = operation_setting.Price
	}
	if rate <= 0 {
		rate = 1
	}
	return decimal.NewFromFloat(plan.PriceAmount).Mul(decimal.NewFromFloat(rate)).Round(2).InexactFloat64()
}

func completeDirectPaySubscriptionOrder(tradeNo string, paidCents int64, payload string, expectedPaymentMethod string) error {
	order := model.GetSubscriptionOrderByTradeNo(tradeNo)
	if order == nil {
		return model.ErrSubscriptionOrderNotFound
	}
	if order.PaymentMethod != expectedPaymentMethod {
		return model.ErrPaymentMethodMismatch
	}
	if order.Status != common.TopUpStatusPending {
		return model.ErrSubscriptionOrderStatusInvalid
	}
	expectedCents := decimal.NewFromFloat(order.Money).Mul(decimal.NewFromInt(100)).Round(0).IntPart()
	if paidCents != expectedCents {
		return errors.New("支付金额不匹配")
	}
	return model.CompleteSubscriptionOrder(tradeNo, payload, expectedPaymentMethod)
}
