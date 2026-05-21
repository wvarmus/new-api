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

import React from 'react';
import { Avatar, Typography, Tag } from '@douyinfe/semi-ui';
import { IconCoinMoneyStroked } from '@douyinfe/semi-icons';
import {
  calculateModelPrice,
  getModelPriceItems,
} from '../../../../../helpers';

const { Text } = Typography;

const ModelPricingTable = ({
  modelData,
  groupRatio,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  usableGroup,
  t,
}) => {
  const modelEnableGroups = Array.isArray(modelData?.enable_groups)
    ? modelData.enable_groups
    : [];

  const availableGroups = Object.keys(usableGroup || {})
    .filter((g) => g !== '')
    .filter((g) => g !== 'auto')
    .filter((g) => modelEnableGroups.includes(g));

  const getBillingType = () => {
    if (modelData?.billing_mode === 'tiered_expr') return t('动态计费');
    if (modelData?.quota_type === 0) return t('按量计费');
    if (modelData?.quota_type === 1) return t('按次计费');
    return '-';
  };

  const getBillingColor = (billingType) => {
    if (billingType === t('按量计费')) return 'blue';
    if (billingType === t('按次计费')) return 'teal';
    if (billingType === t('动态计费')) return 'amber';
    return 'white';
  };

  const groupPriceData = availableGroups.map((group) => {
    const priceData = modelData
      ? calculateModelPrice({
          record: modelData,
          selectedGroup: group,
          groupRatio,
          tokenUnit,
          displayPrice,
          currency,
          quotaDisplayType: siteDisplayType,
        })
      : { inputPrice: '-', outputPrice: '-', price: '-' };

    const billingType = getBillingType();

    return {
      key: group,
      group,
      description: usableGroup?.[group] || t('暂无分组描述'),
      billingType,
      billingColor: getBillingColor(billingType),
      priceItems: getModelPriceItems(priceData, t, siteDisplayType),
    };
  });

  const getPriceItem = (items, keys) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    return items.find((item) => keyList.includes(item.key));
  };

  const renderPriceCell = (items, keys, emptyText = '-') => {
    if (items.length === 1 && items[0].isDynamic) {
      return <span className='model-pricing-table-muted'>{t('动态')}</span>;
    }

    const item = getPriceItem(items, keys);
    if (!item) {
      return <span className='model-pricing-table-muted'>{emptyText}</span>;
    }

    return (
      <span className='model-pricing-table-price'>
        {item.value}
        <small>{item.suffix}</small>
      </span>
    );
  };

  const renderUnsupportedCell = () => {
    return <span className='model-pricing-table-muted'>-</span>;
  };

  const getPrimaryPriceHeader = () => {
    if (modelData?.quota_type === 1) return t('价格');
    if (siteDisplayType === 'TOKENS') return t('输入倍率');
    return t('输入/M');
  };

  const getOutputPriceHeader = () => {
    if (siteDisplayType === 'TOKENS') return t('输出倍率');
    return t('输出/M');
  };

  const getCacheReadHeader = () => {
    if (siteDisplayType === 'TOKENS') return t('缓存读取倍率');
    return t('缓存读取/M');
  };

  const getCacheCreateHeader = () => {
    if (siteDisplayType === 'TOKENS') return t('缓存创建倍率');
    return t('缓存创建/M');
  };

  const getGroupPriceRows = (item) => {
    if (modelData?.quota_type === 1) {
      return [
        {
          key: 'fixed',
          label: getPrimaryPriceHeader(),
          value: renderPriceCell(item.priceItems, 'fixed'),
        },
        {
          key: 'output',
          label: getOutputPriceHeader(),
          value: renderUnsupportedCell(),
        },
        {
          key: 'cache',
          label: getCacheReadHeader(),
          value: renderUnsupportedCell(),
        },
        {
          key: 'create-cache',
          label: getCacheCreateHeader(),
          value: renderUnsupportedCell(),
        },
      ];
    }

    return [
      {
        key: 'input',
        label: getPrimaryPriceHeader(),
        value: renderPriceCell(item.priceItems, ['input', 'input-ratio']),
      },
      {
        key: 'completion',
        label: getOutputPriceHeader(),
        value: renderPriceCell(item.priceItems, [
          'completion',
          'completion-ratio',
        ]),
      },
      {
        key: 'cache',
        label: getCacheReadHeader(),
        value: renderPriceCell(item.priceItems, ['cache', 'cache-ratio']),
      },
      {
        key: 'create-cache',
        label: getCacheCreateHeader(),
        value: renderPriceCell(item.priceItems, [
          'create-cache',
          'create-cache-ratio',
        ]),
      },
    ];
  };

  return (
    <div className='model-detail-info-block model-pricing-info-block'>
      <div className='model-detail-section-heading model-pricing-section-heading'>
        <Avatar
          size='small'
          color='orange'
          className='model-detail-section-icon model-detail-section-icon-orange'
        >
          <IconCoinMoneyStroked size={16} />
        </Avatar>
        <div>
          <Text className='model-detail-section-title'>{t('分组价格')}</Text>
          <div className='model-detail-section-subtitle'>
            {t('不同用户分组的价格信息')}
          </div>
        </div>
      </div>

      {groupPriceData.length === 0 ? (
        <div className='model-group-empty'>
          {t('当前模型没有匹配到可用分组')}
        </div>
      ) : (
        <div className='model-group-price-list'>
          {groupPriceData.map((item) => (
            <section className='model-group-price-card' key={item.key}>
              <div className='model-group-price-header'>
                <div className='model-group-title-block'>
                  <div className='model-group-title'>
                    <span>{item.group}</span>
                  </div>
                </div>
                <Tag
                  className='model-group-billing-tag pricing-card-billing'
                  color={item.billingColor}
                  size='small'
                  shape='circle'
                >
                  {item.billingType}
                </Tag>
              </div>
              <p className='model-group-description'>{item.description}</p>

              <div className='model-group-price-grid'>
                {getGroupPriceRows(item).map((priceItem) => (
                  <div className='model-group-price-item' key={priceItem.key}>
                    <span>{priceItem.label}</span>
                    <div className='model-group-price-value'>
                      {priceItem.value}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelPricingTable;
