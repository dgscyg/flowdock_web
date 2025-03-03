import { baseRequestClient, requestClient } from '#/api/request';
import { type AuthApi } from '#/types/auth';


/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/user/login', data);
}

/**
 * 注册
 */
export async function registerApi(data: AuthApi.RegisterParams): Promise<AuthApi.RegisterResult> {
  return requestClient.post<AuthApi.RegisterResult>('/user/register', data);
}


/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return requestClient.get<AuthApi.RefreshTokenResult>('/token/refresh');
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.get('/token/logout');
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  // return requestClient.get<string[]>('/auth/codes');
  return [];
}
