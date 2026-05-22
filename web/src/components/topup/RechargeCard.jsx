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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Typography, Button, Banner, Form, Spin } from '@douyinfe/semi-ui';
import { SiAlipay, SiWechat } from 'react-icons/si';
import {
  BarChart2,
  Coins,
  CreditCard,
  Ticket,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { IconGift } from '@douyinfe/semi-icons';
import { getCurrencyConfig } from '../../helpers/render';

const { Text } = Typography;

const RechargeCard = ({
  t,
  enableOnlineTopUp,
  enableStripeTopUp,
  presetAmounts,
  selectedPreset,
  selectPresetAmount,
  formatLargeNumber,
  topUpCount,
  minTopUp,
  renderQuotaWithAmount,
  getAmount,
  requestAmountByPayment,
  setTopUpCount,
  setSelectedPreset,
  renderAmount,
  amountLoading,
  paymentLoading,
  payMethods,
  preTopUp,
  payWay,
  setPayWay,
  redemptionCode,
  setRedemptionCode,
  topUp,
  isSubmitting,
  topUpLink,
  openTopUpLink,
  userState,
  renderQuota,
  statusLoading,
  enableWaffoTopUp,
  enableWaffoPancakeTopUp,
  enableWechatNativeTopUp,
  enableAlipayTopUp,
  historySlot,
}) => {
  const onlineFormApiRef = useRef(null);
  const redeemFormApiRef = useRef(null);
  const nextProgrammaticAmountValueRef = useRef(null);
  const hasAppliedDefaultPaymentTabRef = useRef(false);
  const hasUserSelectedPaymentTabRef = useRef(false);
  const [activePaymentTab, setActivePaymentTab] = useState('alipay');
  const regularPayMethods = payMethods || [];

  const hasOnlineTopup =
    enableOnlineTopUp ||
    enableStripeTopUp ||
    enableWaffoTopUp ||
    enableWaffoPancakeTopUp ||
    enableWechatNativeTopUp ||
    enableAlipayTopUp;

  const hasQuotaTopup =
    enableOnlineTopUp ||
    enableStripeTopUp ||
    enableWaffoTopUp ||
    enableWaffoPancakeTopUp ||
    enableWechatNativeTopUp ||
    enableAlipayTopUp;

  const metrics = [
    {
      label: t('当前余额'),
      value: renderQuota(userState?.user?.quota),
      icon: <Wallet size={18} />,
      tone: 'blue',
    },
    {
      label: t('历史消费'),
      value: renderQuota(userState?.user?.used_quota),
      icon: <TrendingUp size={18} />,
      tone: 'teal',
    },
    {
      label: t('请求次数'),
      value: userState?.user?.request_count || 0,
      icon: <BarChart2 size={18} />,
      tone: 'violet',
    },
  ];

  const formatDisplayNumber = (value, maxFractionDigits = 2) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '-';
    return number.toLocaleString(undefined, {
      maximumFractionDigits: maxFractionDigits,
      minimumFractionDigits: 0,
    });
  };

  const getPresetDisplay = (preset) => {
    const { symbol, rate, type } = getCurrencyConfig();
    const statusStr = localStorage.getItem('status');
    let usdRate = 7;

    try {
      if (statusStr) {
        const s = JSON.parse(statusStr);
        usdRate = s?.usd_exchange_rate || 7;
      }
    } catch (e) {}

    let displayValue = preset.value;

    if (type === 'CNY') {
      displayValue = preset.value * usdRate;
    } else if (type === 'CUSTOM') {
      displayValue = preset.value * rate;
    }

    return {
      symbol,
      displayValue,
    };
  };

  const isPaymentMethodEnabled = (payMethod) => {
    if (!payMethod) return false;
    if (!payMethod.type) return false;
    if (payMethod.type === 'direct_alipay') return enableAlipayTopUp;
    if (payMethod.type === 'direct_wechat_native')
      return enableWechatNativeTopUp;
    if (payMethod.type === 'stripe') return enableStripeTopUp;
    if (payMethod.type === 'waffo_pancake') return enableWaffoPancakeTopUp;
    if (
      typeof payMethod.type === 'string' &&
      payMethod.type.startsWith('waffo:')
    ) {
      return enableWaffoTopUp;
    }
    if (payMethod.type === 'alipay' || payMethod.type === 'wxpay') {
      return enableOnlineTopUp;
    }
    return enableOnlineTopUp;
  };

  const getPaymentMethodIcon = (type) => {
    if (type === 'direct_alipay' || type === 'alipay') {
      return <SiAlipay size={18} />;
    }
    if (type === 'direct_wechat_native' || type === 'wxpay') {
      return <SiWechat size={18} />;
    }
    return <CreditCard size={18} />;
  };

  const getPaymentMethodTone = (type) => {
    if (type === 'direct_alipay' || type === 'alipay') return 'alipay';
    if (type === 'direct_wechat_native' || type === 'wxpay') return 'wechat';
    return 'generic';
  };

  const paymentTabs = useMemo(() => {
    const availablePaymentTabs = regularPayMethods
      .filter((method) => method?.type && method?.name)
      .filter((method) => isPaymentMethodEnabled(method))
      .map((method, index) => ({
        key: `payment-${method.type.replace(/[^a-zA-Z0-9_-]/g, '-')}-${index}`,
        label: method.name,
        icon: getPaymentMethodIcon(method.type),
        method,
        tone: getPaymentMethodTone(method.type),
        disabled: false,
      }));
    const alipayMethod = null;
    const wechatMethod = null;

    return [
      ...availablePaymentTabs,
      {
        key: 'alipay',
        label: t('支付宝'),
        icon: <SiAlipay size={18} />,
        method: alipayMethod,
        disabled: !isPaymentMethodEnabled(alipayMethod),
      },
      {
        key: 'wechat',
        label: t('微信'),
        icon: <SiWechat size={18} />,
        method: wechatMethod,
        disabled: !isPaymentMethodEnabled(wechatMethod),
      },
      {
        key: 'redeem',
        label: t('兑换码'),
        icon: <IconGift />,
        method: null,
        disabled: false,
      },
    ].filter((tab) => tab.key === 'redeem' || !tab.disabled);
  }, [
    regularPayMethods,
    enableOnlineTopUp,
    enableStripeTopUp,
    enableWaffoTopUp,
    enableWaffoPancakeTopUp,
    enableWechatNativeTopUp,
    enableAlipayTopUp,
    t,
  ]);

  const selectedPaymentTab =
    paymentTabs.find((item) => item.key === activePaymentTab) ||
    paymentTabs[0];
  const selectedPaymentMethod = selectedPaymentTab?.method;
  const isRedeemPayment = selectedPaymentTab?.key === 'redeem';

  useEffect(() => {
    const preferredTab = paymentTabs.find((item) => item.method);
    if (
      !hasAppliedDefaultPaymentTabRef.current &&
      !hasUserSelectedPaymentTabRef.current &&
      preferredTab?.method &&
      !preferredTab.disabled
    ) {
      hasAppliedDefaultPaymentTabRef.current = true;
      if (activePaymentTab !== preferredTab.key) {
        setActivePaymentTab(preferredTab.key);
      }
      if (payWay !== preferredTab.method.type) {
        setPayWay(preferredTab.method.type);
      }
      return;
    }

    if (activePaymentTab === 'redeem') return;

    const currentTab = paymentTabs.find(
      (item) => item.key === activePaymentTab,
    );
    if (currentTab?.method && !currentTab.disabled) {
      if (payWay !== currentTab.method.type) {
        setPayWay(currentTab.method.type);
      }
      return;
    }

    const fallbackTab =
      paymentTabs.find((item) => item.method && !item.disabled) ||
      paymentTabs.find((item) => item.key === 'redeem');

    if (fallbackTab && fallbackTab.key !== activePaymentTab) {
      setActivePaymentTab(fallbackTab.key);
      if (fallbackTab.method) {
        setPayWay(fallbackTab.method.type);
      }
    }
  }, [activePaymentTab, isRedeemPayment, payWay, paymentTabs, setPayWay]);

  const handlePaymentTabClick = (tab) => {
    if (tab.disabled) return;
    hasUserSelectedPaymentTabRef.current = true;
    setActivePaymentTab(tab.key);
    if (tab.method) {
      setPayWay(tab.method.type);
      void (requestAmountByPayment
        ? requestAmountByPayment(tab.method.type, topUpCount)
        : getAmount(topUpCount));
    }
  };

  const handleConfirmTopUp = () => {
    if (!selectedPaymentMethod || selectedPaymentTab?.disabled) return;
    void preTopUp(selectedPaymentMethod.type);
  };

  const renderAmountSummary = () => (
    <div
      className={`wallet-amount-result ${
        amountLoading ? 'wallet-amount-result-loading' : ''
      }`}
    >
      <span>{t('实际支付')}</span>
      <strong>{renderAmount()}</strong>
    </div>
  );

  const renderPresetAmounts = () => {
    if (!hasQuotaTopup) return null;

    return (
      <section className='wallet-presets-block'>
        <div className='wallet-preset-grid'>
          {presetAmounts.map((preset, index) => {
            const { symbol: presetSymbol, displayValue } =
              getPresetDisplay(preset);
            const selected = Number(selectedPreset) === Number(preset.value);

            return (
              <button
                type='button'
                key={index}
                className={`wallet-preset-card ${
                  selected ? 'wallet-preset-card-active' : ''
                }`}
                onClick={() => {
                  const nextPresetValue = Number(preset.value);
                  nextProgrammaticAmountValueRef.current = nextPresetValue;
                  onlineFormApiRef.current?.setValue(
                    'topUpCount',
                    preset.value,
                  );
                  void selectPresetAmount(preset);
                }}
              >
                <span className='wallet-preset-top'>
                  <Coins size={17} />
                  <strong>
                    {formatLargeNumber
                      ? formatLargeNumber(displayValue)
                      : formatDisplayNumber(displayValue)}
                  </strong>
                  <span>{presetSymbol}</span>
                </span>
              </button>
            );
          })}

          <div className='wallet-custom-amount-card'>
            <div className='wallet-custom-amount-title'>
              <span>{t('自定义金额')}</span>
            </div>
            <Form.InputNumber
              field='topUpCount'
              noLabel
              disabled={!hasQuotaTopup}
              placeholder={
                t('充值数量，最低') + renderQuotaWithAmount(minTopUp)
              }
              value={topUpCount}
              min={minTopUp}
              max={999999999}
              step={1}
              precision={0}
              hideButtons
              onChange={async (value) => {
                const nextValue = Number(value);
                if (
                  nextProgrammaticAmountValueRef.current !== null &&
                  nextValue === nextProgrammaticAmountValueRef.current
                ) {
                  nextProgrammaticAmountValueRef.current = null;
                  return;
                }
                nextProgrammaticAmountValueRef.current = null;

                if (nextValue && nextValue >= 1) {
                  setTopUpCount(nextValue);
                  setSelectedPreset(null);
                  await getAmount(nextValue);
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (!value || value < 1) {
                  setTopUpCount(1);
                  onlineFormApiRef.current?.setValue('topUpCount', 1);
                  getAmount(1);
                }
              }}
              formatter={(value) => (value ? `${value}` : '')}
              parser={(value) =>
                value ? parseInt(String(value).replace(/[^\d]/g, '')) : 0
              }
              className='wallet-custom-amount-input'
              style={{ width: '100%' }}
            />
            <div className='wallet-custom-amount-meta'>
              <span>{t('最低充值')}</span>
              <strong>{renderQuotaWithAmount(minTopUp)}</strong>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderRedeemPanel = () => (
    <section className='wallet-redeem-section wallet-payment-tab-panel'>
      <div className='wallet-section-heading wallet-section-heading-compact'>
        <span className='wallet-section-icon wallet-section-icon-teal'>
          <Ticket size={18} />
        </span>
        <div>
          <h2>{t('兑换码充值')}</h2>
          <p>{t('输入兑换码后直接为当前账户增加额度。')}</p>
        </div>
      </div>

      <Form
        getFormApi={(api) => (redeemFormApiRef.current = api)}
        initValues={{ redemptionCode: redemptionCode }}
      >
        <div className='wallet-redeem-control'>
          <Form.Input
            field='redemptionCode'
            noLabel
            placeholder={t('请输入兑换码')}
            value={redemptionCode}
            onChange={(value) => setRedemptionCode(value)}
            prefix={<IconGift />}
            showClear
            className='wallet-redeem-input'
          />
          <Button
            type='primary'
            theme='solid'
            onClick={topUp}
            loading={isSubmitting}
            className='wallet-redeem-button'
          >
            {t('兑换额度')}
          </Button>
        </div>
        {topUpLink && (
          <div className='wallet-redeem-link'>
            <span>{t('在找兑换码？')}</span>
            <button type='button' onClick={openTopUpLink}>
              {t('购买兑换码')}
            </button>
          </div>
        )}
      </Form>
    </section>
  );

  const renderRechargePanel = () => {
    if (statusLoading) {
      return (
        <div className='wallet-loading-state'>
          <Spin size='large' />
          <span>{t('正在读取充值配置')}</span>
        </div>
      );
    }

    if (!hasOnlineTopup) {
      return (
        <Banner
          type='info'
          description={t(
            '管理员未开启在线充值功能，请联系管理员开启或使用兑换码充值。',
          )}
          className='wallet-topup-banner'
          closeIcon={null}
        />
      );
    }

    return (
      <Form
        getFormApi={(api) => (onlineFormApiRef.current = api)}
        initValues={{ topUpCount: topUpCount }}
      >
        {renderPresetAmounts()}

        <div className='wallet-recharge-submit-row'>
          <div className='wallet-recharge-amount-card'>
            {renderAmountSummary()}
          </div>
          <Button
            type='primary'
            theme='solid'
            size='large'
            className='wallet-recharge-submit-button'
            onClick={handleConfirmTopUp}
            loading={paymentLoading}
            disabled={!selectedPaymentMethod || selectedPaymentTab?.disabled}
          >
            {t('立即充值')}
          </Button>
        </div>
      </Form>
    );
  };

  return (
    <div className='wallet-page-shell'>
      <section className='wallet-overview-card'>
        <div className='wallet-hero-top'>
          <div className='wallet-title-wrap'>
            <span className='wallet-hero-icon'>
              <Wallet size={24} />
            </span>
            <div>
              <Typography.Title heading={3} className='wallet-page-title'>
                {t('钱包管理')}
              </Typography.Title>
              <Text className='wallet-page-subtitle'>
                {t(
                  '管理账户余额、充值方式与兑换码，支付完成后可在账单中追踪状态。',
                )}
              </Text>
            </div>
          </div>
        </div>

        <div className='wallet-metric-grid'>
          {metrics.map((metric) => (
            <div className='wallet-metric-card' key={metric.label}>
              <span className={`wallet-metric-icon wallet-tone-${metric.tone}`}>
                {metric.icon}
              </span>
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className='wallet-lower-grid'>
        <section className='wallet-workspace-card wallet-payment-workspace-card'>
          <div className='wallet-section-heading wallet-payment-main-heading'>
            <span className='wallet-section-icon wallet-section-icon-primary'>
              <CreditCard size={18} />
            </span>
            <div>
              <h2>{t('额度充值')}</h2>
              <p>{t('选择支付方式和充值额度，确认后再进入支付确认。')}</p>
            </div>
          </div>

          <div
            className='wallet-payment-tab-switch'
            role='tablist'
            style={{
              gridTemplateColumns: `repeat(${paymentTabs.length}, minmax(0, 1fr))`,
            }}
          >
            {paymentTabs.map((tab) => (
              <button
                key={tab.key}
                type='button'
                role='tab'
                aria-selected={selectedPaymentTab?.key === tab.key}
                className={`wallet-payment-tab-${tab.tone || 'generic'} ${
                  selectedPaymentTab?.key === tab.key ? 'active' : ''
                }`}
                disabled={tab.disabled}
                onClick={() => handlePaymentTabClick(tab)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className='wallet-payment-tab-content'>
            {isRedeemPayment ? renderRedeemPanel() : renderRechargePanel()}
          </div>
        </section>

        {historySlot}
      </div>
    </div>
  );
};

export default RechargeCard;
