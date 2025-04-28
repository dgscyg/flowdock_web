import type { UserTimeStatReq, UserTimeStatResp, UserListReq, UserListResp, UserEnableReq } from '#/types/user';

import { requestClient } from '#/api/request';

/**
 * 用户时间统计
 */
export async function getUserTimeStat(data: UserTimeStatReq): Promise<UserTimeStatResp> {
  return requestClient.post<UserTimeStatResp>('/basic/v1/user/time/stat', data);
} 

/**
 * 获取用户列表
 */
export async function getUserList(data: UserListReq): Promise<UserListResp> {
  const { pageIndex, pageSize, ...params } = data;
  // 将页码转换为偏移量(offset)，页码从1开始，偏移量从0开始
  const offset = pageIndex - 1;
  return requestClient.post<UserListResp>(`/basic/v1/user/list/${offset}/${pageSize}`, params);
}

/**
 * 用户启用/禁用
 */
export async function userEnable(data: UserEnableReq): Promise<void> {
  return requestClient.post<void>('/basic/v1/user/enable', data);
} 
