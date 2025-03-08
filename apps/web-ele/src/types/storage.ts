export interface S3Storage {
  id: number;
  uuid: string;
  endpoint?: string; // S3地址
  accessKeyId?: string; // S3访问密钥ID
  accessKeySecret?: string; // S3安全密钥
  bucket?: string; // S3存储桶
  region?: string; // S3区域
  remark?: string; // 备注
  isEnable?: number; // 启用禁用
}

export interface Cursor {
  offset?: number;
  length?: number;
  before?: string;
  after?: string;
}

export interface StorageListReq extends Cursor {
  remark?: string; // 备注
  isEnable?: number; // 是否启用
}

export interface StorageListResp {
  list?: S3Storage[];
  total: number;
  after: string; // 游标查询所需参数
  before: string; // 游标查询所需参数
}

export interface StorageNewReq {
  endpoint: string; // S3地址
  accessKeyId: string; // S3访问密钥ID
  accessKeySecret: string; // S3安全密钥
  bucket: string; // S3存储桶
  region: string; // S3区域
  remark?: string; // 备注
  isEnable?: number; // 启用禁用
}

export interface StorageNewResp {
  uuid: string;
}

export interface StorageDelReq {
  uuid: string;
}

export interface StorageUpdateReq {
  uuid: string;
  endpoint: string; // S3地址
  accessKeyId: string; // S3访问密钥ID
  accessKeySecret: string; // S3安全密钥
  bucket: string; // S3存储桶
  region: string; // S3区域
  remark?: string; // 备注
  isEnable?: number; // 启用禁用
}

// 状态映射
export const enableStatusMapping: Record<number, string> = {
  0: '未启用',
  1: '已启用'
};

export const getEnableStatusDisplay = (status: number): string => {
  return enableStatusMapping[status] || '';
};

export const getEnableStatusTagType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const types: Record<number, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    0: 'info',
    1: 'success'
  };
  return types[status] || 'info';
};
