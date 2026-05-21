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
import { Input } from '@douyinfe/semi-ui';
import { Search } from 'lucide-react';

const SearchActions = memo(
  ({
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    searchValue = '',
    t,
  }) => {
    return (
      <div className='pricing-actions'>
        <div className='pricing-actions-search'>
          <Input
            prefix={
              <span className='pricing-search-input-icon'>
                <Search size={16} />
              </span>
            }
            placeholder={t('搜索模型、标签或描述')}
            value={searchValue}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onChange={handleChange}
            showClear
          />
        </div>
      </div>
    );
  },
);

SearchActions.displayName = 'SearchActions';

export default SearchActions;
