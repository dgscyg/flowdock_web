import { requestClient } from '#/api/request';

/**
 * OSS URL签名请求参数
 */
export interface OssSignReq {
  url: string;  // 文件地址
}

/**
 * OSS URL签名响应
 */
export interface OssSignResp {
  url?: string;  // 签名后的文件地址
  Url?: string;  // 签名后的文件地址（可能大写返回）
}

/**
 * 获取OSS签名URL
 * @param params 文件URL参数
 */
export async function ossUrlSignApi(params: OssSignReq): Promise<OssSignResp> {
  try {
    const res = await requestClient.post<OssSignResp>('/basic/v1/oss/urlSign', params);
    console.log('OSS签名URL原始返回:', res);
    
    // 规范化响应，处理可能的大小写差异
    return {
      url: res.url || res.Url
    };
  } catch (error) {
    console.error('获取OSS签名URL失败:', error);
    throw error;
  }
}
