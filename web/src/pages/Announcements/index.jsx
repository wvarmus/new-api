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

import React, { useContext, useMemo, useState } from 'react';
import { StatusContext } from '../../context/Status';
import {
  CheckCircle2,
  Info,
  Sparkles,
  TriangleAlert,
  Wrench,
} from 'lucide-react';

const SAMPLE_ANNOUNCEMENTS = [
  {
    content:
      '模型上架：gemini-3.5-flash，已同步开放 Gemini-标准 / Gemini-企业 分组',
    publishDate: '2026-05-21 14:28',
    type: 'success',
  },
  {
    content:
      '模型上架：gpt-5.5，同步开放 gpt-5.4、gpt-5.4-mini、gpt-5.4-nano，已接入 ChatGPT-标准 / ChatGPT-企业 / Codex-标准 / Codex-企业 分组',
    publishDate: '2026-04-26 14:30',
    type: 'success',
  },
  {
    content:
      '线路恢复：claude-sonnet-4-6 长上下文线路已恢复，Claude-标准 / Claude-企业 分组可正常调用',
    publishDate: '2026-04-25 10:12',
    type: 'ongoing',
  },
  {
    content: '模型上架：gemini-3.1-flash-lite，已同步开放 Gemini-标准 分组',
    publishDate: '2026-04-24 18:00',
    type: 'success',
  },
  {
    content:
      '模型上架：gpt-5.4-mini、gpt-5.4-nano，已同步开放 ChatGPT-标准 / Codex-标准 分组',
    publishDate: '2026-04-23 11:08',
    type: 'success',
  },
  {
    content:
      '模型上架：gemini-3.1-pro，已开放 Gemini-标准 / Gemini-企业 分组，长上下文请求建议开启流式输出',
    publishDate: '2026-04-18 16:25',
    type: 'success',
  },
  {
    content:
      '模型下架：deepseek-v4-pro、deepseek-v4-flash，国产精选分组入口已从模型广场移除',
    publishDate: '2026-04-12 09:42',
    type: 'warning',
  },
  {
    content:
      '模型下架：qwen3.6、kimi-k2.6，通义千问-精选 / Kimi-精选 入口已下线，建议迁移至 ChatGPT、Claude 或 Gemini 相关分组',
    publishDate: '2026-04-06 13:42',
    type: 'warning',
  },
  {
    content:
      '模型上架：claude-opus-4-6，已开放 Claude-企业 / ClaudeCode-企业 分组，适合复杂代码与长链路任务',
    publishDate: '2026-03-28 20:18',
    type: 'success',
  },
  {
    content: '模型上架：gpt-image-2，图片生成分组已同步更新',
    publishDate: '2026-03-20 16:25',
    type: 'success',
  },
  {
    content:
      '模型下架：gemini-3-pro-preview 旧版本，Gemini-标准 / Gemini-企业 入口已迁移至 gemini-3.1-pro',
    publishDate: '2026-03-09 10:30',
    type: 'warning',
  },
  {
    content:
      '模型上架：claude-sonnet-4-6、claude-opus-4-6，Claude-标准 / Claude-企业 / ClaudeCode-企业 分组完成新版本同步',
    publishDate: '2026-02-20 15:19',
    type: 'success',
  },
  {
    content:
      '线路优化：ClaudeCode-企业 分组完成扩容，Anthropic 官方 API、AWS Bedrock 与 Google Vertex AI 复合渠道已接入',
    publishDate: '2026-01-14 19:06',
    type: 'ongoing',
  },
  {
    content:
      '模型下架：gpt-4.1-preview、claude-sonnet-4-5 旧版本入口，ChatGPT-企业 / Claude-企业 分组已迁移至新版本线路',
    publishDate: '2025-12-16 13:45',
    type: 'warning',
  },
  {
    content:
      '模型上架：gpt-5.2、gpt-5.2-mini，ChatGPT-标准 / ChatGPT-企业 分组完成新版本同步',
    publishDate: '2025-11-21 11:30',
    type: 'success',
  },
  {
    content:
      '线路恢复：Gemini 图像理解线路恢复，Gemini-标准 / Gemini-企业 分组的 gemini-2.5-pro 多模态请求可正常提交',
    publishDate: '2025-10-09 22:14',
    type: 'ongoing',
  },
  {
    content:
      '模型下架：kimi-k2、qwen3-coder 测试入口，Kimi-精选 / 通义千问-精选 分组已移除',
    publishDate: '2025-09-18 09:20',
    type: 'warning',
  },
  {
    content:
      '模型上架：claude-sonnet-4、claude-opus-4，Claude-标准 / Claude-企业 / ClaudeCode-标准 分组新增代码与长任务线路',
    publishDate: '2025-08-07 16:45',
    type: 'success',
  },
  {
    content:
      '模型上架：gpt-5、gpt-5-mini，ChatGPT-标准 / ChatGPT-企业 分组新增高性能与轻量线路',
    publishDate: '2025-07-12 12:08',
    type: 'success',
  },
  {
    content:
      '模型下架：deepseek-r1、deepseek-v3 临时入口，国产精选分组已移除，建议迁移至 ChatGPT-标准 或 Gemini-标准',
    publishDate: '2025-06-03 18:36',
    type: 'warning',
  },
  {
    content:
      '模型上架：gemini-2.5-pro、gemini-2.5-flash，Gemini-标准 / Gemini-企业 分组完成稳定线路同步',
    publishDate: '2025-05-16 10:55',
    type: 'success',
  },
  {
    content:
      '模型上架：gpt-4.1、gpt-4.1-mini，ChatGPT-标准 / ChatGPT-企业 / 通用标准 分组新增低延迟文本线路',
    publishDate: '2025-04-15 15:24',
    type: 'success',
  },
  {
    content:
      '线路优化：Claude-标准 / ClaudeCode-标准 分组新增备用节点，长文本与代码任务失败率降低',
    publishDate: '2025-03-06 20:18',
    type: 'ongoing',
  },
  {
    content:
      '模型上架：claude-3.7-sonnet，Claude-标准 / Claude-企业 分组新增推理增强线路',
    publishDate: '2025-02-25 13:10',
    type: 'success',
  },
  {
    content: '模型上架：o3-mini，ChatGPT-标准 分组新增轻量推理模型',
    publishDate: '2025-01-31 17:26',
    type: 'success',
  },
  {
    content: '模型上架：gemini-2.0-flash，Gemini-标准 分组开放测试',
    publishDate: '2024-12-13 09:40',
    type: 'success',
  },
  {
    content:
      '模型下架：llama、mistral 临时测试入口，通用标准分组相关入口已从模型广场移除',
    publishDate: '2024-11-08 21:05',
    type: 'warning',
  },
  {
    content:
      '模型上架：o1-preview、o1-mini，ChatGPT-标准 / ChatGPT-企业 分组新增推理模型入口',
    publishDate: '2024-09-13 14:22',
    type: 'success',
  },
  {
    content: '模型上架：gpt-4o-mini，ChatGPT-标准 / 通用标准 分组完成同步',
    publishDate: '2024-07-19 18:12',
    type: 'success',
  },
  {
    content:
      '模型上架：claude-3.5-sonnet，Claude-标准 / Claude-企业 / ClaudeCode-标准 分组新增代码与长文本线路',
    publishDate: '2024-06-24 10:30',
    type: 'success',
  },
];

