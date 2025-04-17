// 删除旧的全局对象补丁，现在由Vite配置处理
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

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

  /**
   * 从文件URL中提取key
   * @param url 完整的文件URL
   * @returns 文件的key
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      if (!this.config.Bucket) return null;
      
      // 解析URL获取路径
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      
      // 移除开头的斜杠和bucket名称
      const bucketPrefix = `/${this.config.Bucket}/`;
      if (pathname.startsWith(bucketPrefix)) {
        return pathname.substring(bucketPrefix.length);
      }
      
      // 尝试从标准S3 URL中提取
      const s3HostPattern = new RegExp(`^https?://${this.config.Bucket}\\.s3\\..*\\.amazonaws\\.com/(.*)$`);
      const s3Match = url.match(s3HostPattern);
      if (s3Match && s3Match[1]) {
        return s3Match[1];
      }
      
      return null;
    } catch (error) {
      console.error('URL解析失败:', error);
      return null;
    }
  }
  
  /**
   * 生成预签名URL，用于临时访问私有对象
   * @param url 原始的对象URL
   * @param expiresIn URL有效期(秒)，默认1小时
   * @returns 预签名URL，如果生成失败则返回原始URL
   */
  async getPresignedUrl(url: string, expiresIn: number = 3600): Promise<string> {
    try {
      // 如果不是有效的URL或没有配置Bucket，直接返回原始URL
      if (!url || !this.config.Bucket) {
        return url;
      }
      
      // 从URL中提取对象的key
      const key = this.extractKeyFromUrl(url);
      if (!key) {
        console.warn('无法从URL中提取Key:', url);
        return url;
      }
      
      // 创建GetObject命令
      const command = new GetObjectCommand({
        Bucket: this.config.Bucket,
        Key: key
      }) as any;
      
      // 使用类型断言解决AWS SDK版本冲突问题
      // 生成预签名URL
      const presignedUrl = await getSignedUrl(this.s3Client as any, command, { expiresIn });
      console.log('生成预签名URL成功:', { originalUrl: url, presignedUrl });
      
      return presignedUrl;
    } catch (error) {
      console.error('生成预签名URL失败:', error);
      return url; // 失败时返回原始URL
    }
  }
} 
