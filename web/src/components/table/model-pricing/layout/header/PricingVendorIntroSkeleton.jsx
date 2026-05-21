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

import React, { memo } from 'react';
import { Skeleton } from '@douyinfe/semi-ui';

const rect = (style = {}) => (
  <div className='pricing-toolbar-skeleton-block' style={style} />
);

const PricingVendorIntroSkeleton = memo(() => {
  const placeholder = (
    <div className='pricing-market-hero pricing-market-hero-skeleton'>
      <div className='pricing-market-toolbar'>
        <div className='pricing-market-summary pricing-market-summary-skeleton'>
          {rect({ width: 42, height: 18, borderRadius: 999 })}
          {rect({ width: 34, height: 24, borderRadius: 8 })}
        </div>

        <div className='pricing-hero-actions pricing-hero-actions-skeleton'>
          <div className='pricing-actions'>
            <div className='pricing-actions-search'>
              {rect({ width: '100%', height: 38, borderRadius: 12 })}
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
              <React.Fragment key={index}>
                {rect({
                  width: 70,
                  height: 38,
                  borderRadius: 10,
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return <Skeleton loading={true} active placeholder={placeholder}></Skeleton>;
});

PricingVendorIntroSkeleton.displayName = 'PricingVendorIntroSkeleton';

export default PricingVendorIntroSkeleton;
