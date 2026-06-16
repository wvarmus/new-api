package middleware

import (
	"errors"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	captcha "github.com/alibabacloud-go/captcha-20230305/client"
	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/utils"
	"github.com/alibabacloud-go/tea/dara"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func AliyunCaptchaCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !common.AliyunCaptchaEnabled {
			c.Next()
			return
		}
		session := sessions.Default(c)
		if captchaTime := session.Get("aliyun_captcha"); captchaTime != nil {
			if ts, ok := captchaTime.(int64); ok && time.Now().Unix()-ts < 7*24*3600 {
				c.Next()
				return
			}
		}
		captchaVerifyParam := c.Query("captcha")
		if captchaVerifyParam == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "验证码参数为空",
			})
			c.Abort()
			return
		}
		verifyResult, err := verifyAliyunCaptcha(captchaVerifyParam, c.ClientIP())
		if err != nil {
			common.SysLog("aliyun captcha verify error: " + err.Error())
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "验证码校验服务异常，请稍后重试",
			})
			c.Abort()
			return
		}
		if !verifyResult {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "验证码校验失败，请刷新重试！",
			})
			c.Abort()
			return
		}
		session.Set("aliyun_captcha", time.Now().Unix())
		err = session.Save()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"message": "无法保存会话信息，请重试",
				"success": false,
			})
			return
		}
		c.Next()
	}
}

func verifyAliyunCaptcha(captchaVerifyParam string, _ string) (bool, error) {
	config := &openapi.Config{}
	config.SetAccessKeyId(common.AliyunCaptchaAccessKeyId)
	config.SetAccessKeySecret(common.AliyunCaptchaAccessKeySecret)
	if common.AliyunCaptchaRegion == "sgp" {
		config.SetEndpoint("captcha.ap-southeast-1.aliyuncs.com")
	} else {
		config.SetEndpoint("captcha.cn-shanghai.aliyuncs.com")
	}

	client, err := captcha.NewClient(config)
	if err != nil {
		return false, err
	}

	request := &captcha.VerifyIntelligentCaptchaRequest{}
	request.SetCaptchaVerifyParam(captchaVerifyParam)
	if common.AliyunCaptchaSceneId != "" {
		request.SetSceneId(common.AliyunCaptchaSceneId)
	}

	response, err := client.VerifyIntelligentCaptcha(request)
	if err != nil {
		return false, err
	}

	if response.Body == nil || response.Body.Result == nil {
		return false, errors.New("empty response from aliyun captcha")
	}

	return dara.BoolValue(response.Body.Result.VerifyResult), nil
}
