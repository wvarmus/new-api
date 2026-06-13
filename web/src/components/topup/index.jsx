/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  API,
  showError,
  showInfo,
  showSuccess,
  renderQuota,
  renderQuotaWithAmount,
} from '../../helpers';
import { Modal, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';

import RechargeCard from './RechargeCard';
import TopupHistoryCard from './TopupHistoryCard';
import DirectPayQrModal from './modals/DirectPayQrModal';

const TopUp = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);

  const [redemptionCode, setRedemptionCode] = useState('');
  const [amount, setAmount] = useState(0.0);
  const [minTopUp, setMinTopUp] = useState(statusState?.status?.min_topup || 1);
  const [topUpCount, setTopUpCount] = useState(
    statusState?.status?.min_topup || 1,
  );
  const [topUpLink, setTopUpLink] = useState(
    statusState?.status?.top_up_link || '',
  );
  const [statusLoading, setStatusLoading] = useState(!statusState?.status);
  const [topupInfoLoading, setTopupInfoLoading] = useState(true);

  const [enableWechatNativeTopUp, setEnableWechatNativeTopUp] = useState(false);
  const [enableAlipayTopUp, setEnableAlipayTopUp] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payWay, setPayWay] = useState('');
  const [amountLoading, setAmountLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payMethods, setPayMethods] = useState([]);
  const [directPayOpen, setDirectPayOpen] = useState(false);
  const [directPayData, setDirectPayData] = useState(null);
  const [directPayChecking, setDirectPayChecking] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [billingPreference, setBillingPreference] =
    useState('subscription_first');
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);

  const [presetAmounts, setPresetAmounts] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const confirmPayMethods = payMethods;

  const getPayMethodConfig = (payment) =>
    confirmPayMethods.find((method) => method.type === payment);

  const isDirectPayMethod = (payment) =>
    payment === 'direct_wechat_native' || payment === 'direct_alipay';

  const getDirectPayEndpoint = (payment) =>
    payment === 'direct_wechat_native'
      ? '/api/user/direct-pay/wechat-native/pay'
      : '/api/user/direct-pay/alipay/pay';

  const getPaymentMinTopUp = (payment) => {
    const configuredMinTopUp = Number(getPayMethodConfig(payment)?.min_topup);
    return Number.isFinite(configuredMinTopUp) && configuredMinTopUp > 0
      ? configuredMinTopUp
      : minTopUp;
  };

  const requestAmountByPayment = async (payment, value) => {
    if (!isDirectPayMethod(payment)) return;
    return getAmount(value);
  };

  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo(t('请输入兑换码！'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', {
        key: redemptionCode,
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('兑换成功！'));
        Modal.success({
          title: t('兑换成功！'),
          content: t('成功兑换额度：') + renderQuota(data),
          centered: true,
        });
        if (userState.user) {
          const updatedUser = {
            ...userState.user,
            quota: userState.user.quota + data,
          };
          userDispatch({ type: 'login', payload: updatedUser });
        }
        setHistoryRefreshKey((value) => value + 1);
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError(t('请求失败'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError(t('超级管理员未设置充值链接！'));
      return;
    }
    window.open(topUpLink, '_blank');
  };

  const preTopUp = async (payment) => {
    if (payment === 'direct_wechat_native') {
      if (!enableWechatNativeTopUp) {
        showError(t('管理员未开启微信支付充值！'));
        return;
      }
    } else if (payment === 'direct_alipay') {
      if (!enableAlipayTopUp) {
        showError(t('管理员未开启支付宝充值！'));
        return;
      }
    } else {
      showError(t('不支持的支付方式'));
      return;
    }

    setPayWay(payment);
    setPaymentLoading(true);
    try {
      const selectedMinTopUp = getPaymentMinTopUp(payment);
      await requestAmountByPayment(payment);

      if (topUpCount < selectedMinTopUp) {
        showError(t('充值数量不能小于') + selectedMinTopUp);
        return;
      }
      await requestDirectPay(payment);
    } catch (error) {
      showError(t('获取金额失败'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const requestDirectPay = async (payment) => {
    setDirectPayData(null);
    setDirectPayOpen(false);
    try {
      const res = await API.post(getDirectPayEndpoint(payment), {
        amount: parseInt(topUpCount),
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          setDirectPayData({
            ...(data || {}),
            payWay: payment,
          });
          setDirectPayOpen(true);
        } else {
          const errorMsg =
            typeof data === 'string' ? data : message || t('支付请求失败');
          showError(errorMsg);
        }
      } else {
        showError(res);
      }
    } catch (err) {
      showError(t('支付请求失败'));
    }
  };

  const closeDirectPayModal = () => {
    if (directPayChecking) return;
    setDirectPayOpen(false);
    setDirectPayData(null);
  };

  const checkDirectPayStatus = async () => {
    const tradeNo = directPayData?.trade_no;
    if (!tradeNo) {
      showError(t('未支付'));
      return;
    }

    setDirectPayChecking(true);
    try {
      const res = await API.get(
        `/api/user/topup/self?p=1&page_size=1&keyword=${encodeURIComponent(
          tradeNo,
        )}`,
      );
      const { success, message, data } = res.data;
      if (!success) {
        showError(message || t('查询支付状态失败'));
        return;
      }

      const record = (data?.items || []).find(
        (item) => item.trade_no === tradeNo,
      );
      if (record?.status === 'success') {
        showSuccess(t('支付成功'));
        setDirectPayOpen(false);
        setDirectPayData(null);
        setHistoryRefreshKey((value) => value + 1);
        await getUserQuota();
        return;
      }

      showError(t('未支付'));
    } catch (err) {
      showError(t('查询支付状态失败'));
    } finally {
      setDirectPayChecking(false);
    }
  };

  const getUserQuota = async () => {
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
    } else {
      showError(message);
    }
  };

  const getSubscriptionPlans = async () => {
    setSubscriptionLoading(true);
    try {
      const res = await API.get('/api/subscription/plans');
      if (res.data?.success) {
        setSubscriptionPlans(res.data.data || []);
      }
    } catch (e) {
      setSubscriptionPlans([]);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const getSubscriptionSelf = async () => {
    try {
      const res = await API.get('/api/subscription/self');
      if (res.data?.success) {
        setBillingPreference(
          res.data.data?.billing_preference || 'subscription_first',
        );
        setActiveSubscriptions(res.data.data?.subscriptions || []);
        setAllSubscriptions(res.data.data?.all_subscriptions || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const updateBillingPreference = async (pref) => {
    const previousPref = billingPreference;
    setBillingPreference(pref);
    try {
      const res = await API.put('/api/subscription/self/preference', {
        billing_preference: pref,
      });
      if (res.data?.success) {
        showSuccess(t('更新成功'));
        const normalizedPref =
          res.data?.data?.billing_preference || pref || previousPref;
        setBillingPreference(normalizedPref);
      } else {
        showError(res.data?.message || t('更新失败'));
        setBillingPreference(previousPref);
      }
    } catch (e) {
      showError(t('请求失败'));
      setBillingPreference(previousPref);
    }
  };

  const getTopupInfo = async () => {
    setTopupInfoLoading(true);
    try {
      const res = await API.get('/api/user/topup/info');
      const { data, success } = res.data;
      if (success) {
        const amountOptions = data.amount_options || [];
        const discount = data.discount || {};

        let payMethods = data.pay_methods || [];
        try {
          if (typeof payMethods === 'string') {
            payMethods = JSON.parse(payMethods);
          }
          if (payMethods && payMethods.length > 0) {
            payMethods = payMethods
              .filter((method) => method.name && method.type)
              .filter((method) => isDirectPayMethod(method.type))
              .map((method) => {
                const normalizedMinTopup = Number(method.min_topup);
                method.min_topup = Number.isFinite(normalizedMinTopup)
                  ? normalizedMinTopup
                  : 0;

                if (!method.color) {
                  if (method.type === 'direct_alipay') {
                    method.color = 'rgba(var(--semi-blue-5), 1)';
                  } else if (method.type === 'direct_wechat_native') {
                    method.color = 'rgba(var(--semi-green-5), 1)';
                  }
                }
                return method;
              });
          } else {
            payMethods = [];
          }

          setPayMethods(payMethods);
          const nextEnableWechatNativeTopUp =
            data.enable_wechat_native_topup || false;
          const nextEnableAlipayTopUp = data.enable_alipay_topup || false;
          const minTopUpValue = nextEnableWechatNativeTopUp
            ? data.wechat_native_min_topup
            : nextEnableAlipayTopUp
              ? data.alipay_min_topup
              : 1;
          setEnableWechatNativeTopUp(nextEnableWechatNativeTopUp);
          setEnableAlipayTopUp(nextEnableAlipayTopUp);
          setMinTopUp(minTopUpValue);
          setTopUpCount(minTopUpValue);

          if (amountOptions.length > 0) {
            const customPresets = amountOptions.map((amount) => ({
              value: amount,
              discount: discount?.[amount] || 1.0,
            }));
            setPresetAmounts(customPresets);
          } else {
            setPresetAmounts(generatePresetAmounts(minTopUpValue));
          }

          await getAmount(minTopUpValue);
        } catch (e) {
          setPayMethods([]);
        }
      } else {
        showError(data || t('获取充值配置失败'));
      }
    } catch (error) {
      showError(t('获取充值配置异常'));
    } finally {
      setTopupInfoLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('show_history') === 'true') {
      setHistoryRefreshKey((value) => value + 1);
      searchParams.delete('show_history');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    getUserQuota().then();
  }, []);

  useEffect(() => {
    getTopupInfo().then();
    getSubscriptionPlans().then();
    getSubscriptionSelf().then();
  }, []);

  useEffect(() => {
    if (statusState?.status) {
      setTopUpLink(statusState.status.top_up_link || '');
      setStatusLoading(false);
    }
  }, [statusState?.status]);

  const renderAmount = () => {
    return amount + ' ' + t('元');
  };

  const getAmount = async (value) => {
    if (value === undefined) {
      value = topUpCount;
    }
    setAmountLoading(true);
    try {
      const res = await API.post('/api/user/amount', {
        amount: parseFloat(value),
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          setAmount(parseFloat(data));
        } else {
          setAmount(0);
          Toast.error({ content: '错误：' + data, id: 'getAmount' });
        }
      } else {
        showError(res);
      }
    } catch (err) {
      // amount fetch failed silently
    }
    setAmountLoading(false);
  };

  const selectPresetAmount = async (preset) => {
    setTopUpCount(preset.value);
    setSelectedPreset(preset.value);

    await getAmount(preset.value);
  };

  const formatLargeNumber = (num) => {
    return num.toString();
  };

  const generatePresetAmounts = (minAmount) => {
    const multipliers = [1, 5, 10, 30, 50, 100, 300, 500];
    return multipliers.map((multiplier) => ({
      value: minAmount * multiplier,
    }));
  };

  return (
    <div className='wallet-page-container w-full relative header-offset-top'>
      <DirectPayQrModal
        t={t}
        open={directPayOpen}
        onCancel={closeDirectPayModal}
        onCheckPaid={checkDirectPayStatus}
        checking={directPayChecking}
        payData={directPayData}
        topUpCount={topUpCount}
        renderQuotaWithAmount={renderQuotaWithAmount}
        amountLoading={amountLoading}
        renderAmount={renderAmount}
        payMethods={confirmPayMethods}
      />

      <div className='wallet-page-main grid grid-cols-1 gap-6'>
        <RechargeCard
          t={t}
          enableWechatNativeTopUp={enableWechatNativeTopUp}
          enableAlipayTopUp={enableAlipayTopUp}
          presetAmounts={presetAmounts}
          selectedPreset={selectedPreset}
          selectPresetAmount={selectPresetAmount}
          formatLargeNumber={formatLargeNumber}
          topUpCount={topUpCount}
          minTopUp={minTopUp}
          renderQuotaWithAmount={renderQuotaWithAmount}
          getAmount={getAmount}
          requestAmountByPayment={requestAmountByPayment}
          setTopUpCount={setTopUpCount}
          setSelectedPreset={setSelectedPreset}
          renderAmount={renderAmount}
          amountLoading={amountLoading}
          paymentLoading={paymentLoading}
          payMethods={confirmPayMethods}
          preTopUp={preTopUp}
          payWay={payWay}
          setPayWay={setPayWay}
          redemptionCode={redemptionCode}
          setRedemptionCode={setRedemptionCode}
          topUp={topUp}
          isSubmitting={isSubmitting}
          topUpLink={topUpLink}
          openTopUpLink={openTopUpLink}
          userState={userState}
          renderQuota={renderQuota}
          statusLoading={statusLoading}
          topupInfoLoading={topupInfoLoading}
          historySlot={
            <TopupHistoryCard t={t} refreshKey={historyRefreshKey} />
          }
        />
      </div>
    </div>
  );
};

export default TopUp;
