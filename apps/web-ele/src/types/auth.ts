export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    token: string
  }

  export interface RegisterParams {
    username?: string;
    password?: string;
  }

  export interface RegisterResult {
    accessToken: string;
  }
}
