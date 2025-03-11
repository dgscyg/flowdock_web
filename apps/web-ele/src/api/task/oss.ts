import { requestClient } from '#/api/request';
import type { OssConfigResp } from '#/types/oss';

// 开发环境默认配置，仅用于调试
const DEFAULT_DEV_CONFIG: OssConfigResp = {
  Endpoint: 'http://127.0.0.1:9000',
  AccessKeyId: 'minioadmin',
  AccessKeySecret: 'minioadmin', 
  Bucket: 'test-bucket',
  Region: 'us-east-1',
  Path: 'uploads',
  StorageUuid: 'dev-uuid'
};

/**
 * 获取OSS配置
 */
export async function ossConfigApi(): Promise<OssConfigResp> {
  try {
    const res = await requestClient.get<OssConfigResp>('/basic/v1/oss/config');
    
    console.log('OSS配置API原始返回:', res);
    
    // 规范化响应字段 - 确保即使返回的是小写属性名也能正常使用
    const normalizedRes: OssConfigResp = {
      // 优先使用大写字段名，不存在则使用小写字段名
      Endpoint: res.Endpoint || res.endpoint,
      AccessKeyId: res.AccessKeyId || res.accessKeyId,
      AccessKeySecret: res.AccessKeySecret || res.accessKeySecret,
      Bucket: res.Bucket || res.bucket,
      Region: res.Region || res.region,
      Path: res.Path || res.path,
      StorageUuid: res.StorageUuid || res.storageUuid
    };
    
    console.log('OSS配置标准化后:', normalizedRes);
    
    // 检查必要配置是否存在
    const hasBucket = !!(res.Bucket || res.bucket);
    const hasEndpoint = !!(res.Endpoint || res.endpoint);
    
    if (!hasBucket) {
      console.warn('OSS配置缺少Bucket参数');
    }
    
    if (!hasEndpoint) {
      console.warn('OSS配置缺少Endpoint参数');
    }
    
    // 开发环境下，如果配置不完整，使用默认配置
    if (import.meta.env.DEV && (!hasBucket || !hasEndpoint)) {
      console.warn('开发环境使用默认OSS配置');
      return DEFAULT_DEV_CONFIG;
    }
    
    return normalizedRes;
  } catch (error) {
    console.error('获取OSS配置失败:', error);
    // 开发环境下使用默认配置
    if (import.meta.env.DEV) {
      console.warn('开发环境使用默认OSS配置');
      return DEFAULT_DEV_CONFIG;
    }
    throw error;
  }
} 
