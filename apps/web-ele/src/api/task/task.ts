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

// 新增任务删除接口
export const taskDeleteApi = (uuid: string) => {
  return requestClient.get('/fabri/v1/task/del', { params: { uuid } });
};

// 新增任务详情接口
export async function taskDetailApi(uuid: string): Promise<any> {
  return requestClient.get('/fabri/v1/task/detail', { params: { uuid } });
}

// 新增任务更新接口
export async function taskUpdateApi(data: any): Promise<any> {
  return requestClient.post('/fabri/v1/task/update', data);
}
