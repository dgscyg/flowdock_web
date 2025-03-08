import { requestClient } from '#/api/request';
import type { 
  StorageListReq, 
  StorageListResp, 
  StorageNewReq, 
  StorageNewResp,
  StorageUpdateReq
} from '#/types/storage';

/**
 * 存储源列表
 */
export async function storageListApi(params: StorageListReq): Promise<StorageListResp> {
  return requestClient.post<StorageListResp>('/basic/v1/system/storage/list', params);
}

/**
 * 新建存储配置
 */
export async function storageNewApi(data: StorageNewReq): Promise<StorageNewResp> {
  return requestClient.post<StorageNewResp>('/basic/v1/system/storage/new', data);
}

/**
 * 删除存储配置
 */
export function storageDeleteApi(uuid: string) {
  return requestClient.get('/basic/v1/system/storage/del', { params: { uuid } });
}

/**
 * 更新存储配置
 */
export async function storageUpdateApi(data: StorageUpdateReq): Promise<any> {
  return requestClient.post('/basic/v1/system/storage/update', data);
}
