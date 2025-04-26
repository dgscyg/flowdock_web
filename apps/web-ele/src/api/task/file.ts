import { requestClient } from '#/api/request';
import type { FileListReq, FileListResp, FileNewReq, FileNewResp, FileDetailResp, FileDetailReq, FileDelReq } from '#/types/file';

/**
 * 文件列表
 */
export async function fileListApi(data: FileListReq, offset: number, length: number): Promise<FileListResp> {
  return requestClient.post<FileListResp>(`/fabri/v1/file/list/${offset}/${length}`, data);
}

/**
 * 文件新建
 */
export async function fileNewApi(data: FileNewReq): Promise<FileNewResp> {
  return requestClient.post<FileNewResp>('/fabri/v1/file/new', data);
}

/**
 * 文件详情
 */
export async function fileDetailApi(uuid: string): Promise<FileDetailResp> {
  const params: FileDetailReq = { uuid };
  return requestClient.get<FileDetailResp>('/fabri/v1/file/detail', { params });
}

/**
 * 文件删除
 */
export async function fileDeleteApi(uuid: string): Promise<void> {
  const params: FileDelReq = { uuid };
  return requestClient.get('/fabri/v1/file/del', { params });
} 
