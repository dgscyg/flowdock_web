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
