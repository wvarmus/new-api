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

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Code2,
  FileSearch,
  Gauge,
  MessageSquareText,
  Network,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
  ZoomIn,
} from 'lucide-react';
import { shouldRenderDefaultHomePage } from './homeSections';

const homepageLogo = '/logo.png';

const modelLogoRows = [
  [
    { key: 'openai', name: 'OpenAI', file: 'OpenAI.svg', featured: true },
    { key: 'claude', name: 'Claude', file: 'Claude.svg', featured: true },
    { key: 'gemini', name: 'Gemini', file: 'Gemini.svg', featured: true },
    { key: 'deepseek', name: 'DeepSeek', file: 'DeepSeek.svg' },
    { key: 'qwen', name: 'Qwen', file: 'Qwen.svg' },
    { key: 'zhipu', name: 'GLM', file: 'Zhipu.svg' },
    { key: 'hunyuan', name: 'Hunyuan', file: 'Hunyuan.svg' },
  ],
  [
    { key: 'moonshot', name: 'Kimi', file: 'MoonshotAI.svg' },
    { key: 'midjourney', name: 'Midjourney', file: 'Midjourney.svg' },
    { key: 'volcengine', name: 'Volcengine', file: 'Volcengine.svg' },
    { key: 'wenxin', name: 'Wenxin', file: 'Wenxin.svg' },
    { key: 'grok', name: 'Grok', file: 'Grok_2.svg' },
    { key: 'more', name: '更多模型', count: '30+' },
  ],
];

const mobileModelLogoItems = [
  ...modelLogoRows[0].slice(0, 4),
  modelLogoRows[1][5],
];

const darkModelLogoFiles = new Set([
  'Grok_2.svg',
  'Midjourney.svg',
  'MoonshotAI.svg',
  'OpenAI.svg',
]);

const heroTags = [
  '自建源头号池',
  '模型验真报告',
  '价格直观展示',
  '缓存真实有效',
  '多线路冗余安全',
];

const trustCards = [
  {
    key: 'verify',
    icon: ShieldCheck,
    title: '先验真，再上架',
    desc: '主力模型不只看能否返回答案，会结合身份、能力、协议表现和具体模型匹配做检查。',
  },
  {
    key: 'pricing',
    icon: WalletCards,
    title: '分组直接标价格',
    desc: '输入、输出、缓存读取和缓存创建价格分开展示，按量付费更容易看懂真实成本。',
    highlight: '按量付费 · 统一余额',
  },
  {
    key: 'cache',
    icon: Gauge,
    title: '缓存成本单独说明',
    desc: '长上下文、代码库和多轮任务会反复读取内容，缓存价格直接影响真实成本。',
  },
  {
    key: 'routes',
    icon: Network,
    title: '自建号池与多线路冗余',
    desc: '自建号池覆盖的场景里，平台自己掌握供给源头，并通过多线路观察、退出和补位降低单点风险。',
    highlight: '自有源头 · 多线路补位',
  },
];

const chatFeatures = [
  { icon: MessageSquareText, title: '多模型无感切换' },
  { icon: Boxes, title: '多模型对比' },
  { icon: FileSearch, title: '文件与图片输入' },
  { icon: Code2, title: '工具与代码能力' },
];

const groupCards = [
  {
    key: 'standard',
    eyebrow: '通用标准',
    title: '日常使用先从这里开始',
    desc: '适合问答、写作、资料整理、学习和轻量代码辅助，价格更友好。',
    action: '查看支持模型',
  },
  {
    key: 'business',
    eyebrow: '通用企业',
    title: '团队和高频任务优先',
    desc: '更重视模型一致性、自有供给承接、缓存命中、业务连续性和运行可观察性。',
    action: '查看企业分组',
  },
  {
    key: 'domestic',
    eyebrow: '国产精选',
    title: '国产主流模型统一入口',
    desc: '覆盖 Qwen、DeepSeek、Kimi、GLM、MiniMax 等模型组合，适合中文任务和批量处理。',
    action: '查看国产模型',
  },
  {
    key: 'brand',
    eyebrow: '品牌分组',
    title: '按模型品牌选择',
    desc: '适合明确了解模型品牌的用户，按品牌下选择标准、企业、精品线路。',
    action: '查看品牌模型',
  },
];

const samplePriceTags = [
  '示例分组',
  '工具调用',
  '文件理解',
  '图像理解',
  '上下文 1M',
];

const samplePriceItems = [
  { label: '输入价格/M', value: '$3.0000' },
  { label: '输出价格/M', value: '$12.0000' },
  { label: '缓存读取/M', value: '$0.7500' },
  { label: '缓存创建/M', value: '$3.7500' },
];

