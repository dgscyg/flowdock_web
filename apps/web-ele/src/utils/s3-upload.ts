// 删除旧的全局对象补丁，现在由Vite配置处理
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export interface S3Config {
  Endpoint?: string;       // S3地址
  AccessKeyId?: string;    // S3访问密钥ID
  AccessKeySecret?: string; // S3安全密钥
  Bucket?: string;         // S3存储桶
  Region?: string;         // S3区域
  Path?: string;           // S3上传路径
  StorageUuid?: string;    // 存储源UUID
}

/**
 * S3文件上传工具类 (使用AWS SDK v3)
 */
export class S3Uploader {
  private s3Client: S3Client;
  private config: S3Config;
  private useProxy: boolean = false; // 禁用代理模式

  constructor(config: S3Config) {
    this.config = config;
    
    // 验证关键配置是否存在
    if (!config.Bucket) {
      console.warn('S3配置中缺少Bucket参数');
    }
    
    if (!config.AccessKeyId || !config.AccessKeySecret) {
      console.warn('S3配置中缺少AccessKey或Secret参数');
    }
    
    // 初始化S3客户端
    this.s3Client = new S3Client({
      region: config.Region || 'auto',
      endpoint: config.Endpoint,
      credentials: {
        accessKeyId: config.AccessKeyId || '',
        secretAccessKey: config.AccessKeySecret || ''
      },
      forcePathStyle: true, // 强制使用路径样式，适用于自定义S3兼容的存储
    });
    
    console.log('S3客户端初始化完成', {
      region: config.Region,
      endpoint: config.Endpoint,
      bucket: config.Bucket,
      // 不打印敏感信息
      hasAccessKey: !!config.AccessKeyId,
      hasSecret: !!config.AccessKeySecret
    });
  }

  /**
   * 上传文件到S3
   * @param file 要上传的文件
   * @param onProgress 进度回调函数
   * @returns Promise<上传结果>
   */
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<{url: string, key: string}> {
    const currentDate = new Date();
    const formatDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    
    // 生成唯一文件名
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = encodeURIComponent(file.name);
    const key = this.config.Path ? 
      `${this.config.Path}/${randomString}/${fileName}` : 
      `${formatDate}/${randomString}/${fileName}`;
    
    // 确保Bucket参数存在
    if (!this.config.Bucket) {
      throw new Error('上传失败: S3配置缺少Bucket参数');
    }
    
    try {
      console.log('开始上传文件到S3:', {
        bucket: this.config.Bucket,
        key: key,
        size: file.size,
        type: file.type
      });
      
      // 直接使用SDK上传
      // 创建上传实例
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.config.Bucket,
          Key: key,
          Body: file,
          ContentType: file.type
        },
      });
      
      // 添加进度处理
      if (onProgress) {
        upload.on('httpUploadProgress', (progress: any) => {
          if (progress.loaded !== undefined && progress.total !== undefined) {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            onProgress(percentage);
          }
        });
      }
      
      // 执行上传
      const result = await upload.done();
      console.log('文件上传成功', result);
      
      // 构建访问URL
      const url = this.buildUrlFromEndpoint(key);
      return { url, key };
    } catch (error) {
      console.error('S3上传失败:', error);
      throw error;
    }
  }
  
  /**
   * 从Endpoint和key构建URL
   * @param key 文件的key
   * @returns URL字符串
   */
  private buildUrlFromEndpoint(key: string): string {
    // 优先使用配置的Endpoint构建URL
    if (this.config.Endpoint) {
      // 直接使用Endpoint构建URL
      const url = new URL(this.config.Endpoint);
      return `${url.protocol}//${url.host}/${this.config.Bucket}/${key}`;
    }
    
    // 如果没有Endpoint，使用区域构建标准的S3 URL
    if (!this.config.Region) return '';
    
    return `https://${this.config.Bucket}.s3.${this.config.Region}.amazonaws.com/${key}`;
  }
  
  /**
   * 删除S3中的文件
   * @param key 文件的key
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.Bucket || '',
      Key: key,
    });
    
    await this.s3Client.send(command);
  }
} 
