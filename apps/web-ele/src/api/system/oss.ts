import type { OssCapacityResp } from '#/types/storage';

import { requestClient } from '#/api/request';

/**
 * 获取OSS存储容量信息
 */
export async function getOssCapacityApi(): Promise<OssCapacityResp> {
  return requestClient.get<OssCapacityResp>('/basic/v1/oss/capacity');
} 
