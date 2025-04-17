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
