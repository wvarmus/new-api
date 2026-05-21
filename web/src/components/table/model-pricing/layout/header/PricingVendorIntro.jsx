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

import React, { memo, useCallback } from 'react';
import SearchActions from './SearchActions';

const PricingVendorIntro = memo(
  ({
    models = [],
    t,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    searchValue = '',
    viewMode,
    setViewMode,
  }) => {
    const currentModelCount = models.length;

    const renderSearchActions = useCallback(
      () => (
        <SearchActions
          handleChange={handleChange}
          handleCompositionStart={handleCompositionStart}
          handleCompositionEnd={handleCompositionEnd}
          searchValue={searchValue}
          viewMode={viewMode}
          setViewMode={setViewMode}
          t={t}
        />
      ),
      [
        handleChange,
        handleCompositionStart,
        handleCompositionEnd,
        searchValue,
        viewMode,
        setViewMode,
        t,
      ],
    );

    return (
      <div className='pricing-market-hero'>
        <div className='pricing-market-toolbar'>
          <div className='pricing-market-summary'>
            <span>{t('模型')}</span>
            <strong className='pricing-result-count'>
              {currentModelCount}
            </strong>
          </div>

          <div className='pricing-hero-actions'>{renderSearchActions()}</div>
        </div>
      </div>
    );
  },
);

PricingVendorIntro.displayName = 'PricingVendorIntro';

export default PricingVendorIntro;
