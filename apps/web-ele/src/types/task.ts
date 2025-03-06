export interface TaskTag {
  tagId?: number; // 标签Id, using number for uint64
  tagName?: string; // 标签名称
  tagType?: number; // 标签类型: 1-预设标签, 2-用户标签
}

export interface Task {
  id: number;
  uuid: string;
  name?: string; // 任务名称
  target?: string; // 采集对象
  platform?: number; // 平台 1-Android, 2-IOS, 3-PC, 4-Web
  status?: number; // 状态 1-未开始, 2-进行中, 3-已完成, 4-已取消
  deadline?: string; // 任务结束时间
  updatedAt: string; // 状态变更时间
  createdAt?: string; // 创建时间
  taskTags?: TaskTag[]; // 标签
  remark?: string; // 备注
}

export interface PageInfo {
  offset?: number; // 开始的记录数
  length?: number; // 记录数，最大200
}

export interface TaskListReq extends PageInfo {
  name?: string; // 任务名称
  sortFields?: string[]; // 排序字段
  platform?: number; // 平台
  deadline?: string[]; // 任务结束时间
  createdAt?: string[]; // 创建时间
  status?: number; // 状态
  tagsId?: number; // 标签ids
}

export interface TaskListResp {
  total: number;
  list?: Task[];
}

export interface TaskNewReq {
  name: string; // 任务名称
  target: string; // 采集对象
  platform: number; // 平台
  deadline: string; // 任务结束时间
  tagIds?: number[]; // 标签Ids
  remark?: string; // 备注
}

export interface TaskNewResp {
  uuid: string;
}

// 新增映射定义
export const platformMapping: Record<number, string> = {
  1: 'Android',
  2: 'iOS',
  3: 'PC',
  4: 'Web'
};

export const statusMapping: Record<number, string> = {
  1: '未开始',
  2: '进行中',
  3: '已完成',
  4: '已取消'
};

export const getPlatformDisplay = (platform: number): string => {
  return platformMapping[platform] || '';
};

export const getStatusDisplay = (status: number): string => {
  return statusMapping[status] || '';
};

export const getPlatformTagType = (platform: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const types: Record<number, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    1: 'success',
    2: 'warning',
    3: 'info',
    4: 'primary'
  };
  return types[platform] || 'info';
};

export const getStatusTagType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const types: Record<number, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    1: 'info',
    2: 'primary',
    3: 'success',
    4: 'danger'
  };
  return types[status] || 'info';
};

export const getTagType = (tag: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const types: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    'important': 'danger',
    'urgent': 'warning',
    'normal': 'info'
  };
  return types[tag];
};
