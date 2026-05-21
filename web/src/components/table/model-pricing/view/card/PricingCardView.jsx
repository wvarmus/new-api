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
import {
  Card,
  Tag,
  Tooltip,
  Empty,
  Pagination,
  Avatar,
} from '@douyinfe/semi-ui';
import { Info, Layers3 } from 'lucide-react';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import {
  stringToColor,
  calculateModelPrice,
  formatDynamicPriceSummary,
  getModelPriceItems,
  getLobeHubIcon,
} from '../../../../../helpers';
import PricingCardSkeleton from './PricingCardSkeleton';
import { useMinimumLoadingTime } from '../../../../../hooks/common/useMinimumLoadingTime';
import { renderLimitedItems } from '../../../../common/ui/RenderUtils';
import { useIsMobile } from '../../../../../hooks/common/useIsMobile';

const CARD_STYLES = {
  container: 'pricing-model-logo',
  icon: 'w-9 h-9 flex items-center justify-center',
};

const CARD_PRICE_SLOTS = [
  {
    key: 'input',
    itemKeys: ['input', 'input-ratio'],
    label: (t) => t('输入价格'),
  },
  {
    key: 'completion',
    itemKeys: ['completion', 'completion-ratio'],
    label: (t) => t('输出价格'),
  },
  {
    key: 'cache',
    itemKeys: ['cache', 'cache-ratio'],
    label: (t) => t('缓存读取'),
  },
  {
    key: 'create-cache',
    itemKeys: ['create-cache', 'create-cache-ratio'],
    label: (t) => t('缓存创建'),
  },
];

const CARD_TONE = {
  accent: '#2563eb',
  accentSoft: 'rgba(37, 99, 235, 0.13)',
  accentWash: 'rgba(37, 99, 235, 0.07)',
};

