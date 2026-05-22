import React from 'react';
import { Button, Modal, Skeleton, Spin, Typography } from '@douyinfe/semi-ui';
import { CreditCard } from 'lucide-react';
import { SiAlipay, SiWechat } from 'react-icons/si';
import { QRCodeSVG } from 'qrcode.react';

const { Text } = Typography;

const DirectPayQrModal = ({
  t,
  open,
  onCancel,
  onCheckPaid,
  checking,
  payData,
  topUpCount,
  renderQuotaWithAmount,
  amountLoading,
  renderAmount,
  payMethods,
}) => {
  const payWay = payData?.payWay || '';
  const qrValue = payData?.qr_code || payData?.code_url || '';
  const isAlipay = payWay === 'direct_alipay';
  const payMethod = payMethods.find((method) => method.type === payWay);
  const payName = payMethod?.name || (isAlipay ? t('支付宝') : t('微信'));
  const payIcon = isAlipay ? (
    <SiAlipay size={18} color='#1677ff' />
  ) : (
    <SiWechat size={18} color='#07c160' />
  );

  return (
    <Modal
      title={
        <div className='wallet-direct-pay-title'>
          <span className='wallet-direct-pay-title-icon'>
            <CreditCard size={20} />
          </span>
          <div>
            <strong>{t('额度充值')}</strong>
          </div>
        </div>
      }
      visible={open}
      onCancel={onCancel}
      footer={
        <div className='wallet-direct-pay-footer'>
          <Button
            type='primary'
            theme='solid'
            loading={checking}
            onClick={onCheckPaid}
            className='wallet-direct-pay-paid-button'
          >
            {t('我已充值')}
          </Button>
          <Button
            theme='borderless'
            disabled={checking}
            onClick={onCancel}
            className='wallet-direct-pay-cancel-button'
          >
            {t('取消')}
          </Button>
        </div>
      }
      maskClosable={!checking}
      centered
      size='small'
      className='wallet-direct-pay-modal'
    >
      <div className='wallet-direct-pay-body'>
        <div className='wallet-direct-pay-summary'>
          <div className='wallet-direct-pay-row'>
            <Text>{t('充值数量')}</Text>
            <strong>{renderQuotaWithAmount(topUpCount)}</strong>
          </div>
          <div className='wallet-direct-pay-row'>
            <Text>{t('实付金额')}</Text>
            {amountLoading ? (
              <Skeleton.Title style={{ width: 76, height: 18 }} />
            ) : (
              <strong className='wallet-direct-pay-money'>
                {renderAmount()}
              </strong>
            )}
          </div>
          <div className='wallet-direct-pay-row'>
            <Text>{t('支付方式')}</Text>
            <span className='wallet-direct-pay-method'>
              {payIcon}
              <strong>{payName}</strong>
            </span>
          </div>
        </div>

        <div className='wallet-direct-pay-qr-card'>
          {qrValue ? (
            <QRCodeSVG value={qrValue} size={220} />
          ) : (
            <div className='wallet-direct-pay-qr-loading'>
              <Spin size='large' />
            </div>
          )}
          <span>
            {isAlipay
              ? t('请使用支付宝扫码完成支付')
              : t('请使用微信扫码完成支付')}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default DirectPayQrModal;
