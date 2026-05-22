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

import React, { useEffect, useMemo, useState } from 'react';
import { Empty, Spin, Table, Toast, Typography } from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { ReceiptText } from 'lucide-react';
import { API, timestamp2string } from '../../helpers';
import { isAdmin } from '../../helpers/utils';

const { Text } = Typography;

const STATUS_CONFIG = {
  success: { key: '成功', className: 'success' },
  pending: { key: '待支付', className: 'pending' },
  failed: { key: '失败', className: 'failed' },
  expired: { key: '已过期', className: 'expired' },
};

const PAYMENT_METHOD_MAP = {
  stripe: 'Stripe',
  creem: 'Creem',
  waffo: 'Waffo',
  alipay: '支付宝',
  direct_alipay: '支付宝',
  direct_wechat_native: '微信支付',
  wxpay: '微信',
};

const DEFAULT_PAGE_SIZE = 10;

const formatMoney = (value) => {
  const numericValue = Number(value || 0);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00';
};

const TopupHistoryCard = ({ t, refreshKey = 0 }) => {
  const [loading, setLoading] = useState(false);
  const [topups, setTopups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const userIsAdmin = useMemo(() => isAdmin(), []);

  const renderStatus = (status) => {
    const config = STATUS_CONFIG[status] || {
      key: status || '-',
      className: 'unknown',
    };
    return (
      <span
        className={`wallet-history-status wallet-history-status-${config.className}`}
      >
        {config.key ? t(config.key) : '-'}
      </span>
    );
  };

  const renderPaymentMethod = (paymentMethod) =>
    PAYMENT_METHOD_MAP[paymentMethod]
      ? t(PAYMENT_METHOD_MAP[paymentMethod])
      : paymentMethod || '-';

  const isSubscriptionTopup = (record) => {
    const tradeNo = (record?.trade_no || '').toLowerCase();
    return Number(record?.amount || 0) === 0 && tradeNo.startsWith('sub');
  };

  const loadTopups = async (currentPage, currentPageSize) => {
    setLoading(true);
    try {
      const base = userIsAdmin ? '/api/user/topup' : '/api/user/topup/self';
      const res = await API.get(
        `${base}?p=${currentPage}&page_size=${currentPageSize}`,
      );
      const { success, message, data } = res.data;
      if (success) {
        setTopups(data.items || []);
        setTotal(data.total || 0);
      } else {
        Toast.error({ content: message || t('加载失败') });
      }
    } catch (error) {
      Toast.error({ content: t('加载账单失败') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopups(page, pageSize);
  }, [refreshKey, page, pageSize]);

  const columns = useMemo(
    () => [
      ...(userIsAdmin
        ? [
            {
              title: t('用户ID'),
              dataIndex: 'user_id',
              key: 'user_id',
              width: 58,
              render: (userId) => userId ?? '-',
            },
          ]
        : []),
      {
        title: t('订单号'),
        dataIndex: 'trade_no',
        key: 'trade_no',
        width: 170,
        render: (tradeNo) => (
          <Text ellipsis={{ showTooltip: true }} className='wallet-history-no'>
            {tradeNo || '-'}
          </Text>
        ),
      },
      {
        title: t('支付方式'),
        dataIndex: 'payment_method',
        key: 'payment_method',
        width: 82,
        render: (paymentMethod) => (
          <span className='wallet-history-side-method'>
            {renderPaymentMethod(paymentMethod)}
          </span>
        ),
      },
      {
        title: t('充值额度'),
        dataIndex: 'amount',
        key: 'amount',
        width: 78,
        render: (amount, record) =>
          isSubscriptionTopup(record) ? (
            <span className='wallet-history-plan'>{t('订阅套餐')}</span>
          ) : (
            <span className='wallet-history-quota-value'>{amount ?? '-'}</span>
          ),
      },
      {
        title: t('支付金额'),
        dataIndex: 'money',
        key: 'money',
        width: 84,
        render: (money) => (
          <span className='wallet-history-money'>¥{formatMoney(money)}</span>
        ),
      },
      {
        title: t('状态'),
        dataIndex: 'status',
        key: 'status',
        width: 70,
        render: renderStatus,
      },
      {
        title: t('创建时间'),
        dataIndex: 'create_time',
        key: 'create_time',
        width: 142,
        render: (time) => timestamp2string(time),
      },
    ],
    [t, userIsAdmin],
  );

  const handlePageChange = (currentPage) => {
    setPage(currentPage);
  };

  const handlePageSizeChange = (currentPageSize) => {
    setPageSize(currentPageSize);
    setPage(1);
  };

  return (
    <section
      className={`wallet-history-side-card ${
        userIsAdmin ? 'wallet-history-side-card-admin' : ''
      }`}
    >
      <div className='wallet-history-side-heading'>
        <span className='wallet-history-side-icon'>
          <ReceiptText size={22} />
        </span>
        <div>
          <h2>{t('充值账单')}</h2>
          <p>{t('完整充值记录与支付状态')}</p>
        </div>
      </div>

      {loading && topups.length === 0 ? (
        <div className='wallet-history-side-loading'>
          <Spin size='large' />
        </div>
      ) : topups.length === 0 ? (
        <Empty
          image={<IllustrationNoResult style={{ width: 120, height: 120 }} />}
          darkModeImage={
            <IllustrationNoResultDark style={{ width: 120, height: 120 }} />
          }
          description={t('暂无充值记录')}
          className='wallet-history-side-empty'
        />
      ) : (
        <div className='wallet-history-side-table-wrap'>
          <Table
            className='wallet-history-table wallet-history-side-table'
            columns={columns}
            dataSource={topups}
            loading={loading}
            rowKey='id'
            pagination={{
              currentPage: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOpts: [10, 20, 50, 100],
              onPageChange: handlePageChange,
              onPageSizeChange: handlePageSizeChange,
            }}
            size='small'
          />
        </div>
      )}
    </section>
  );
};

export default TopupHistoryCard;
