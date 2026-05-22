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

import React, { useContext, useEffect, useRef, useState } from 'react';
import { Spin, Typography } from '@douyinfe/semi-ui';
import { API, authHeader } from '../../helpers';
import { useActualTheme } from '../../context/Theme';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage } from '../../i18n/language';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusContext } from '../../context/Status';

const getStoredOpenWebUIURL = () => {
  try {
    const status = JSON.parse(localStorage.getItem('status') || '{}');
    return status.open_webui_url || '';
  } catch (error) {
    return '';
  }
};

const getConfiguredOpenWebUIURL = (status) => {
  return (status?.open_webui_url || getStoredOpenWebUIURL() || '').trim();
};

const getOpenWebUIOrigin = (url) => {
  try {
    return new URL(url, window.location.origin).origin;
  } catch (error) {
    return 'http://localhost:25500';
  }
};

const getOpenWebUILanguage = (language) => {
  const normalized = normalizeLanguage(language);
  const languageMap = {
    en: 'en-US',
    fr: 'fr-FR',
    ru: 'ru-RU',
    ja: 'ja-JP',
    vi: 'vi-VN',
  };
  return languageMap[normalized] || normalized || 'zh-CN';
};

const getOpenWebUIPath = (chatId, search = '') => {
  const path = chatId ? `/c/${encodeURIComponent(chatId)}` : '/';
  return `${path}${search || ''}`;
};

const getOpenWebUIURL = (baseURL, path) => {
  try {
    const url = new URL(baseURL, window.location.origin);
    const [pathname, search = ''] = path.split('?');
    url.pathname = pathname || '/';
    url.search = search ? `?${search}` : '';
    return url.toString();
  } catch (error) {
    return baseURL;
  }
};

