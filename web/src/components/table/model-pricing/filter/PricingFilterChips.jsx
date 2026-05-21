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

const PricingFilterChips = ({
  title,
  items = [],
  activeValue,
  onChange,
  loading = false,
  className = '',
  skeletonCount = 6,
}) => {
  const isActive = (value) =>
    Array.isArray(activeValue)
      ? activeValue.includes(value)
      : activeValue === value;

  return (
    <section className={`pricing-filter-chip-section ${className}`}>
      {title && <div className='pricing-filter-section-title'>{title}</div>}
      <div className='pricing-filter-chip-grid'>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, index) => (
              <span
                className='pricing-filter-chip pricing-filter-chip-skeleton'
                key={index}
              />
            ))
          : items.map((item) => {
              const active = isActive(item.value);
              const muted =
                item.tagCount !== undefined &&
                Number(item.tagCount) === 0 &&
                !active;

              return (
                <button
                  type='button'
                  className={`pricing-filter-chip ${
                    active ? 'pricing-filter-chip-active' : ''
                  } ${muted ? 'pricing-filter-chip-muted' : ''}`}
                  key={item.value}
                  onClick={() => onChange?.(item.value)}
                  title={item.label}
                >
                  {item.icon && (
                    <span className='pricing-filter-chip-icon'>
                      {item.icon}
                    </span>
                  )}
                  <span className='pricing-filter-chip-label'>
                    {item.label}
                  </span>
                  {item.tagCount !== undefined && item.tagCount !== '' && (
                    <span className='pricing-filter-chip-count'>
                      {item.tagCount}
                    </span>
                  )}
                </button>
              );
            })}
      </div>
    </section>
  );
};

export default PricingFilterChips;
