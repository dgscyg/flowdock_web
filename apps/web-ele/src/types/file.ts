// 文件类型定义
export interface FileListReq {
  name?: string;          // 文件名称
  fileType?: string;      // 文件类型
  status?: number;        // 状态 1-待处理 2-正在处理 3-已完成 4-已取消
  storageUuid?: string;   // 存储源UUID
  sortFields?: string[];  // 排序字段
}

export interface File {
  id: number;
  uuid: string;
  name?: string;          // 文件名称
  path?: string;          // 文件路径
  size?: number;          // 文件大小
  fileType?: string;      // 文件类型
  status?: number;        // 状态 1-待处理 2-正在处理 3-已完成 4-已取消
  url?: string;           // 文件地址
  userId?: number;        // 创建者ID
  storageUuid?: string;   // 存储源UUID
  createdAt?: string;     // 创建时间
  updatedAt?: string;     // 更新时间
}

export interface FileListResp {
  list?: File[];
  total: number;
}

export interface FileNewReq {
  name: string;           // 文件名称
  path: string;           // 文件路径
  size: number;           // 文件大小
  fileType: string;       // 文件类型
  url?: string;           // 文件地址
  storageUuid?: string;   // 存储源UUID
}

export interface FileNewResp {
  id: number;
  uuid: string;           // 文件UUID
}

export interface FileDetailReq {
  uuid: string;           // 文件UUID
}

export interface FileDetailResp {
  file: File;
}
