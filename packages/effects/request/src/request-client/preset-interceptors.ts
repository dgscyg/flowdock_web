import type { RequestClient } from './request-client';
import type { MakeErrorMessageFn, ResponseInterceptorConfig } from './types';

import { $t } from '@vben/locales';
import { isFunction } from '@vben/utils';
import axios from 'axios';

// 工具函数，确保token是字符串类型
function ensureString(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
}

// 使用as any断言
function assertAny<T>(obj: T): any {
  return obj as any;
}

export const defaultResponseInterceptor = ({
  codeField = 'code',
  msgField = `msg`,
  dataField = 'data',
  successCode = 0,
}: {
  /** 响应数据中代表访问结果的字段名 */
  codeField: string;
  /** 响应数据中代表错误信息的字段名 */
  msgField: string;
  /** 响应数据中装载实际数据的字段名，或者提供一个函数从响应数据中解析需要返回的数据 */
  dataField: ((response: any) => any) | string;
  /** 当codeField所指定的字段值与successCode相同时，代表接口访问成功。如果提供一个函数，则返回true代表接口访问成功 */
  successCode: ((code: any) => boolean) | number | string;
}): ResponseInterceptorConfig => {
  return {
    fulfilled: (response) => {
      const { config, data: responseData, status } = response;

      if (config.responseReturn === 'raw') {
        return response;
      }

      if (status >= 200 && status < 400) {
        if (config.responseReturn === 'body') {
          return responseData;
        } else if (
          isFunction(successCode)
            ? successCode(responseData[codeField])
            : responseData[codeField] === successCode
        ) {
          return isFunction(dataField)
            ? dataField(responseData)
            : responseData[dataField];
        } else {
          // When code is not equal to successCode (e.g., not 0), throw an error object structured for errorMessageResponseInterceptor
          throw {
            response: {
              status,
              data: { ...responseData, message: responseData[msgField] || 'Unknown error' }
            }
          };
        }
      }
      throw Object.assign({}, response, { response });
    },
  };
};

export const authenticateResponseInterceptor = ({
  client,
  doReAuthenticate,
  doRefreshToken,
  enableRefreshToken,
  formatToken,
}: {
  client: RequestClient;
  doReAuthenticate: () => Promise<void>;
  doRefreshToken: () => Promise<string>;
  enableRefreshToken: boolean;
  formatToken: (token: string) => null | string;
}): ResponseInterceptorConfig => {
  return {
    rejected: async (error) => {
      const { config, response } = error;
      // 如果不是 401 错误，直接抛出异常
      if (response?.status !== 401) {
        throw error;
      }
      // 判断是否启用了 refreshToken 功能
      // 如果没有启用或者已经是重试请求了，直接跳转到重新登录
      if (!enableRefreshToken || config.__isRetryRequest) {
        await doReAuthenticate();
        throw error;
      }
      // 如果正在刷新 token，则将请求加入队列，等待刷新完成
      if (client.isRefreshing) {
        return new Promise((resolve) => {
          client.refreshTokenQueue.push((newToken: string) => {
            config.headers.Authorization = formatToken(newToken);
            resolve(client.request(config.url, { ...config }));
          });
        });
      }

      // 标记开始刷新 token
      client.isRefreshing = true;
      // 标记当前请求为重试请求，避免无限循环
      config.__isRetryRequest = true;

      try {
        const newToken = await doRefreshToken();

        // 处理队列中的请求
        client.refreshTokenQueue.forEach((callback) => callback(newToken));
        // 清空队列
        client.refreshTokenQueue = [];

        return client.request(error.config.url, { ...error.config });
      } catch (refreshError) {
        // 如果刷新 token 失败，处理错误（如强制登出或跳转登录页面）
        client.refreshTokenQueue.forEach((callback) => callback(''));
        client.refreshTokenQueue = [];
        console.error('Refresh token failed, please login again.');
        await doReAuthenticate();

        throw refreshError;
      } finally {
        client.isRefreshing = false;
      }
    },
  };
};

