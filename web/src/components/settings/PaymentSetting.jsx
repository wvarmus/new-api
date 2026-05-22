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

import React, { useEffect, useState } from 'react';
import { Card, Divider, Spin } from '@douyinfe/semi-ui';
import SettingsGeneralPayment from '../../pages/Setting/Payment/SettingsGeneralPayment';
import SettingsPaymentGatewayWechatNative from '../../pages/Setting/Payment/SettingsPaymentGatewayWechatNative';
import SettingsPaymentGatewayAlipay from '../../pages/Setting/Payment/SettingsPaymentGatewayAlipay';
import { API, showError, toBoolean } from '../../helpers';
import { useTranslation } from 'react-i18next';

const PaymentSetting = () => {
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    ServerAddress: '',
    Price: 7.3,
    MinTopUp: 1,
    TopupGroupRatio: '',
    CustomCallbackAddress: '',
    AmountOptions: '',
    AmountDiscount: '',

    WechatNativeAppId: '',
    WechatNativeMchId: '',
    WechatNativeApiV3Key: '',
    WechatNativeMerchantSerialNo: '',
    WechatNativeMerchantPrivateKey: '',
    WechatNativePlatformCert: '',
    WechatNativeMinTopUp: 1,
    DirectPayWechatEnabled: false,

    AlipayAppId: '',
    AlipayPrivateKey: '',
    AlipayPublicKey: '',
    AlipayAppCertPublicKey: '',
    AlipayRootCert: '',
    AlipayPublicCert: '',
    AlipaySandbox: false,
    AlipayMinTopUp: 1,
    DirectPayAlipayEnabled: false,
  });

  let [loading, setLoading] = useState(false);

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        switch (item.key) {
          case 'TopupGroupRatio':
            try {
              newInputs[item.key] = JSON.stringify(
                JSON.parse(item.value),
                null,
                2,
              );
            } catch (error) {
              newInputs[item.key] = item.value;
            }
            break;
          case 'payment_setting.amount_options':
            try {
              newInputs['AmountOptions'] = JSON.stringify(
                JSON.parse(item.value),
                null,
                2,
              );
            } catch (error) {
              newInputs['AmountOptions'] = item.value;
            }
            break;
          case 'payment_setting.amount_discount':
            try {
              newInputs['AmountDiscount'] = JSON.stringify(
                JSON.parse(item.value),
                null,
                2,
              );
            } catch (error) {
              newInputs['AmountDiscount'] = item.value;
            }
            break;
          case 'Price':
          case 'MinTopUp':
          case 'WechatNativeMinTopUp':
          case 'AlipayMinTopUp':
            newInputs[item.key] = parseFloat(item.value);
            break;
          case 'AlipaySandbox':
          case 'DirectPayWechatEnabled':
          case 'DirectPayAlipayEnabled':
            newInputs[item.key] = toBoolean(item.value);
            break;
          default:
            if (item.key.endsWith('Enabled')) {
              newInputs[item.key] = toBoolean(item.value);
            } else {
              newInputs[item.key] = item.value;
            }
            break;
        }
      });

      setInputs((prev) => ({ ...prev, ...newInputs }));
    } else {
      showError(t(message));
    }
  };

  async function onRefresh() {
    try {
      setLoading(true);
      await getOptions();
    } catch (error) {
      showError(t('刷新失败'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <>
      <Spin spinning={loading} size='large'>
        <Card style={{ marginTop: '10px' }}>
          <SettingsGeneralPayment
            options={inputs}
            refresh={onRefresh}
            hideSectionTitle
          />
          <Divider margin='24px' />
          <SettingsPaymentGatewayWechatNative
            options={inputs}
            refresh={onRefresh}
            hideSectionTitle={false}
          />
          <Divider margin='24px' />
          <SettingsPaymentGatewayAlipay
            options={inputs}
            refresh={onRefresh}
            hideSectionTitle={false}
          />
        </Card>
      </Spin>
    </>
  );
};

export default PaymentSetting;
