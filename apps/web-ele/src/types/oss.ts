// OSS配置响应类型
export interface OssConfigResp {
  // 首字母大写属性名（我们内部使用）
  Endpoint?: string;       // S3地址
  AccessKeyId?: string;    // S3访问密钥ID
  AccessKeySecret?: string; // S3安全密钥
  Bucket?: string;         // S3存储桶
  Region?: string;         // S3区域
  Path?: string;           // S3上传路径
  StorageUuid?: string;    // 存储源UUID
  
  // 小写属性名（后端API可能返回）
  endpoint?: string;       // S3地址
  accessKeyId?: string;    // S3访问密钥ID
  accessKeySecret?: string; // S3安全密钥
  bucket?: string;         // S3存储桶
  region?: string;         // S3区域
  path?: string;           // S3上传路径
  storageUuid?: string;    // 存储源UUID
}
