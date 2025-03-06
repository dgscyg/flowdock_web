import { baseRequestClient, requestClient } from '#/api/request';
import { type AuthApi } from '#/types/auth';


/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/basic/v1/user/login', data);
}

/**
 * 注册
 */
export async function registerApi(data: AuthApi.RegisterParams): Promise<AuthApi.RegisterResult> {
  return requestClient.post<AuthApi.RegisterResult>('/basic/v1/user/register', data);
}


/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return requestClient.get<AuthApi.RefreshTokenResult>('/basic/v1/token/refresh');
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.get('/basic/v1/token/logout');
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  // return requestClient.get<string[]>('/auth/codes');
  return [];
}