export const errorMessageResponseInterceptor = (
  makeErrorMessage?: MakeErrorMessageFn,
): ResponseInterceptorConfig => {
  return {
    rejected: (error: any) => {
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      const err: string = error?.toString?.() ?? '';
      let errMsg = '';
      if (err?.includes('Network Error')) {
        errMsg = $t('ui.fallback.http.networkError');
      } else if (error?.message?.includes?.('timeout')) {
        errMsg = $t('ui.fallback.http.requestTimeout');
      }
      if (errMsg) {
        makeErrorMessage?.(errMsg, error);
        return Promise.reject(error);
      }

      let errorMessage = '';
      const status = error?.response?.status;

      switch (status) {
        case 400: {
          errorMessage = $t('ui.fallback.http.badRequest');
          break;
        }
        case 401: {
          errorMessage = $t('ui.fallback.http.unauthorized');
          break;
        }
        case 403: {
          errorMessage = $t('ui.fallback.http.forbidden');
          break;
        }
        case 404: {
          errorMessage = $t('ui.fallback.http.notFound');
          break;
        }
        case 408: {
          errorMessage = $t('ui.fallback.http.requestTimeout');
          break;
        }
        default: {
          errorMessage = $t('ui.fallback.http.internalServerError');
        }
      }
      makeErrorMessage?.(errorMessage, error);
      return Promise.reject(error);
    },
  };
};

/**
 * 业务码token刷新拦截器 - 处理响应状态码为200但业务码为特定值（如1004）时的token刷新
 * 与authenticateResponseInterceptor不同，这个拦截器处理的是业务层面的token失效，而不是HTTP 401状态
 */
export const businessTokenRefreshInterceptor = ({
  client,
  doRefreshToken,
  doReAuthenticate,
  formatToken,
  tokenRefreshCode = 1004,
  tokenRefreshMessage = '刷新token',
  tokenReloginCode = 1003,
  tokenReloginMessage = '信息过期, 请重新登录',
}: {
  client: RequestClient;
  doRefreshToken: () => Promise<string>;
  doReAuthenticate: () => Promise<void>;
  formatToken: (token: string) => null | string;
  tokenRefreshCode?: number;
  tokenRefreshMessage?: string;
  tokenReloginCode?: number;
  tokenReloginMessage?: string;
}): ResponseInterceptorConfig => {
  return {
    fulfilled: async (response) => {
      const { config, data: responseData } = response;
      
      // 如果是raw响应或不需要特殊处理的响应，直接返回
      if (config.responseReturn === 'raw') {
        return response;
      }
      // 检查是否需要重新登录
      if (
        responseData &&
        responseData.code === tokenReloginCode &&
        responseData.msg === tokenReloginMessage
      ) {
        await doReAuthenticate();
        return response;
      }
      
      // 检查是否需要刷新token的业务码和消息
      if (
        responseData &&
        responseData.code === tokenRefreshCode &&
        responseData.msg === tokenRefreshMessage
      ) {
        // 使用类型断言
        const anyConfig = assertAny(config);
        
        // 防止重复请求，如果已经是重试请求，直接返回响应
        if (anyConfig.__isBusinessTokenRetry) {
          return response;
        }
        
        // 如果正在刷新token，将请求加入队列
        if (client.isRefreshing) {
          return new Promise((resolve) => {
            client.refreshTokenQueue.push((token: string) => {
              const formattedToken = formatToken(token);
              if (formattedToken !== null) {
                anyConfig.headers.Authorization = formattedToken;
              }
              
              // Ensure we have a URL, falling back to the original URL if not specified
              const requestUrl = config.url || '';
              resolve(client.request(requestUrl, { ...config }));
            });
          });
        }
        
        // 标记开始刷新token
        client.isRefreshing = true;
        // 标记为业务重试请求
        anyConfig.__isBusinessTokenRetry = true;
        
        try {
          // 执行刷新token操作
          const newToken = await doRefreshToken();
          
          // 处理队列中的请求
          client.refreshTokenQueue.forEach((callback) => callback(newToken));
          // 清空队列
          client.refreshTokenQueue = [];
          
          // 获取格式化后的token
          const token = formatToken(newToken);
          
          // 使用新token重新发送原始请求
          // Ensure we have a URL, falling back to the original URL if not specified
          const requestUrl = config.url || '';
          return client.request(requestUrl, { 
            ...config, 
            headers: { 
              ...config.headers, 
              // 只有当token不为null时才设置
              ...(token !== null ? { Authorization: token } : {})
            } 
          });
        } catch (refreshError) {
          // 刷新token失败，清空队列
          client.refreshTokenQueue.forEach((callback) => callback(''));
          client.refreshTokenQueue = [];
          console.error('Business token refresh failed:', refreshError);
          
          // 将原始响应抛出，交给后续拦截器处理
          throw response;
        } finally {
          client.isRefreshing = false;
        }
      }
      
      // 不需要刷新token，直接返回响应
      return response;
    },
  };
};
