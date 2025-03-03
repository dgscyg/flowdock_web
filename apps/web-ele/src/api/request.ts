/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAuthStore } from '#/store';
import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  businessTokenRefreshInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';
import { ElMessage } from 'element-plus';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    // console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
    accessStore.setAccessToken(null);
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.token;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    // return token ? `Bearer ${token}` : null;
    return token ? token : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理业务码为1004的token刷新
  client.addResponseInterceptor(
    businessTokenRefreshInterceptor({
      client,
      doRefreshToken,
      doReAuthenticate,
      formatToken,
      tokenRefreshCode: 1004,
      tokenRefreshMessage: '刷新token',
      tokenReloginCode: 1003,
      tokenReloginMessage: '信息过期, 请重新登录',
    }),
  );

  // 捕获Vue Router初始化期间的错误
  // 防止路由启动时因token问题导致整个应用崩溃
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && typeof error === 'object' && 'code' in error && error.code === 1003) {
      // 防止错误传播到Vue Router
      event.preventDefault();
      // 静默处理路由初始化期间的token过期错误
      const accessStore = useAccessStore();
      if (!accessStore.accessToken) {
        // 如果没有token，不做处理，让路由守卫正常重定向到登录页
        return;
      }
      // 如果有token但过期了，清除token
      accessStore.setAccessToken(null);
    }
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      msgField: 'msg',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // // token过期的处理
  // client.addResponseInterceptor(
  //   authenticateResponseInterceptor({
  //     client,
  //     doReAuthenticate,
  //     doRefreshToken,
  //     enableRefreshToken: preferences.app.enableRefreshToken,
  //     formatToken,
  //   }),
  // );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.message ?? '';
      // 如果没有错误信息，则会根据状态码进行提示
      ElMessage.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
