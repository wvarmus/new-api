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

const formatRatio = (ratio) => {
  const normalizedRatio = ratio ?? 1;
  const numericRatio = Number(normalizedRatio);
  if (Number.isFinite(numericRatio)) {
    return `${Number.parseFloat(numericRatio.toFixed(4))}x`;
  }
  return `${normalizedRatio}x`;
};

const PricingGroups = ({
  filterGroup,
  setFilterGroup,
  usableGroup = {},
  groupRatio = {},
  loading = false,
  t,
}) => {
  const groups = [
    'all',
    ...Object.keys(usableGroup).filter((key) => key !== '' && key !== 'auto'),
  ];

  const items = groups.map((group) => ({
    value: group,
    label: group === 'all' ? t('全部分组') : group,
    tagCount: group === 'all' ? undefined : formatRatio(groupRatio[group]),
  }));

  return (
    <PricingFilterChips
      title={t('可用令牌分组')}
      items={items}
      activeValue={filterGroup}
      onChange={setFilterGroup}
      loading={loading}
      className='pricing-filter-chip-section-teal'
      skeletonCount={12}
    />
  );
};

export default PricingGroups;
