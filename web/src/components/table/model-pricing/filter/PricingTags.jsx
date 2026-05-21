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
import PricingFilterChips from './PricingFilterChips';

const TAG_ORDER = [
  '工具调用',
  '开源权重',
  '上下文128k',
  '上下文1m',
  '上下文200k',
  '上下文256k',
  '上下文32k',
  '上下文400k',
  '图像理解',
  '推理增强',
  '文件理解',
  '音频理解',
];

const getTagOrderIndex = (tag) => {
  const index = TAG_ORDER.indexOf(tag);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

/**
 * 模型标签筛选组件
 * @param {string|'all'} filterTag 当前选中的标签
 * @param {Function} setFilterTag setter
 * @param {Array} models 当前过滤后模型列表（用于计数）
 * @param {Array} allModels 所有模型列表（用于获取所有标签）
 * @param {boolean} loading 是否加载中
 * @param {Function} t i18n
 */
const PricingTags = ({
  filterTag,
  setFilterTag,
  models = [],
  allModels = [],
  loading = false,
  t,
}) => {
  // 提取系统所有标签
  const getAllTags = React.useMemo(() => {
    const tagSet = new Set();

    (allModels.length > 0 ? allModels : models).forEach((model) => {
      if (model.tags) {
        model.tags
          .split(/[,;|]+/) // 逗号、分号或竖线（保留空格，允许多词标签如 "open weights"）
          .map((tag) => tag.trim())
          .filter(Boolean)
          .forEach((tag) => tagSet.add(tag.toLowerCase()));
      }
    });

    return Array.from(tagSet).sort((a, b) => {
      const orderDiff = getTagOrderIndex(a) - getTagOrderIndex(b);
      if (orderDiff !== 0) return orderDiff;
      return a.localeCompare(b);
    });
  }, [allModels, models]);

  // 计算标签对应的模型数量
  const getTagCount = React.useCallback(
    (tag) => {
      if (tag === 'all') return models.length;

      const tagLower = tag.toLowerCase();
      return models.filter((model) => {
        if (!model.tags) return false;
        return model.tags
          .toLowerCase()
          .split(/[,;|]+/)
          .map((tg) => tg.trim())
          .includes(tagLower);
      }).length;
    },
    [models],
  );

  const items = React.useMemo(() => {
    const result = [
      {
        value: 'all',
        label: t('全部标签'),
        tagCount: getTagCount('all'),
      },
    ];

    getAllTags.forEach((tag) => {
      const count = getTagCount(tag);
      result.push({
        value: tag,
        label: tag,
        tagCount: count,
      });
    });

    return result;
  }, [getAllTags, getTagCount, t, models.length]);

  return (
    <PricingFilterChips
      title={t('标签')}
      items={items}
      activeValue={filterTag}
      onChange={setFilterTag}
      loading={loading}
      className='pricing-filter-chip-section-rose'
      skeletonCount={8}
    />
  );
};

export default PricingTags;