const PricingCardView = ({
  filteredModels,
  loading,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  selectedGroup,
  groupRatio,
  setModalImageUrl,
  setIsModalOpenurl,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  t,
  openModelDetail,
}) => {
  const showSkeleton = useMinimumLoadingTime(loading);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedModels = filteredModels.slice(
    startIndex,
    startIndex + pageSize,
  );
  const getModelKey = (model) => model.key ?? model.model_name ?? model.id;
  const isMobile = useIsMobile();

  const getCardTone = () => {
    return {
      '--pricing-card-accent': CARD_TONE.accent,
      '--pricing-card-accent-soft': CARD_TONE.accentSoft,
      '--pricing-card-accent-wash': CARD_TONE.accentWash,
    };
  };

  // 获取模型图标
  const getModelIcon = (model) => {
    if (!model || !model.model_name) {
      return (
        <div className={CARD_STYLES.container}>
          <Avatar size='large'>?</Avatar>
        </div>
      );
    }
    // 1) 优先使用模型自定义图标
    if (model.icon) {
      return (
        <div className={CARD_STYLES.container}>
          <div className={CARD_STYLES.icon}>
            {getLobeHubIcon(model.icon, 36)}
          </div>
        </div>
      );
    }
    // 2) 退化为供应商图标
    if (model.vendor_icon) {
      return (
        <div className={CARD_STYLES.container}>
          <div className={CARD_STYLES.icon}>
            {getLobeHubIcon(model.vendor_icon, 36)}
          </div>
        </div>
      );
    }

    // 如果没有供应商图标，使用模型名称生成头像

    const avatarText = model.model_name.slice(0, 2).toUpperCase();
    return (
      <div className={CARD_STYLES.container}>
        <Avatar
          size='large'
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          {avatarText}
        </Avatar>
      </div>
    );
  };

  // 获取模型描述
  const getModelDescription = (record) => {
    return record.description || '';
  };

  const getBillingTag = (record) => {
    if (record.quota_type === 1) {
      return (
        <Tag
          key='billing'
          className='pricing-card-billing'
          shape='circle'
          color='teal'
          size='small'
        >
          {t('按次计费')}
        </Tag>
      );
    }
    if (record.quota_type === 0) {
      return (
        <Tag
          key='billing'
          className='pricing-card-billing'
          shape='circle'
          color='blue'
          size='small'
        >
          {t('按量计费')}
        </Tag>
      );
    }
    return (
      <Tag
        key='billing'
        className='pricing-card-billing'
        shape='circle'
        color='grey'
        size='small'
      >
        {t('未知计费')}
      </Tag>
    );
  };

  const getModelTags = (record) =>
    record.tags
      ? record.tags
          .split(/[,;|]+/)
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  const renderCapabilityTags = (record) => {
    const endpointTags = Array.isArray(record.supported_endpoint_types)
      ? record.supported_endpoint_types.slice(0, 3).map((endpoint) => (
          <Tag key={`endpoint-${endpoint}`} shape='circle' size='small'>
            {endpoint}
          </Tag>
        ))
      : [];

    const customTags = getModelTags(record)
      .slice(0, 4)
      .map((tag) => (
        <Tag
          key={`custom-${tag}`}
          shape='circle'
          color={stringToColor(tag)}
          size='small'
        >
          {tag}
        </Tag>
      ));

    const items = [...endpointTags, ...customTags].map((tag, idx) => ({
      key: tag.key || idx,
      element: tag,
    }));

    if (items.length === 0) {
      return <span className='pricing-card-muted'>{t('暂无能力标签')}</span>;
    }

    return renderLimitedItems({
      items,
      renderItem: (item) => item.element,
      maxDisplay: 5,
    });
  };

  const getCompactSuffix = (suffix = '') =>
    suffix
      .replace(/\s*\/\s*1([MK])\s*Tokens/i, '/$1')
      .replace(/\s*\/\s*/g, '/');

  const normalizeCardPriceItem = (item, fallback) => ({
    key: item?.key || fallback.key,
    label: item?.suffix === 'x' ? item.label : fallback.label(t),
    value:
      item?.value !== null && item?.value !== undefined && item?.value !== ''
        ? item.value
        : '-',
    suffix: item?.value ? getCompactSuffix(item.suffix) : '',
    unitSuffix: getCompactSuffix(item?.suffix || fallback.unitSuffix || ''),
  });

  const renderPriceItems = (priceData) => {
    if (priceData.isDynamicPricing) {
      return (
        <div className='pricing-card-dynamic-price'>
          {formatDynamicPriceSummary(
            priceData.billingExpr,
            t,
            priceData.usedGroupRatio,
          )}
        </div>
      );
    }

    const priceItems = getModelPriceItems(priceData, t, siteDisplayType);
    const priceMap = new Map(priceItems.map((item) => [item.key, item]));
    const fixedPriceItem = priceMap.get('fixed');
    const findPriceItem = (slot) =>
      (slot.itemKeys || [slot.key])
        .map((key) => priceMap.get(key))
        .find(Boolean);
    const defaultUnitSuffix = getCompactSuffix(
      priceItems.find((item) => item.suffix?.includes('Tokens'))?.suffix ||
        priceItems.find((item) => item.suffix)?.suffix ||
        '',
    );
    const cardItems = priceData.isPerToken
      ? CARD_PRICE_SLOTS.map((slot) =>
          normalizeCardPriceItem(findPriceItem(slot), {
            ...slot,
            unitSuffix: defaultUnitSuffix,
          }),
        )
      : [
          normalizeCardPriceItem(fixedPriceItem, {
            key: 'fixed',
            label: (t) => t('模型价格'),
          }),
          ...CARD_PRICE_SLOTS.slice(1).map((slot) =>
            normalizeCardPriceItem(null, slot),
          ),
        ];
    const priceLabelSuffix = t('价格');
    const getCompactPriceLabel = (label = '') =>
      label.endsWith(priceLabelSuffix)
        ? label.slice(0, -priceLabelSuffix.length)
        : label;
    const getCardPriceLabel = (item) => {
      const suffix = item.unitSuffix || '';
      const label = item.label || '';
      if (suffix.startsWith('/')) return `${label}${suffix}`;
      return getCompactPriceLabel(label);
    };
    const shouldRenderValueSuffix = (item) =>
      item.value !== '-' && item.suffix && !item.unitSuffix?.startsWith('/');

    return (
      <div className='pricing-card-prices'>
        <div className='pricing-card-price-grid'>
          {cardItems.map((item) => (
            <div
              className={`pricing-card-price-item ${
                item.value === '-' ? 'pricing-card-price-empty' : ''
              }`}
              key={item.key}
              title={`${getCardPriceLabel(item)} ${item.value}${
                shouldRenderValueSuffix(item) ? item.suffix : ''
              }`}
            >
              <span className='pricing-card-price-name'>
                {getCardPriceLabel(item)}
              </span>
              <strong className='pricing-card-price-value'>
                {item.value}
                {shouldRenderValueSuffix(item) && <small>{item.suffix}</small>}
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 显示骨架屏
  if (showSkeleton) {
    return <PricingCardSkeleton />;
  }

  if (!filteredModels || filteredModels.length === 0) {
    return (
      <div className='flex justify-center items-center py-20'>
        <Empty
          image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
          }
          description={t('搜索无结果')}
        />
      </div>
    );
  }

  return (
    <div className='pricing-card-view'>
      <div className='pricing-model-grid'>
        {paginatedModels.map((model, index) => {
          const modelKey = getModelKey(model);

          const priceData = calculateModelPrice({
            record: model,
            selectedGroup,
            groupRatio,
            tokenUnit,
            displayPrice,
            currency,
            quotaDisplayType: siteDisplayType,
          });

          return (
            <Card
              key={modelKey || index}
              className='pricing-model-card'
              bodyStyle={{ height: '100%' }}
              style={getCardTone()}
              onClick={() => openModelDetail && openModelDetail(model)}
            >
              <div className='pricing-model-card-body'>
                <div className='pricing-card-ambient' />
                <div className='pricing-card-topline'>
                  <div className='pricing-card-title-group'>
                    {getModelIcon(model)}
                    <div className='pricing-card-title-text'>
                      <h3 title={model.model_name}>{model.model_name}</h3>
                    </div>
                  </div>
                  {getBillingTag(model)}
                </div>

                <div className='pricing-card-tags'>
                  <div className='pricing-card-capabilities'>
                    {renderCapabilityTags(model)}
                  </div>
                </div>

                <p className='pricing-card-description'>
                  {getModelDescription(model) || t('暂无模型描述')}
                </p>

                {renderPriceItems(priceData)}

                <div className='pricing-card-footer'>
                  <div className='pricing-card-group'>
                    <Layers3 size={13} />
                    <span>
                      {priceData.usedGroup === 'all'
                        ? t('最优分组')
                        : priceData.usedGroup || t('默认分组')}
                    </span>
                    <strong>{priceData?.usedGroupRatio ?? 1}x</strong>
                  </div>

                  {showRatio && (
                    <div className='pricing-card-ratio'>
                      <div>
                        <span>{t('模型')}</span>
                        <strong>
                          {model.quota_type === 0 ? model.model_ratio : t('无')}
                        </strong>
                      </div>
                      <div>
                        <span>{t('补全')}</span>
                        <strong>
                          {model.quota_type === 0
                            ? parseFloat(model.completion_ratio.toFixed(3))
                            : t('无')}
                        </strong>
                      </div>
                      <div>
                        <Tooltip
                          content={t('倍率是为了方便换算不同价格的模型')}
                        >
                          <button
                            type='button'
                            className='pricing-ratio-help'
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImageUrl('/ratio.png');
                              setIsModalOpenurl(true);
                            }}
                          >
                            <Info size={13} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 分页 */}
      {filteredModels.length > 0 && (
        <div className='flex justify-center mt-6 py-4 border-t pricing-pagination-divider'>
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            total={filteredModels.length}
            showSizeChanger={true}
            pageSizeOptions={[10, 20, 50, 100]}
            size={isMobile ? 'small' : 'default'}
            showQuickJumper={isMobile}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PricingCardView;
