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

import React, { useMemo, useState } from 'react';
import { Modal, TextArea, Typography, Tag } from '@douyinfe/semi-ui';

const { Text } = Typography;

const parseRedemptionKeys = (value) => {
  const seen = new Set();
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    });
};

const BatchDisableRedemptionsModal = ({
  visible,
  onCancel,
  batchDisableRedemptions,
  loading,
  t,
}) => {
  const [value, setValue] = useState('');
  const keys = useMemo(() => parseRedemptionKeys(value), [value]);

  const handleCancel = () => {
    setValue('');
    onCancel();
  };

  const handleConfirm = async () => {
    const result = await batchDisableRedemptions(keys);
    if (result) {
      setValue('');
      onCancel();
    }
  };

  return (
    <Modal
      title={t('批量禁用兑换码')}
      visible={visible}
      onCancel={handleCancel}
      onOk={handleConfirm}
      okText={t('确定禁用')}
      cancelText={t('取消')}
      okButtonProps={{
        type: 'danger',
        disabled: keys.length === 0 || loading,
        loading,
      }}
      cancelButtonProps={{ disabled: loading }}
      width={640}
    >
      <div className='flex flex-col gap-3'>
        <TextArea
          value={value}
          onChange={setValue}
          autosize={{ minRows: 8, maxRows: 14 }}
          placeholder={t('每行一个兑换码')}
        />
        <div className='flex flex-wrap items-center gap-2'>
          <Tag color={keys.length > 0 ? 'red' : 'grey'} shape='circle'>
            {t('已识别 {{count}} 个兑换码', { count: keys.length })}
          </Tag>
          <Text size='small' type='tertiary'>
            {t('只会禁用未使用且未过期的兑换码')}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default BatchDisableRedemptionsModal;
