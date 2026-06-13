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

import React, { useEffect, useState, useContext, useRef, useMemo } from 'react';
import {
  API,
  showError,
  showSuccess,
  timestamp2string,
  renderGroupOption,
  getCurrencyConfig,
  getModelCategories,
  getLobeHubIcon,
  selectFilter,
  calculateModelPrice,
  getModelPriceItems,
} from '../../../../helpers';
import {
  quotaToDisplayAmount,
  displayAmountToQuota,
} from '../../../../helpers/quota';
import { useModelPricingData } from '../../../../hooks/model-pricing/useModelPricingData';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import {
  Button,
  SideSheet,
  Space,
  Spin,
  Typography,
  Card,
  Tag,
  Avatar,
  Form,
  Col,
  Row,
  InputNumber,
  Modal,
} from '@douyinfe/semi-ui';
import {
  IconCreditCard,
  IconLink,
  IconSave,
  IconClose,
  IconKey,
  IconHelpCircle,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { StatusContext } from '../../../../context/Status';

const { Text, Title } = Typography;

const EditTokenModal = (props) => {
  const { t } = useTranslation();
  const [statusState, statusDispatch] = useContext(StatusContext);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const formApiRef = useRef(null);
  const [models, setModels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showQuotaInput, setShowQuotaInput] = useState(false);
  const [beginnerGuideVisible, setBeginnerGuideVisible] = useState(false);
  const [beginnerVendor, setBeginnerVendor] = useState('');
  const [beginnerModel, setBeginnerModel] = useState('');
  const [recommendedGroup, setRecommendedGroup] = useState('');
  const {
    models: pricingModels,
    vendorsMap: pricingVendorsMap,
    groupRatio: pricingGroupRatio,
    usableGroup: pricingUsableGroup,
    currency: pricingCurrency,
    siteDisplayType: pricingSiteDisplayType,
    tokenUnit: pricingTokenUnit,
    displayPrice: pricingDisplayPrice,
    loading: pricingLoading,
    refresh: refreshPricingData,
  } = useModelPricingData();
  const isEdit = props.editingToken.id !== undefined;
  const unknownVendorKey = '__unknown__';

  const getInitValues = () => ({
    name: '',
    remain_quota: 0,
    remain_amount: 0,
    expired_time: -1,
    unlimited_quota: true,
    model_limits_enabled: false,
    model_limits: [],
    allow_ips: '',
    group: '',
    cross_group_retry: false,
    tokenCount: 1,
  });

  const getModelName = (model) => model?.model_name || model?.value || '';

  const getVendorKeyForModel = (model) => {
    if (
      model?.vendor_id !== undefined &&
      model?.vendor_id !== null &&
      model?.vendor_id !== ''
    ) {
      return String(model.vendor_id);
    }
    return unknownVendorKey;
  };

  const beginnerVendorOptions = useMemo(() => {
    const vendorCounts = {};
    const vendorDetails = {};

    Object.values(pricingVendorsMap || {}).forEach((vendor) => {
      if (vendor?.id === undefined || vendor?.id === null) return;
      const vendorKey = String(vendor.id);
      vendorDetails[vendorKey] = {
        ...vendor,
        key: vendorKey,
      };
    });

    pricingModels.forEach((model) => {
      const vendorKey = getVendorKeyForModel(model);
      vendorCounts[vendorKey] = (vendorCounts[vendorKey] || 0) + 1;

      if (vendorKey !== unknownVendorKey && !vendorDetails[vendorKey]) {
        vendorDetails[vendorKey] = {
          id: vendorKey,
          key: vendorKey,
          name: model.vendor_name || vendorKey,
          icon: model.vendor_icon || model.icon || '',
          description: model.vendor_description || '',
        };
      }
    });

    const options = Object.entries(vendorCounts)
      .filter(([vendorKey]) => vendorKey !== unknownVendorKey)
      .map(([vendorKey, count]) => ({
        ...(vendorDetails[vendorKey] || {}),
        id: vendorDetails[vendorKey]?.id || vendorKey,
        key: vendorKey,
        name: vendorDetails[vendorKey]?.name || vendorKey,
        icon: vendorDetails[vendorKey]?.icon || '',
        description: vendorDetails[vendorKey]?.description || '',
        count,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    if (vendorCounts[unknownVendorKey] > 0) {
      options.push({
        id: unknownVendorKey,
        key: unknownVendorKey,
        name: t('未知供应商'),
        icon: '',
        description: '',
        count: vendorCounts[unknownVendorKey],
      });
    }

    return options;
  }, [pricingModels, pricingVendorsMap, t]);

  const beginnerModelOptions = useMemo(() => {
    if (!beginnerVendor) return [];
    return pricingModels
      .filter((model) => getVendorKeyForModel(model) === beginnerVendor)
      .map((model) => {
        const modelName = getModelName(model);
        return {
          ...model,
          value: modelName,
        };
      })
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [beginnerVendor, pricingModels]);

  const getAvailableGroupsForModel = (modelName) => {
    const pricingModel = pricingModels.find(
      (model) => getModelName(model) === modelName,
    );
    if (!pricingModel) return [];

    const availableGroups = Object.keys(pricingUsableGroup || {})
      .filter((group) => group !== '')
      .filter((group) => group !== 'auto');
    const enabledGroups = Array.isArray(pricingModel.enable_groups)
      ? pricingModel.enable_groups
      : [];

    return availableGroups.filter((group) => enabledGroups.includes(group));
  };

  const getRecommendedGroup = (modelName) => {
    const candidates = getAvailableGroupsForModel(modelName);
    if (candidates.length === 0) return '';

    const currentGroup = formApiRef.current?.getValues?.()?.group;
    if (currentGroup && candidates.includes(currentGroup)) {
      return currentGroup;
    }

    return candidates[0];
  };

  const selectedBeginnerPricingModel = useMemo(
    () =>
      pricingModels.find((model) => getModelName(model) === beginnerModel) ||
      null,
    [beginnerModel, pricingModels],
  );

  const getBillingType = (model) => {
    if (model?.billing_mode === 'tiered_expr') return t('动态计费');
    if (model?.quota_type === 0) return t('按量计费');
    if (model?.quota_type === 1) return t('按次计费');
    return '-';
  };

  const getBillingColor = (billingType) => {
    if (billingType === t('按量计费')) return 'blue';
    if (billingType === t('按次计费')) return 'teal';
    if (billingType === t('动态计费')) return 'amber';
    return 'grey';
  };

  const beginnerGroupOptions = useMemo(() => {
    if (!beginnerModel || !selectedBeginnerPricingModel) return [];

    const billingType = getBillingType(selectedBeginnerPricingModel);
    return getAvailableGroupsForModel(beginnerModel).map((group) => {
      const priceData = calculateModelPrice({
        record: selectedBeginnerPricingModel,
        selectedGroup: group,
        groupRatio: pricingGroupRatio,
        tokenUnit: pricingTokenUnit,
        displayPrice: pricingDisplayPrice,
        currency: pricingCurrency,
        quotaDisplayType: pricingSiteDisplayType,
      });
      const priceItems = getModelPriceItems(
        priceData,
        t,
        pricingSiteDisplayType,
      );

      return {
        group,
        description:
          pricingUsableGroup?.[group] ||
          t('暂无分组描述'),
        billingType,
        billingColor: getBillingColor(billingType),
        priceItems,
      };
    });
  }, [
    beginnerModel,
    selectedBeginnerPricingModel,
    pricingGroupRatio,
    pricingTokenUnit,
    pricingDisplayPrice,
    pricingCurrency,
    pricingSiteDisplayType,
    pricingUsableGroup,
    t,
  ]);

  const renderBeginnerPriceValue = (item) => {
    if (item.isDynamic) {
      return <span className='model-pricing-table-muted'>{t('动态')}</span>;
    }

    return (
      <span className='model-pricing-table-price'>
        {item.value}
        <small>{item.suffix}</small>
      </span>
    );
  };

  const getBeginnerPriceItem = (items, keys) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    return items.find((item) => keyList.includes(item.key));
  };

  const renderBeginnerPriceCell = (items, keys, emptyText = '-') => {
    if (items.length === 1 && items[0].isDynamic) {
      return <span className='model-pricing-table-muted'>{t('动态')}</span>;
    }

    const item = getBeginnerPriceItem(items, keys);
    if (!item) {
      return <span className='model-pricing-table-muted'>{emptyText}</span>;
    }

    return renderBeginnerPriceValue(item);
  };

  const renderBeginnerUnsupportedCell = () => (
    <span className='model-pricing-table-muted'>-</span>
  );

  const getBeginnerPrimaryPriceHeader = () => {
    if (selectedBeginnerPricingModel?.quota_type === 1) return t('价格');
    if (pricingSiteDisplayType === 'TOKENS') return t('输入倍率');
    return t('输入/M');
  };

  const getBeginnerOutputPriceHeader = () => {
    if (pricingSiteDisplayType === 'TOKENS') return t('输出倍率');
    return t('输出/M');
  };

  const getBeginnerCacheReadHeader = () => {
    if (pricingSiteDisplayType === 'TOKENS') return t('缓存读取倍率');
    return t('缓存读取/M');
  };

  const getBeginnerCacheCreateHeader = () => {
    if (pricingSiteDisplayType === 'TOKENS') return t('缓存创建倍率');
    return t('缓存创建/M');
  };

  const getBeginnerGroupPriceRows = (option) => {
    if (selectedBeginnerPricingModel?.quota_type === 1) {
      return [
        {
          key: 'fixed',
          label: getBeginnerPrimaryPriceHeader(),
          value: renderBeginnerPriceCell(option.priceItems, 'fixed'),
        },
        {
          key: 'output',
          label: getBeginnerOutputPriceHeader(),
          value: renderBeginnerUnsupportedCell(),
        },
        {
          key: 'cache',
          label: getBeginnerCacheReadHeader(),
          value: renderBeginnerUnsupportedCell(),
        },
        {
          key: 'create-cache',
          label: getBeginnerCacheCreateHeader(),
          value: renderBeginnerUnsupportedCell(),
        },
      ];
    }

    return [
      {
        key: 'input',
        label: getBeginnerPrimaryPriceHeader(),
        value: renderBeginnerPriceCell(option.priceItems, [
          'input',
          'input-ratio',
        ]),
      },
      {
        key: 'completion',
        label: getBeginnerOutputPriceHeader(),
        value: renderBeginnerPriceCell(option.priceItems, [
          'completion',
          'completion-ratio',
        ]),
      },
      {
        key: 'cache',
        label: getBeginnerCacheReadHeader(),
        value: renderBeginnerPriceCell(option.priceItems, [
          'cache',
          'cache-ratio',
        ]),
      },
      {
        key: 'create-cache',
        label: getBeginnerCacheCreateHeader(),
        value: renderBeginnerPriceCell(option.priceItems, [
          'create-cache',
          'create-cache-ratio',
        ]),
      },
    ];
  };

  const handleCancel = () => {
    props.handleClose();
  };

  const setExpiredTime = (month, day, hour, minute) => {
    let now = new Date();
    let timestamp = now.getTime() / 1000;
    let seconds = month * 30 * 24 * 60 * 60;
    seconds += day * 24 * 60 * 60;
    seconds += hour * 60 * 60;
    seconds += minute * 60;
    if (!formApiRef.current) return;
    if (seconds !== 0) {
      timestamp += seconds;
      formApiRef.current.setValue('expired_time', timestamp2string(timestamp));
    } else {
      formApiRef.current.setValue('expired_time', -1);
    }
  };

  const loadModels = async () => {
    let res = await API.get(`/api/user/models`);
    const { success, message, data } = res.data;
    if (success) {
      const categories = getModelCategories(t);
      let localModelOptions = data.map((model) => {
        let icon = null;
        for (const [key, category] of Object.entries(categories)) {
          if (key !== 'all' && category.filter({ model_name: model })) {
            icon = category.icon;
            break;
          }
        }
        return {
          label: (
            <span className='flex items-center gap-1'>
              {icon}
              {model}
            </span>
          ),
          value: model,
        };
      });
      setModels(localModelOptions);
    } else {
      showError(t(message));
    }
  };

  const loadGroups = async () => {
    let res = await API.get(`/api/user/self/groups`);
    const { success, message, data } = res.data;
    if (success) {
      let localGroupOptions = Object.entries(data).map(([group, info]) => ({
        label: info.desc,
        value: group,
      }));
      if (statusState?.status?.default_use_auto_group) {
        if (localGroupOptions.some((group) => group.value === 'auto')) {
          localGroupOptions.sort((a, b) => (a.value === 'auto' ? -1 : 1));
        }
      }
      setGroups(localGroupOptions);
      // if (statusState?.status?.default_use_auto_group && formApiRef.current) {
      //   formApiRef.current.setValue('group', 'auto');
      // }
    } else {
      showError(t(message));
    }
  };

  const openBeginnerGuide = () => {
    setBeginnerVendor('');
    setBeginnerModel('');
    setRecommendedGroup('');
    setBeginnerGuideVisible(true);
    if (!pricingLoading && pricingModels.length === 0) {
      void refreshPricingData?.();
    }
  };

  const applyRecommendedGroup = () => {
    if (!recommendedGroup) {
      showError(t('请先选择模型'));
      return;
    }
    formApiRef.current?.setValue('group', recommendedGroup);
    setBeginnerGuideVisible(false);
    showSuccess(t('已为你选择推荐分组'));
  };

  const validateRequiredGroup = (_rule, value) => {
    if (value === undefined || value === null || value === '') {
      return Promise.reject(t('请选择令牌分组'));
    }
    return Promise.resolve();
  };

  const renderGroupLabel = () => (
    <div className='flex w-full min-w-0 items-center justify-between gap-2'>
      <span className='flex shrink-0 items-center gap-0.5'>
        <span>{t('令牌分组')}</span>
        <span style={{ color: 'var(--semi-color-danger)' }}>*</span>
      </span>
      {!isEdit && (
        <Button
          theme='light'
          type='primary'
          size='small'
          className='!px-2'
          icon={<IconHelpCircle />}
          htmlType='button'
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openBeginnerGuide();
          }}
        >
          <span className='whitespace-nowrap text-xs'>
            {t('不知道选什么分组➔')} {t('新手入口')}
          </span>
        </Button>
      )}
    </div>
  );

  const loadToken = async () => {
    setLoading(true);
    let res = await API.get(`/api/token/${props.editingToken.id}`);
    const { success, message, data } = res.data;
    if (success) {
      if (data.expired_time !== -1) {
        data.expired_time = timestamp2string(data.expired_time);
      }
      if (data.model_limits !== '') {
        data.model_limits = data.model_limits.split(',');
      } else {
        data.model_limits = [];
      }
      data.remain_amount = Number(
        quotaToDisplayAmount(data.remain_quota || 0).toFixed(6),
      );
      if (formApiRef.current) {
        formApiRef.current.setValues({ ...getInitValues(), ...data });
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (formApiRef.current) {
      if (!isEdit) {
        formApiRef.current.setValues(getInitValues());
      }
    }
    loadModels();
    loadGroups();
  }, [props.editingToken.id]);

  useEffect(() => {
    if (props.visiable) {
      if (isEdit) {
        loadToken();
      } else {
        formApiRef.current?.setValues(getInitValues());
      }
    } else {
      formApiRef.current?.reset();
    }
  }, [props.visiable, props.editingToken.id]);

  useEffect(() => {
    if (beginnerModel) {
      setRecommendedGroup(getRecommendedGroup(beginnerModel));
    }
  }, [beginnerModel, pricingModels, groups, pricingGroupRatio]);

  const generateRandomSuffix = () => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  const submit = async (values) => {
    setLoading(true);
    if (isEdit) {
      let { tokenCount: _tc, ...localInputs } = values;
      localInputs.remain_quota = localInputs.unlimited_quota
        ? 0
        : displayAmountToQuota(localInputs.remain_amount);
      if (!localInputs.unlimited_quota && localInputs.remain_quota <= 0) {
        showError(t('请输入金额'));
        setLoading(false);
        return;
      }
      if (localInputs.expired_time !== -1) {
        let time = Date.parse(localInputs.expired_time);
        if (isNaN(time)) {
          showError(t('过期时间格式错误！'));
          setLoading(false);
          return;
        }
        localInputs.expired_time = Math.ceil(time / 1000);
      }
      localInputs.model_limits = localInputs.model_limits.join(',');
      localInputs.model_limits_enabled = localInputs.model_limits.length > 0;
      let res = await API.put(`/api/token/`, {
        ...localInputs,
        id: parseInt(props.editingToken.id),
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('令牌更新成功！'));
        props.refresh();
        props.handleClose();
      } else {
        showError(t(message));
      }
    } else {
      const count = parseInt(values.tokenCount, 10) || 1;
      let successCount = 0;
      for (let i = 0; i < count; i++) {
        let { tokenCount: _tc, ...localInputs } = values;
        const baseName =
          values.name.trim() === '' ? 'default' : values.name.trim();
        if (i !== 0 || values.name.trim() === '') {
          localInputs.name = `${baseName}-${generateRandomSuffix()}`;
        } else {
          localInputs.name = baseName;
        }
        localInputs.remain_quota = localInputs.unlimited_quota
          ? 0
          : displayAmountToQuota(localInputs.remain_amount);
        if (!localInputs.unlimited_quota && localInputs.remain_quota <= 0) {
          showError(t('请输入金额'));
          setLoading(false);
          break;
        }

        if (localInputs.expired_time !== -1) {
          let time = Date.parse(localInputs.expired_time);
          if (isNaN(time)) {
            showError(t('过期时间格式错误！'));
            setLoading(false);
            break;
          }
          localInputs.expired_time = Math.ceil(time / 1000);
        }
        localInputs.model_limits = localInputs.model_limits.join(',');
        localInputs.model_limits_enabled = localInputs.model_limits.length > 0;
        let res = await API.post(`/api/token/`, localInputs);
        const { success, message } = res.data;
        if (success) {
          successCount++;
        } else {
          showError(t(message));
          break;
        }
      }
      if (successCount > 0) {
        showSuccess(t('令牌创建成功，请在列表页面点击复制获取令牌！'));
        props.refresh();
        props.handleClose();
      }
    }
    setLoading(false);
    formApiRef.current?.setValues(getInitValues());
  };

  return (
    <SideSheet
      placement={isEdit ? 'right' : 'left'}
      title={
        <Space>
          {isEdit ? (
            <Tag color='blue' shape='circle'>
              {t('更新')}
            </Tag>
          ) : (
            <Tag color='green' shape='circle'>
              {t('新建')}
            </Tag>
          )}
          <Title heading={4} className='m-0'>
            {isEdit ? t('更新令牌信息') : t('创建新的令牌')}
          </Title>
        </Space>
      }
      bodyStyle={{ padding: '0' }}
      visible={props.visiable}
      width={isMobile ? '100%' : 600}
      footer={
        <div className='flex justify-end bg-white'>
          <Space>
            <Button
              theme='solid'
              className='!rounded-lg'
              onClick={() => formApiRef.current?.submitForm()}
              icon={<IconSave />}
              loading={loading}
            >
              {t('提交')}
            </Button>
            <Button
              theme='light'
              className='!rounded-lg'
              type='primary'
              onClick={handleCancel}
              icon={<IconClose />}
            >
              {t('取消')}
            </Button>
          </Space>
        </div>
      }
      closeIcon={null}
      onCancel={() => handleCancel()}
    >
      <Spin spinning={loading}>
        <Form
          key={isEdit ? 'edit' : 'new'}
          initValues={getInitValues()}
          getFormApi={(api) => (formApiRef.current = api)}
          onSubmit={submit}
        >
          {({ values }) => (
            <div className='p-2'>
              {/* 基本信息 */}
              <Card className='!rounded-2xl shadow-sm border-0'>
                <div className='flex items-center mb-2'>
                  <Avatar size='small' color='blue' className='mr-2 shadow-md'>
                    <IconKey size={16} />
                  </Avatar>
                  <div>
                    <Text className='text-lg font-medium'>{t('基本信息')}</Text>
                    <div className='text-xs text-gray-600'>
                      {t('设置令牌的基本信息')}
                    </div>
                  </div>
                </div>
                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Input
                      field='name'
                      label={t('名称')}
                      placeholder={t('请输入名称')}
                      rules={[{ required: true, message: t('请输入名称') }]}
                      showClear
                    />
                  </Col>
                  <Col span={24}>
                    {groups.length > 0 ? (
                      <Form.Select
                        field='group'
                        label={renderGroupLabel()}
                        placeholder={t('请选择令牌分组')}
                        rules={[{ validator: validateRequiredGroup }]}
                        optionList={groups}
                        renderOptionItem={renderGroupOption}
                        filter={(input, option) => {
                          const q = input.toLowerCase();
                          return (
                            option.value?.toLowerCase().includes(q) ||
                            (typeof option.label === 'string' &&
                              option.label.toLowerCase().includes(q))
                          );
                        }}
                        showClear
                        style={{ width: '100%' }}
                        dropdownClassName='token-group-select-dropdown'
                        renderSelectedItem={(optionNode) =>
                          optionNode?.value || ''
                        }
                      />
                    ) : (
                      <Form.Select
                        placeholder={t('管理员未设置用户可选分组')}
                        disabled
                        label={renderGroupLabel()}
                        style={{ width: '100%' }}
                      />
                    )}
                  </Col>
                  <Col
                    span={24}
                    style={{
                      display: values.group === 'auto' ? 'block' : 'none',
                    }}
                  >
                    <Form.Switch
                      field='cross_group_retry'
                      label={t('跨分组重试')}
                      size='default'
                      extraText={t(
                        '开启后，当前分组渠道失败时会按顺序尝试下一个分组的渠道',
                      )}
                    />
                  </Col>
                  <Col xs={24} sm={24} md={24} lg={10} xl={10}>
                    <Form.DatePicker
                      field='expired_time'
                      label={t('过期时间')}
                      type='dateTime'
                      placeholder={t('请选择过期时间')}
                      rules={[
                        { required: true, message: t('请选择过期时间') },
                        {
                          validator: (rule, value) => {
                            // 允许 -1 表示永不过期，也允许空值在必填校验时被拦截
                            if (value === -1 || !value)
                              return Promise.resolve();
                            const time = Date.parse(value);
                            if (isNaN(time)) {
                              return Promise.reject(t('过期时间格式错误！'));
                            }
                            if (time <= Date.now()) {
                              return Promise.reject(
                                t('过期时间不能早于当前时间！'),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      showClear
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={24} sm={24} md={24} lg={14} xl={14}>
                    <Form.Slot label={t('过期时间快捷设置')}>
                      <Space wrap>
                        <Button
                          theme='light'
                          type='primary'
                          onClick={() => setExpiredTime(0, 0, 0, 0)}
                        >
                          {t('永不过期')}
                        </Button>
                        <Button
                          theme='light'
                          type='tertiary'
                          onClick={() => setExpiredTime(1, 0, 0, 0)}
                        >
                          {t('一个月')}
                        </Button>
                        <Button
                          theme='light'
                          type='tertiary'
                          onClick={() => setExpiredTime(0, 1, 0, 0)}
                        >
                          {t('一天')}
                        </Button>
                        <Button
                          theme='light'
                          type='tertiary'
                          onClick={() => setExpiredTime(0, 0, 1, 0)}
                        >
                          {t('一小时')}
                        </Button>
                      </Space>
                    </Form.Slot>
                  </Col>
                  {!isEdit && (
                    <Col span={24}>
                      <Form.InputNumber
                        field='tokenCount'
                        label={t('新建数量')}
                        min={1}
                        extraText={t('批量创建时会在名称后自动添加随机后缀')}
                        rules={[
                          { required: true, message: t('请输入新建数量') },
                        ]}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  )}
                </Row>
              </Card>

              {/* 额度设置 */}
              <Card className='!rounded-2xl shadow-sm border-0'>
                <div className='flex items-center mb-2'>
                  <Avatar size='small' color='green' className='mr-2 shadow-md'>
                    <IconCreditCard size={16} />
                  </Avatar>
                  <div>
                    <Text className='text-lg font-medium'>{t('额度设置')}</Text>
                    <div className='text-xs text-gray-600'>
                      {t('设置令牌可用额度和数量')}
                    </div>
                  </div>
                </div>
                <Row gutter={12}>
                  <Col span={24}>
                    <Form.InputNumber
                      field='remain_amount'
                      label={t('金额')}
                      prefix={getCurrencyConfig().symbol}
                      placeholder={t('输入金额')}
                      precision={6}
                      disabled={values.unlimited_quota}
                      min={0}
                      step={0.000001}
                      onChange={(val) => {
                        const amount = val === '' || val == null ? 0 : val;
                        formApiRef.current?.setValue('remain_amount', amount);
                        formApiRef.current?.setValue(
                          'remain_quota',
                          displayAmountToQuota(amount),
                        );
                      }}
                      style={{ width: '100%' }}
                      showClear
                    />
                  </Col>
                  <Col span={24}>
                    <div
                      className='text-xs cursor-pointer mt-1'
                      style={{ color: 'var(--semi-color-text-2)' }}
                      onClick={() => setShowQuotaInput((v) => !v)}
                    >
                      {showQuotaInput
                        ? `▾ ${t('收起原生额度输入')}`
                        : `▸ ${t('使用原生额度输入')}`}
                    </div>
                    <div style={{ display: showQuotaInput ? 'block' : 'none' }} className='mt-2'>
                      <Form.InputNumber
                        field='remain_quota'
                        label={t('额度')}
                        placeholder={t('输入额度')}
                        disabled={values.unlimited_quota}
                        min={0}
                        step={500000}
                        rules={
                          values.unlimited_quota
                            ? []
                            : [{ required: true, message: t('请输入额度') }]
                        }
                        onChange={(val) => {
                          const quota = val === '' || val == null ? 0 : val;
                          formApiRef.current?.setValue('remain_quota', quota);
                          formApiRef.current?.setValue(
                            'remain_amount',
                            Number(quotaToDisplayAmount(quota).toFixed(6)),
                          );
                        }}
                        style={{ width: '100%' }}
                        showClear
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <Form.Switch
                      field='unlimited_quota'
                      label={t('无限额度')}
                      size='default'
                      extraText={t(
                        '令牌的额度仅用于限制令牌本身的最大额度使用量，实际的使用受到账户的剩余额度限制',
                      )}
                    />
                  </Col>
                </Row>
              </Card>

              {/* 访问限制 */}
              <Card className='!rounded-2xl shadow-sm border-0'>
                <div className='flex items-center mb-2'>
                  <Avatar
                    size='small'
                    color='purple'
                    className='mr-2 shadow-md'
                  >
                    <IconLink size={16} />
                  </Avatar>
                  <div>
                    <Text className='text-lg font-medium'>{t('访问限制')}</Text>
                    <div className='text-xs text-gray-600'>
                      {t('设置令牌的访问限制')}
                    </div>
                  </div>
                </div>
                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Select
                      field='model_limits'
                      label={t('模型限制列表')}
                      placeholder={t(
                        '请选择该令牌支持的模型，留空支持所有模型',
                      )}
                      multiple
                      optionList={models}
                      extraText={t('非必要，不建议启用模型限制')}
                      filter={selectFilter}
                      autoClearSearchValue={false}
                      searchPosition='dropdown'
                      showClear
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={24}>
                    <Form.TextArea
                      field='allow_ips'
                      label={t('IP白名单（支持CIDR表达式）')}
                      placeholder={t('允许的IP，一行一个，不填写则不限制')}
                      autosize
                      rows={1}
                      extraText={t(
                        '请勿过度信任此功能，IP可能被伪造，请配合nginx和cdn等网关使用',
                      )}
                      showClear
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </Card>
            </div>
          )}
        </Form>
      </Spin>
      <Modal
        className='token-beginner-guide-modal'
        title={t('新手分组推荐')}
        visible={beginnerGuideVisible}
        onCancel={() => setBeginnerGuideVisible(false)}
        onOk={applyRecommendedGroup}
        okText={t('使用推荐分组')}
        cancelText={t('取消')}
        width={isMobile ? 'calc(100vw - 24px)' : 860}
        okButtonProps={{ disabled: !recommendedGroup }}
        bodyStyle={{
          maxHeight: isMobile
            ? 'calc(100dvh - 140px)'
            : 'min(760px, calc(100dvh - 160px))',
          overflowY: 'auto',
          marginRight: isMobile ? -6 : -10,
          paddingRight: isMobile ? 16 : 22,
          scrollbarGutter: 'stable',
        }}
      >
        <Spin spinning={pricingLoading}>
          <div className='space-y-4'>
            <div>
              <div className='mb-2 flex items-center gap-1.5 text-sm font-medium'>
                <span aria-hidden='true'>🏢</span>
                <span>{t('供应商')}</span>
              </div>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                {beginnerVendorOptions.length > 0 ? (
                  beginnerVendorOptions.map((vendor) => {
                    const active = beginnerVendor === vendor.key;
                    return (
                      <button
                        key={vendor.key}
                        type='button'
                        className='flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors'
                        style={{
                          border: active
                            ? '1px solid #2f6fed'
                            : '1px solid #e6edf5',
                          background: active
                            ? '#f1f7ff'
                            : '#ffffff',
                          boxShadow: active
                            ? '0 10px 24px rgba(47, 111, 237, 0.12)'
                            : '0 6px 16px rgba(15, 23, 42, 0.04)',
                        }}
                        onClick={() => {
                          setBeginnerVendor(vendor.key);
                          setBeginnerModel('');
                          setRecommendedGroup('');
                        }}
                      >
                        <span className='flex min-w-0 items-center gap-2'>
                          {getLobeHubIcon(vendor.icon || 'Layers', 18)}
                          <span className='truncate text-sm font-medium'>
                            {vendor.name}
                          </span>
                        </span>
                        <Tag size='small' color='blue' shape='circle'>
                          {vendor.count}
                        </Tag>
                      </button>
                    );
                  })
                ) : (
                  <div
                    className='rounded-lg px-3 py-4 text-sm sm:col-span-3'
                    style={{
                      color: '#64748b',
                      background: '#ffffff',
                      border: '1px solid #e6edf5',
                    }}
                  >
                    {t('暂无可用供应商')}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className='mb-2 flex items-center gap-1.5 text-sm font-medium'>
                <span aria-hidden='true'>🤖</span>
                <span>{t('模型')}</span>
              </div>
              <div>
                {!beginnerVendor ? (
                  <Text type='tertiary'>{t('请先选择供应商')}</Text>
                ) : beginnerModelOptions.length > 0 ? (
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                    {beginnerModelOptions.map((model) => {
                      const modelName = getModelName(model);
                      const active = beginnerModel === modelName;
                      return (
                        <button
                          key={modelName}
                          type='button'
                          className='flex min-h-[44px] w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors'
                          style={{
                            border: active
                              ? '1px solid #2f6fed'
                              : '1px solid #e6edf5',
                            background: active
                              ? '#f1f7ff'
                              : '#ffffff',
                            boxShadow: active
                              ? '0 8px 20px rgba(47, 111, 237, 0.1)'
                              : '0 4px 12px rgba(15, 23, 42, 0.03)',
                          }}
                          onClick={() => {
                            setBeginnerModel(modelName);
                            setRecommendedGroup(getRecommendedGroup(modelName));
                          }}
                        >
                          <span className='flex min-w-0 items-center gap-2'>
                            {getLobeHubIcon(
                              model.icon || model.vendor_icon || 'Layers',
                              16,
                            )}
                            <span className='truncate text-sm'>{modelName}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Text type='tertiary'>{t('该供应商暂无可用模型')}</Text>
                )}
              </div>
            </div>
            <div>
              <div className='mb-2 flex items-center gap-1.5 text-sm font-medium'>
                <span aria-hidden='true'>🎯</span>
                <span>{t('可选分组')}</span>
              </div>
              {beginnerGroupOptions.length > 0 ? (
                <div className='grid grid-cols-1 gap-3'>
                  {beginnerGroupOptions.map((option) => {
                    const active = recommendedGroup === option.group;
                    return (
                      <button
                        key={option.group}
                        type='button'
                        className='w-full rounded-lg px-4 py-3 text-left transition-colors'
                        style={{
                          background: active
                            ? '#f1f7ff'
                            : '#ffffff',
                          border: active
                            ? '1px solid #2f6fed'
                            : '1px solid #e6edf5',
                          boxShadow: active
                            ? '0 10px 28px rgba(47, 111, 237, 0.12)'
                            : '0 6px 18px rgba(15, 23, 42, 0.04)',
                        }}
                        onClick={() => setRecommendedGroup(option.group)}
                      >
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <Text strong className='text-base'>
                            {option.group}
                          </Text>
                          <Space wrap>
                            {active && (
                              <Tag color='blue' size='small' shape='circle'>
                                {t('已选择')}
                              </Tag>
                            )}
                            <Tag
                              color={option.billingColor}
                              size='small'
                              shape='circle'
                            >
                              {option.billingType}
                            </Tag>
                          </Space>
                        </div>
                        <div
                          className='mt-2 text-sm leading-6'
                          style={{ color: '#475569' }}
                        >
                          {option.description}
                        </div>
                        {option.priceItems.length > 0 ? (
                          <div className='mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4'>
                            {getBeginnerGroupPriceRows(option).map((item) => (
                              <div
                                key={item.key}
                                className='rounded-md px-3 py-2'
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #e6edf5',
                                  boxShadow:
                                    'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                                }}
                              >
                                <div
                                  className='mb-1 truncate text-xs'
                                  style={{ color: '#64748b' }}
                                >
                                  {item.label}
                                </div>
                                <div className='break-all'>
                                  {item.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className='mt-2'>
                            <Text type='tertiary'>{t('暂无价格信息')}</Text>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Text type='tertiary'>
                  {beginnerModel
                    ? t('当前模型没有匹配到可用分组')
                    : t('选择模型后显示推荐分组')}
                </Text>
              )}
            </div>
          </div>
        </Spin>
      </Modal>
    </SideSheet>
  );
};

export default EditTokenModal;
