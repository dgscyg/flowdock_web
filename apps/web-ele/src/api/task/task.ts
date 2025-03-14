import { requestClient } from '#/api/request';
import type { 
  TaskListReq, 
  TaskListResp, 
  TaskNewReq, 
  TaskNewResp,
  TaskDetailReq,
  TaskDetailResp,
  TaskDelReq,
  TaskUpdateReq
} from '#/types/task';

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

/**
 * 任务删除
 */
export async function taskDeleteApi(params: TaskDelReq): Promise<void> {
  return requestClient.get('/fabri/v1/task/del', { params });
};

/**
 * 任务详情
 */
export async function taskDetailApi(uuid: string): Promise<TaskDetailResp> {
  const params: TaskDetailReq = { uuid };
  return requestClient.get<TaskDetailResp>('/fabri/v1/task/detail', { params });
}

/**
 * 任务更新
 */
export async function taskUpdateApi(data: TaskUpdateReq): Promise<void> {
  return requestClient.post('/fabri/v1/task/update', data);
}