const TYPE_META = {
  default: { icon: Info },
  ongoing: { icon: Wrench },
  success: { icon: CheckCircle2 },
  warning: { icon: TriangleAlert },
};

const formatDate = (value) => {
  if (!value) return '-';

  if (typeof value === 'string') {
    const normalized = value.replace('T', ' ').slice(0, 16);
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
      return normalized;
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getDateValue = (value) => {
  if (!value) return 0;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const inferType = (content, type) => {
  if (TYPE_META[type]) return type;
  const text = String(content || '');
  if (text.includes('下架')) return 'warning';
  if (text.includes('线路优化') || text.includes('线路恢复')) {
    return 'ongoing';
  }
  if (text.includes('上架')) return 'success';
  return 'default';
};

const normalizeAnnouncement = (item, index) => {
  const content = item?.content || item?.title || '';
  const publishDate = item?.publishDate || item?.time || item?.date || '';

  return {
    id: item?.id || `${publishDate}-${index}`,
    content,
    extra: item?.extra || item?.description || '',
    publishDate,
    time: formatDate(publishDate),
    type: inferType(content, item?.type),
  };
};

const Announcements = () => {
  const [statusState] = useContext(StatusContext);
  const [expandedId, setExpandedId] = useState(null);

  const announcements = useMemo(() => {
    const remoteAnnouncements = statusState?.status?.announcements;
    const source =
      Array.isArray(remoteAnnouncements) && remoteAnnouncements.length > 0
        ? remoteAnnouncements
        : SAMPLE_ANNOUNCEMENTS;

    return source
      .map(normalizeAnnouncement)
      .sort(
        (a, b) => getDateValue(b.publishDate) - getDateValue(a.publishDate),
      );
  }, [statusState?.status?.announcements]);

  return (
    <main className='announcement-page header-offset-top'>
      <section className='announcement-hero'>
        <div className='announcement-hero-copy'>
          <span className='announcement-hero-icon'>
            <Sparkles size={24} />
          </span>
          <div>
            <h1>消息中心</h1>
            <p>查看模型上架、模型下架、线路优化和服务调整等系统公告。</p>
          </div>
        </div>
      </section>

      <section className='announcement-panel'>
        <div className='announcement-list'>
          {announcements.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.default;
            const Icon = meta.icon;
            const isExpanded = expandedId === item.id;
            const canExpand = Boolean(item.extra);

            return (
              <article
                key={item.id}
                className={`announcement-row announcement-row-${item.type} ${
                  isExpanded ? 'expanded' : ''
                }`}
                onClick={() =>
                  canExpand
                    ? setExpandedId((current) =>
                        current === item.id ? null : item.id,
                      )
                    : undefined
                }
              >
                <div className='announcement-status-icon'>
                  <Icon size={18} />
                </div>
                <div className='announcement-row-main'>
                  <div className='announcement-row-title'>{item.content}</div>
                  {isExpanded && item.extra ? (
                    <div className='announcement-row-extra'>{item.extra}</div>
                  ) : null}
                </div>
                <div className='announcement-row-side'>
                  <span>{item.time}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default Announcements;
