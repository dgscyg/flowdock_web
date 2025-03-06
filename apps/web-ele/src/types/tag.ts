import type { PageInfo } from "./task";

// 新增Tag相关接口定义
export interface Tag {
  id: number;
  uuid: string;
  type: number;      // 类型 1-预设标签 2-用户标签
  name: string;      // 名称
  isEnable: number;  // 启用禁用
  userId: number;    // 用户Id
}

export interface TagListReq extends PageInfo {
  name?: string;           // 名称
  type?: number;           // 类型 1-预设标签 2-用户标签
  sortFields?: string[];   // 排序字段
  isEnable?: number;       // 启用禁用
}

export interface TagListResp {
  list?: Tag[];
  total: number;
}
