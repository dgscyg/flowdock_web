import type { TaskTimeStatReq, TaskTimeStatResp } from '#/types/task';

import { requestClient } from '#/api/request';

/**
 * 任务时间统计
 */
export async function getTaskTimeStat(data: TaskTimeStatReq): Promise<TaskTimeStatResp> {
  return requestClient.post<TaskTimeStatResp>('/fabri/v1/task/time/stat', data);
} 
