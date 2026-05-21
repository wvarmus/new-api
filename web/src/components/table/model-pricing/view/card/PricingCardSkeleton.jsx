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
import { Card, Skeleton } from '@douyinfe/semi-ui';

const PricingCardSkeleton = ({ skeletonCount = 20 }) => {
  const placeholder = (
    <div className='pricing-card-view'>
      <div className='pricing-model-grid pricing-model-skeleton-grid'>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Card
            key={index}
            className='pricing-model-card pricing-model-card-skeleton'
            bodyStyle={{ height: '100%' }}
          >
            <div className='pricing-model-card-body'>
              <div className='pricing-card-topline'>
                <div className='pricing-card-title-group'>
                  <div className='pricing-model-logo pricing-skeleton-logo'>
                    <Skeleton.Avatar
                      size='large'
                      style={{ width: 36, height: 36, borderRadius: 12 }}
                    />
                  </div>

                  <div className='pricing-card-title-text'>
                    <Skeleton.Title
                      style={{
                        width: `${88 + (index % 3) * 16}px`,
                        height: 20,
                        marginBottom: 0,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className='pricing-card-description pricing-card-skeleton-description'>
                <Skeleton.Paragraph
                  rows={2}
                  title={false}
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div className='pricing-card-tags'>
                <div className='pricing-card-capabilities pricing-card-skeleton-tags'>
                  {Array.from({ length: 4 + (index % 2) }).map(
                    (_, tagIndex) => (
                      <Skeleton.Button
                        key={tagIndex}
                        size='small'
                        style={{
                          width: 44 + ((index + tagIndex) % 3) * 16,
                          height: 21,
                          borderRadius: 999,
                        }}
                      />
                    ),
                  )}
                </div>
              </div>

              <div className='pricing-card-prices'>
                <div className='pricing-card-price-grid'>
                  {Array.from({ length: 4 }).map((_, priceIndex) => (
                    <div
                      className='pricing-card-price-item pricing-card-price-skeleton'
                      key={`price-row-${priceIndex}`}
                    >
                      <Skeleton.Title
                        style={{
                          width: 52 + (priceIndex % 2) * 10,
                          height: 12,
                          marginBottom: 0,
                        }}
                      />
                      <Skeleton.Title
                        style={{
                          width: 58 + ((index + priceIndex) % 2) * 10,
                          height: 14,
                          marginBottom: 0,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className='pricing-skeleton-pagination'>
        <Skeleton.Button style={{ width: 260, height: 32, borderRadius: 8 }} />
      </div>
    </div>
  );

  return <Skeleton loading={true} active placeholder={placeholder}></Skeleton>;
};

export default PricingCardSkeleton;
