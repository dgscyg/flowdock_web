import type { UserTimeStatReq, UserTimeStatResp } from '#/types/user';

import { requestClient } from '#/api/request';

/**
 * 用户时间统计
 */
export async function getUserTimeStat(data: UserTimeStatReq): Promise<UserTimeStatResp> {
  return requestClient.post<UserTimeStatResp>('/basic/v1/user/time/stat', data);
} 
