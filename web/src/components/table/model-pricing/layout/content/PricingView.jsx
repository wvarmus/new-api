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
import { Button, Empty } from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import PricingTable from '../../view/table/PricingTable';
import PricingCardView from '../../view/card/PricingCardView';

const PricingView = ({ viewMode = 'table', ...props }) => {
  const { pricingError, isExampleData, loading, refresh, t } = props;

  if (pricingError && !isExampleData && !loading) {
    return (
      <div className='pricing-unavailable-state'>
        <Empty
          image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
          }
          description={
            <div className='pricing-unavailable-copy'>
              <strong>{t('模型数据暂时不可用')}</strong>
              <span>{pricingError}</span>
            </div>
          }
        />
        <Button type='primary' theme='solid' onClick={refresh}>
          {t('重试')}
        </Button>
      </div>
    );
  }

  return (
    <>
      {viewMode === 'card' ? (
        <PricingCardView {...props} />
      ) : (
        <PricingTable {...props} />
      )}
    </>
  );
};

export default PricingView;
