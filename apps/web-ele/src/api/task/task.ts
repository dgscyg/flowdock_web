import { requestClient } from '#/api/request';
import type { TaskListReq, TaskListResp, TaskNewReq, TaskNewResp } from '#/types/task';

/**
 * 任务列表
 */
export async function taskListApi(params: TaskListReq, offset: number, length: number): Promise<TaskListResp> {
  return requestClient.post<TaskListResp>(`/fabri/v1/task/list/${offset}/${length}`, params);
}

/**
 * 任务新建
 */
export async function taskNewApi(data: TaskNewReq): Promise<TaskNewResp> {
  return requestClient.post<TaskNewResp>('/fabri/v1/task/new', data);
}
