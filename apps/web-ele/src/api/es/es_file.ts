import { requestClient } from '#/api/request';
import type { PacketQueryReq, QueryResultResp, FileInfoEsListResp } from '#/types/es';

/**
 * 数据包查询(ES)
 * @param data 请求参数
 * @param offset 分页偏移
 * @param length 分页长度
 * @returns 数据包列表和总数
 */
export async function fileInfoEsListApi(data: PacketQueryReq, offset: number, length: number): Promise<FileInfoEsListResp> {
  // 确保请求体包含分页信息
  const requestData: PacketQueryReq = {
    ...data,
    offset,
    length
  };
  
  // 调用后端API
  const response = await requestClient.post<QueryResultResp>(`/fabri/v1/es/list/${offset}/${length}`, requestData, {
    timeout: 50000
  });
  
  // 为了保持与旧代码的兼容性，转换响应格式
  return {
    list: response.packets,
    total: response.total
  };
}