const getNewAPIChatPath = (openWebUIPath, basePath) => {
  if (!openWebUIPath || openWebUIPath === '/') return basePath;
  const match = openWebUIPath.match(/^\/c\/([^/?#]+)/);
  return match?.[1]
    ? `${basePath}/${encodeURIComponent(decodeURIComponent(match[1]))}`
    : basePath;
};

const getChatIdFromPath = (path) => {
  const match = path.match(/^\/(?:console\/)?chat\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
};

const Chat = () => {
  const iframeRef = useRef(null);
  const actualTheme = useActualTheme();
  const [statusState] = useContext(StatusContext);
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isConsoleChatRoute =
    location.pathname === '/console/chat' ||
    location.pathname.startsWith('/console/chat/');
  const chatBasePath = isConsoleChatRoute ? '/console/chat' : '/chat';
  const chatId = getChatIdFromPath(location.pathname);
  const openWebUIURL = getConfiguredOpenWebUIURL(statusState?.status);
  const openWebUIEnabled = openWebUIURL !== '';
  const openWebUIOrigin = getOpenWebUIOrigin(openWebUIURL);
  const messageOriginRef = useRef(openWebUIOrigin);
  const openWebUIPath = getOpenWebUIPath(chatId, location.search);
  const openWebUISrc = openWebUIEnabled
    ? getOpenWebUIURL(openWebUIURL, openWebUIPath)
    : '';
  const openWebUIURLRef = useRef(openWebUIURL);
  const [iframeSrc, setIframeSrc] = useState(openWebUISrc);
  const [ssoPayload, setSsoPayload] = useState(null);
  const [ssoConfirmed, setSsoConfirmed] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [openWebUILoaded, setOpenWebUILoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (openWebUIURLRef.current === openWebUIURL) return;
    openWebUIURLRef.current = openWebUIURL;
    messageOriginRef.current = openWebUIOrigin;
    setIframeLoaded(false);
    setIframeReady(false);
    setOpenWebUILoaded(false);
    setSsoConfirmed(false);
    setError('');
    setIframeSrc(openWebUISrc);
  }, [openWebUIURL, openWebUIOrigin, openWebUISrc]);

  useEffect(() => {
    let cancelled = false;

    async function loadSSOToken() {
      if (!openWebUIEnabled) {
        setError('对话功能未启用');
        return;
      }

      try {
        setError('');
        const res = await API.post(
          '/api/open-webui/sso/token',
          {},
          { headers: authHeader(), skipErrorHandler: true },
        );
        if (cancelled) return;
        if (!res.data?.success) {
          setError(res.data?.message || 'Open WebUI 登录凭证生成失败');
          return;
        }
        if (res.data?.data?.target_origin) {
          messageOriginRef.current = res.data.data.target_origin;
        }
        setSsoPayload(res.data.data);
      } catch (err) {
        if (!cancelled) {
          setError('Open WebUI 登录凭证生成失败');
        }
      }
    }

    loadSSOToken();

    return () => {
      cancelled = true;
    };
  }, [openWebUIEnabled]);

  const sendSSOMessage = (
    force = false,
    targetOrigin = messageOriginRef.current,
  ) => {
    const targetWindow = iframeRef.current?.contentWindow;
    const preferences = {
      theme: actualTheme === 'dark' ? 'dark' : 'light',
      language: getOpenWebUILanguage(i18n.language),
    };
    if (
      !targetWindow ||
      !ssoPayload?.token ||
      (!force && (!iframeLoaded || !iframeReady))
    ) {
      return;
    }

    targetWindow.postMessage(
      {
        type: 'new-api:sso',
        version: 1,
        token: ssoPayload.token,
        expires_at: ssoPayload.expires_at,
        target_path: openWebUIPath,
        preferences,
      },
      targetOrigin,
    );
  };

  const sendNavigationMessage = (
    force = false,
    targetOrigin = messageOriginRef.current,
  ) => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow || (!force && (!iframeLoaded || !iframeReady))) {
      return;
    }

    targetWindow.postMessage(
      {
        type: 'new-api:navigate',
        target_path: openWebUIPath,
      },
      targetOrigin,
    );
  };

  const sendPreferenceMessage = (
    force = false,
    targetOrigin = '*',
    language = i18n.language,
  ) => {
    const targetWindow = iframeRef.current?.contentWindow;

    const preferences = {
      theme: actualTheme === 'dark' ? 'dark' : 'light',
      language: getOpenWebUILanguage(language),
    };

    if (!targetWindow || (!force && !iframeLoaded)) {
      return;
    }

    targetWindow.postMessage(
      {
        type: 'new-api:preferences',
        version: 1,
        preferences,
        data: preferences,
      },
      targetOrigin || '*',
    );
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      if (event.data?.type === 'new-api:ready') {
        messageOriginRef.current = event.origin;
        setIframeReady(true);
        sendSSOMessage(true, event.origin);
        sendPreferenceMessage(true, event.origin);
        sendNavigationMessage(true, event.origin);
        return;
      }

      if (event.data?.type === 'new-api:loaded') {
        setOpenWebUILoaded(true);
        return;
      }

      if (event.data?.type === 'new-api:route') {
        const nextPath = getNewAPIChatPath(event.data.path, chatBasePath);
        if (nextPath !== location.pathname) {
          navigate(nextPath, { replace: true });
        }
        return;
      }

      if (event.origin !== messageOriginRef.current) return;
      if (event.data?.type !== 'new-api:sso:status') return;

      if (event.data.status === 'success') {
        setSsoConfirmed(true);
      } else if (event.data.status === 'error') {
        setError(event.data.message || 'Open WebUI 自动登录失败');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    ssoPayload,
    actualTheme,
    i18n.language,
    openWebUIPath,
    location.pathname,
    chatBasePath,
    navigate,
  ]);

  useEffect(() => {
    if (
      !ssoPayload?.token ||
      !iframeLoaded ||
      !iframeReady ||
      ssoConfirmed ||
      error
    )
      return;

    sendSSOMessage();
    const timer = window.setInterval(() => {
      if (ssoPayload.expires_at && Date.now() / 1000 > ssoPayload.expires_at) {
        window.clearInterval(timer);
        setError('Open WebUI 登录凭证已过期，请刷新重试');
        return;
      }
      sendSSOMessage();
    }, 600);

    return () => window.clearInterval(timer);
  }, [ssoPayload, iframeLoaded, iframeReady, ssoConfirmed, error]);

  useEffect(() => {
    sendPreferenceMessage();
  }, [actualTheme, i18n.language, iframeLoaded, iframeReady, ssoConfirmed]);

  useEffect(() => {
    const handleLanguageChanged = (language) => {
      sendPreferenceMessage(true, messageOriginRef.current || '*', language);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, [i18n, actualTheme, iframeLoaded]);

  useEffect(() => {
    sendNavigationMessage();
  }, [openWebUIPath, iframeLoaded, iframeReady]);

  return (
    <main
      className='header-offset-padding-top'
      style={{
        height: '100dvh',
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'var(--semi-color-bg-0)',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {(!ssoPayload || !ssoConfirmed || !openWebUILoaded) && !error && (
        <div
          className='absolute inset-0 z-10 flex h-full items-center justify-center'
          style={{
            backgroundColor:
              actualTheme === 'dark' ? '#000' : 'var(--semi-color-bg-0)',
          }}
        >
          <Spin size='large' />
        </div>
      )}
      {error && (
        <div className='flex h-full items-center justify-center px-6 text-center'>
          <Typography.Text type='danger'>{error}</Typography.Text>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title='Open WebUI'
        allow='clipboard-read; clipboard-write; microphone; camera'
        onLoad={() => {
          setOpenWebUILoaded(false);
          setIframeLoaded(true);
          sendPreferenceMessage(true);
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: ssoPayload && !error ? 'block' : 'none',
          background: 'var(--semi-color-bg-0)',
        }}
      />
    </main>
  );
};

export default Chat;
