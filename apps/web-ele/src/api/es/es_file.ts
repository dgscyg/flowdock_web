import { requestClient } from '#/api/request';
import type { FileInfoEsListReq, FileInfoEsListResp } from '#/types/es';

/**
 * 文件信息列表(ES)
 * @param data 请求参数
 * @param offset 分页偏移
 * @param length 分页长度
 * @returns 文件信息列表和总数
 */
export async function fileInfoEsListApi(data: FileInfoEsListReq, offset: number, length: number): Promise<FileInfoEsListResp> {
  // 确保请求体包含分页信息
  const requestData: FileInfoEsListReq = {
    ...data,
    offset,
    length
  };
  
  return requestClient.post<FileInfoEsListResp>(`/fabri/v1/es/list/${offset}/${length}`, requestData);
}
