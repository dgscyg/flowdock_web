/** 用户信息响应 */
export interface UserInfoResp {
  /** 角色 */
  roles?: string[];
  /** 真实姓名 */
  username?: string;
  /** 昵称 */
  realName?: string;
  /** 头像 */
  avatar?: string;
  /** 用户编号 */
  userId?: string;
}

/** 用户信息更新请求 */
export interface UserInfoUpdateReq {
  /** 真实姓名 */
  username?: string;
  /** 昵称 */
  realName?: string;
  /** 头像 */
  avatar?: string;
}

/** 用户密码更新请求 */
export interface UserPasswordUpdateReq {
  /** 旧密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
}

export interface UserTimeStatReq {
  statType?: 1 | 2 | 3; // 统计类型 1-按最近一个月统计 2-按最近一周统计 3-按三个月统计
  date?: string; // 日期，格式：2006-01-02
}

export interface UserTimeStat {
  datetime?: string; // 时间
  userNum: number; // 用户数量
}

export interface UserTimeStatResp {
  list: UserTimeStat[];
}

/** 全局表单 */
export interface GlobalForm {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/** 分页信息 */
export interface PageInfo {
  pageIndex: number;
  pageSize: number;
}

/** 用户列表请求参数 */
export interface UserListReq {
  pageIndex: number;
  pageSize: number;
  status?: 0 | 1 | 2 | 3; // 状态 1正常 2注销 3禁用, 0表示全部
  nickname?: string; // 昵称
  realname?: string; // 真实姓名
  userId?: number; // 用户ID
  roleCode?: string; // 角色编码
  sortFields?: string[]; // 排序字段
}

/** 用户列表项 */
export interface UserList extends GlobalForm {
  userNo: string; // 用户编号
  nickname: string; // 昵称
  realname: string; // 真实姓名
  avatar: string; // 头像
  roleCode?: string; // 角色编码
  status: number; // 状态 1正常 2注销 3禁用
  lastLoginTime: string; // 上次登录时间
  lastLoginIp: string; // 上次登录IP
}

/** 用户列表响应 */
export interface UserListResp {
  total: number;
  list?: UserList[];
}

/** 用户启用/禁用请求 */
export interface UserEnableReq {
  userId: number; // 用户ID
  roleCode?: string; // 角色编码
  status: 1 | 3; // 状态 1正常 3禁用
  disableReason?: string; // 封禁原因
}
