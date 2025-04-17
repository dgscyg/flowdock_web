import type { UserInfo } from '@vben/types';
import type { UserInfoResp, UserInfoUpdateReq, UserPasswordUpdateReq } from '#/types/user';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/basic/v1/user/info');
}

/**
 * 更新用户信息
 */
export async function updateUserInfoApi(data: UserInfoUpdateReq) {
  return requestClient.post('/basic/v1/user/update', data);
}

/**
 * 更新用户密码
 */
export async function updateUserPasswordApi(data: UserPasswordUpdateReq) {
  return requestClient.post('/basic/v1/user/safe/pw', data);
}