const priceBenefitItems = ['按量付费', '统一余额', '一次充值用所有可用模型'];

const verificationReports = [
  {
    key: 'gpt-55',
    title: 'GPT 5.5',
    subtitle: '100% 完美匹配',
    src: '/home-verification/report-gpt-55.png',
  },
  {
    key: 'gemini-31-pro',
    title: 'Gemini 3.1 Pro',
    subtitle: '模型家族与协议一致性通过',
    src: '/home-verification/report-gemini-31-pro.png',
  },
  {
    key: 'gpt-54',
    title: 'GPT 5.4',
    subtitle: '知识问答与型号特征通过',
    src: '/home-verification/report-gpt-54.png',
  },
];

const standardRows = [
  '模型/能力可信',
  '调用表现观察',
  '价格与缓存成本',
  '自建号池源头能力',
  '异常退出与补位',
];

const faqs = [
  {
    question: '我是新手，应该选哪个？',
    answer:
      '建议先从通用标准开始；不会接 API 的用户可以先用聚合对话站，确认模型效果后再接入自己的工具。',
  },
  {
    question: '标准分组是不是低质量？',
    answer:
      '不是。标准分组定位是价格更友好、适合日常使用，仍然需要保留模型真实性、基础可用性和价格透明检查。',
  },
  {
    question: '为什么缓存价格重要？',
    answer:
      '长文档、代码库和多轮任务会反复读取上下文，缓存读取价和命中情况会直接影响真实成本。',
  },
  {
    question: '你们怎么避免假模型？',
    answer:
      '平台会结合模型身份、具体模型匹配、能力结果和协议表现判断，不把“能回答”直接等同于“真模型”。',
  },
];

const getDarkModelLogoFile = (file) => {
  if (!file || !darkModelLogoFiles.has(file)) {
    return null;
  }
  return file.replace(/\.svg$/, '-dark.svg');
};

const ModelLogoImage = ({ item, className }) => {
  const darkFile = getDarkModelLogoFile(item.file);

  return (
    <>
      <img
        src={`/model-logos/${item.file}`}
        alt={item.name}
        className={`${className} home-model-logo ${
          darkFile ? 'home-model-logo-light' : ''
        }`}
      />
      {darkFile ? (
        <img
          src={`/model-logos/${darkFile}`}
          alt=''
          aria-hidden='true'
          className={`${className} home-model-logo home-model-logo-dark`}
        />
      ) : null}
    </>
  );
};

const SectionIntro = ({
  eyebrow,
  title,
  desc,
  align = 'left',
  titleClassName = '',
}) => (
  <div
    className={`home-section-intro ${
      align === 'center' ? 'home-section-intro-center' : ''
    }`}
  >
    <h2
      className={`${eyebrow ? 'home-section-title-inline' : ''} ${titleClassName}`.trim()}
    >
      {eyebrow ? (
        <span className='home-section-title-prefix'>{eyebrow} ：</span>
      ) : null}
      {title}
    </h2>
    {desc ? <p>{desc}</p> : null}
  </div>
);

const DefaultHomePage = ({
  t,
  docsLink,
  isDemoSiteMode,
}) => {
  const primaryLink = isDemoSiteMode ? '/console' : '/register';
  const docsHref = docsLink || 'https://doc.infistar.ai/';
  const [previewReport, setPreviewReport] = useState(null);
  const [activeReportKey, setActiveReportKey] = useState(verificationReports[0].key);
  const [previousReportKey, setPreviousReportKey] = useState(null);
  const [reportStackOrder, setReportStackOrder] = useState(
    verificationReports.map((item) => item.key),
  );
  const activeReportIndex = Math.max(
    verificationReports.findIndex((item) => item.key === activeReportKey),
    0,
  );
  const activeReport = verificationReports[activeReportIndex];
  const activateReport = (reportKey) => {
    if (reportKey === activeReportKey) {
      return;
    }
    setPreviousReportKey(activeReportKey);
    setReportStackOrder((currentOrder) => [
      reportKey,
      ...currentOrder.filter(
        (itemKey) => itemKey !== reportKey && itemKey !== activeReportKey,
      ),
      activeReportKey,
    ]);
    setActiveReportKey(reportKey);
  };
  useEffect(() => {
    if (!previousReportKey) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setPreviousReportKey(null);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [previousReportKey]);

  return (
    <main id='homepage' data-homepage-default='true' className='home-shell header-offset-padding-top'>
      <section className='home-hero'>
        <div className='home-container home-hero-grid'>
          <div className='home-hero-copy'>
            <span className='home-hero-badge'>
              <Sparkles size={16} />
              {t('无限星河AI · 多模型调用入口')}
            </span>
            <h1 dangerouslySetInnerHTML={{ __html: t('hero-title') }} />
            <p>
              {t('面向个人和企业，提供主流 AI 模型 API 调用入口和聚合对话站。')}
              <br />
              {t('您可以用一个 API Key 接入，也可以直接在网页里无感调用全平台模型。')}
            </p>
            <div className='home-hero-tags'>
              {heroTags.map((item) => (
                <span key={item}>
                  <CheckCircle2 size={15} />
                  {t(item)}
                </span>
              ))}
            </div>
          </div>

          <div className='home-hero-side-actions' aria-label={t('首页操作入口')}>
            <Link to={primaryLink} className='home-primary-button'>
              {t(isDemoSiteMode ? '进入控制台' : '立即开始')}
              <ArrowRight size={18} />
            </Link>
            <Link to='/pricing' className='home-secondary-button'>
              {t('查看模型与分组')}
            </Link>
          </div>
        </div>
      </section>

      <section className='home-section home-section-muted home-trust-section'>
        <div className='home-container'>
          <SectionIntro
            eyebrow={t('为什么选无限星河AI')}
            title={t('把模型、价格、源头和线路讲清楚，再开始使用')}
            desc={t(
              '很多 API 平台看起来只是价格不同，真正影响体验的是模型有没有偷换、号池是否可控、线路是否稳定、缓存价格是否真实、扣费是否看得懂。',
            )}
            align='center'
          />
          <div className='home-trust-grid'>
            {trustCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.key} className='home-trust-card'>
                  <div className='home-trust-card-header'>
                    <span className='home-card-icon'>
                      <Icon size={22} />
                    </span>
                    <h3>{t(item.title)}</h3>
                  </div>
                  <p>{t(item.desc)}</p>
                  {item.highlight ? (
                    <span className='home-trust-highlight'>
                      {t(item.highlight)}
                    </span>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id='models' className='home-section home-model-section'>
        <div className='home-container'>
          <SectionIntro
            eyebrow={t('模型覆盖')}
            title={t('主流模型集中到一个入口')}
            desc={t(
              '覆盖 ChatGPT、Claude、Gemini、Grok、Qwen、DeepSeek 等主流模型；具体模型覆盖和价格以模型广场实时展示为准。',
            )}
            align='center'
          />
          <div className='home-model-matrix'>
            <div className='home-model-desktop-grid'>
              <div className='home-model-row-stack'>
                {modelLogoRows.map((row, rowIndex) => (
                  <div
                    key={`model-row-${rowIndex}`}
                    className={`home-model-row home-model-row-${rowIndex + 1}`}
                  >
                    {row.map((item) => (
                      <div key={item.key} className='home-model-diamond'>
                        <div className='home-model-diamond-inner'>
                          {item.file ? (
                            <ModelLogoImage
                              item={item}
                              className='home-model-mark'
                            />
                          ) : (
                            <span className='home-model-more-count'>
                              {item.count}
                            </span>
                          )}
                          <div
                            className={`home-model-name ${
                              item.featured
                                ? 'home-model-name-featured'
                                : ''
                            }`}
                          >
                            {item.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className='home-model-mobile-grid'>
              {mobileModelLogoItems.map((item) => (
                <div
                  key={`mobile-${item.key}`}
                  className='home-model-diamond home-model-diamond-mobile'
                >
                  <div className='home-model-diamond-inner home-model-diamond-inner-mobile'>
                    {item.file ? (
                      <ModelLogoImage
                        item={item}
                        className='home-model-mark home-model-mark-mobile'
                      />
                    ) : (
                      <span className='home-model-more-count home-model-more-count-mobile'>
                        {item.count}
                      </span>
                    )}
                    <div className='home-model-name home-model-name-mobile'>
                      {item.key === 'more' ? t('更多') : item.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='home-section home-section-muted'>
        <div className='home-container home-report-grid'>
          <div className='home-report-folder'>
            <div
              className='home-report-folder-preview'
              role='group'
              aria-label={t('检测报告预览')}
            >
              {verificationReports.map((item) => {
                const stackIndex = Math.max(reportStackOrder.indexOf(item.key), 0);
                const isActive = stackIndex === 0;

                return (
                  <button
                    type='button'
                    key={item.key}
                    className={`home-report-folder-sheet home-report-folder-sheet-${stackIndex} ${
                      isActive ? 'is-active' : ''
                    } ${
                      previousReportKey === item.key && !isActive
                        ? 'is-leaving'
                        : ''
                    }`}
                    onClick={() =>
                      isActive
                        ? setPreviewReport(item)
                        : activateReport(item.key)
                    }
                    aria-label={t(
                      isActive
                        ? `预览${item.title}检测报告`
                        : `切换到${item.title}检测报告`,
                    )}
                  >
                    <img
                      src={item.src}
                      alt={t(`${item.title}检测报告`)}
                    />
                  </button>
                );
              })}
              <button
                type='button'
                className='home-report-zoom home-report-folder-zoom'
                onClick={() => setPreviewReport(activeReport)}
                aria-label={t(`预览${activeReport.title}检测报告`)}
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
          <div>
            <SectionIntro
              title={
                <>
                  <span className='home-section-title-accent'>{t('验真：')}</span>
                  {t('我们把“正规”做成一套可检查的标准')}
                </>
              }
              titleClassName='home-section-title-mixed'
              desc={t(
                '无限星河AI 背后不是手工挑几个接口，而是围绕自建号池源头能力、模型验真、价格、缓存、冗余线路和运行观察持续治理。',
              )}
            />
            <div className='home-standard-list'>
              {standardRows.map((item) => (
                <div key={item}>
                  <CheckCircle2 size={18} />
                  <span>{t(item)}</span>
                </div>
              ))}
            </div>
            <p className='home-note'>
              {t(
                '在自建号池覆盖的场景里，平台自己掌握供给源头；这不等于承诺任何线路永不异常，但会让异常变成可发现、可解释、可处理、可补位的问题。',
              )}
            </p>
          </div>
        </div>
      </section>

      <section className='home-section'>
        <div className='home-container home-chat-grid'>
          <div>
            <SectionIntro
              eyebrow={t('聚合对话站')}
              title={t('不会接 API，也能直接用全平台模型')}
              titleClassName='home-section-title-wrap'
              desc={t(
                '用户可以直接在网页里选择模型、上传文件、发起对话；专业用户可以先试模型，再把合适的模型接入自己的工具。',
              )}
            />
            <div className='home-feature-grid'>
              {chatFeatures.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className='home-feature-item'>
                    <Icon size={19} />
                    <span>{t(item.title)}</span>
                  </div>
                );
              })}
            </div>
            <Link to='/chat' className='home-chat-action home-primary-button'>
              {t('立即开始对话')}
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className='home-chat-preview'>
            <div className='home-chat-browser-bar'>
              <div className='home-chat-browser-dots' aria-hidden='true'>
                <span />
                <span />
                <span />
              </div>
              <div className='home-chat-nav-preview'>
                <span>{t('文档')}</span>
                <span className='home-chat-nav-active'>
                  <MessageSquareText size={16} />
                  {t('对话')}
                </span>
              </div>
            </div>

            <div className='home-chat-window'>
              <div className='home-chat-window-header'>
                <div>
                  <span>{t('聚合对话站')}</span>
                  <strong>{t('选择模型后直接开始')}</strong>
                </div>
                <span className='home-chat-model-pill'>
                  <Sparkles size={15} />
                  {t('模型已就绪')}
                </span>
              </div>

              <div className='home-chat-messages'>
                <div className='home-chat-message home-chat-message-user'>
                  <span>{t('我不会接 API，能直接问模型吗？')}</span>
                </div>
                <div className='home-chat-message home-chat-message-ai'>
                  <span className='home-chat-avatar'>
                    <MessageSquareText size={17} />
                  </span>
                  <p>
                    {t(
                      '可以。进入对话后选择可用模型，直接输入问题就能使用。',
                    )}
                  </p>
                </div>
              </div>

              <div className='home-chat-quick-row'>
                <span>{t('文本问答')}</span>
                <span>{t('文件理解')}</span>
                <span>{t('代码辅助')}</span>
              </div>

              <div className='home-chat-composer'>
                <span>{t('输入问题，选择模型后发送')}</span>
                <button type='button'>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='home-section home-section-muted'>
        <div className='home-container home-pricing-grid'>
          <div>
            <SectionIntro
              eyebrow={t('价格与缓存')}
              title={t('透明计费：告别隐形账单，彻底看清模型调用与缓存成本')}
              titleClassName='home-section-title-wrap'
              desc={t(
                '调用大模型的成本不仅限于基础的“输入”和“输出”。在处理长文档、代码分析或多轮对话时，上下文缓存（Cache）产生的费用经常被忽略，而这部分的成本差异有时高达 10 倍。',
              )}
            />
            <p className='home-price-note'>
              {t(
                '为了让您的每一分钱都花得明明白白，我们将计费项进行了极致拆解：输入/输出单价、缓存读取/创建费用、官方原价与分组特惠价均独立展示，确保您精准掌握每一类用量的计费规则。',
              )}
            </p>
            <div className='home-price-benefits'>
              {priceBenefitItems.map((item) => (
                <span key={item}>{t(item)}</span>
              ))}
            </div>
          </div>
          <div className='home-price-card'>
            <div className='home-price-model-head'>
              <span className='home-price-model-icon'>
                <ModelLogoImage
                  item={modelLogoRows[0][0]}
                  className='home-price-model-logo'
                />
              </span>
              <h3>{t('示例模型')}</h3>
              <span className='home-price-billing-badge'>{t('按量计费')}</span>
            </div>
            <p className='home-price-model-desc'>
              <span className='home-price-model-highlight'>{t('官方5折')}</span>
              {t(
                '，支持 1M 上下文、工具调用、图像理解和文件理解，适合多模态问答、资料分析和内容创作。',
              )}
            </p>
            <div className='home-price-tag-row'>
              {samplePriceTags.map((item) => (
                <span key={item}>{t(item)}</span>
              ))}
            </div>
            <div className='home-price-values'>
              {samplePriceItems.map((item) => (
                <div key={item.label} className='home-price-value-card'>
                  <span>{t(item.label)}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='home-section'>
        <div className='home-container'>
          <SectionIntro
            eyebrow={t('分组怎么选')}
            title={t('按使用场景选分组，不用先懂所有技术细节')}
            desc={t(
              '标准、企业、精选和品牌分组分别服务不同场景。用户先按任务选择，再进入模型广场查看具体价格和支持模型。',
            )}
            align='center'
          />
          <div className='home-group-grid'>
            {groupCards.map((item) => (
              <Link to='/pricing' key={item.key} className='home-group-card'>
                <span>{t(item.eyebrow)}</span>
                <h3>{t(item.title)}</h3>
                <p>{t(item.desc)}</p>
                <strong>
                  {t(item.action)}
                  <ArrowRight size={16} />
                </strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className='home-section home-section-muted'>
        <div className='home-container'>
          <SectionIntro
            eyebrow={t('常见问题')}
            title={t('先把选择和风险讲清楚')}
            align='center'
          />
          <div className='home-faq-grid'>
            {faqs.map((item) => (
              <article key={item.question} className='home-faq-card'>
                <h3>{t(item.question)}</h3>
                <p>{t(item.answer)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id='cta' className='home-cta-section'>
        <div className='home-container home-cta-card'>
          <div className='home-cta-content'>
            <h2>{t('每一次简单的调用，背后是全链路、全天候的算力网络保障')}</h2>
          </div>
          <div className='home-cta-bottom'>
            <p>
              {t(
                '我们在背后默默处理了无数的账号配置、安全规则与节点维护。您只需在这里轻松试用模型，对比透明报价，一键即可开箱即用。',
              )}
            </p>
            <Link to={primaryLink} className='home-primary-button'>
              {t(isDemoSiteMode ? '进入控制台' : '立即开始使用')}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className='home-footer'>
        <div className='home-container home-footer-grid'>
          <div>
            <div className='home-footer-brand'>
              <img src={homepageLogo} alt={t('无限星河AI')} />
              <strong>{t('无限星河AI')}</strong>
            </div>
            <p>
              {t(
                '让主流 AI 模型以更透明、可解释、低成本的方式服务个人用户和小团队。',
              )}
            </p>
          </div>
          <div className='home-footer-links'>
            <strong>{t('产品与文档')}</strong>
            <Link to='/pricing'>{t('模型与分组')}</Link>
            <a
              href={docsHref}
              target={docsHref.startsWith('http') ? '_blank' : undefined}
              rel={docsHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {t('文档')}
            </a>
          </div>
        </div>
      </footer>
      {previewReport ? (
        <div
          className='home-report-preview'
          role='dialog'
          aria-modal='true'
          aria-label={t(`${previewReport.title}检测报告预览`)}
          onClick={() => setPreviewReport(null)}
        >
          <div
            className='home-report-preview-panel'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='home-report-preview-header'>
              <div>
                <span>{t('检测报告')}</span>
                <strong>{previewReport.title}</strong>
              </div>
              <button
                type='button'
                onClick={() => setPreviewReport(null)}
                aria-label={t('关闭')}
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={previewReport.src}
              alt={t(`${previewReport.title}检测报告`)}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
};

export { shouldRenderDefaultHomePage };
export default DefaultHomePage;
