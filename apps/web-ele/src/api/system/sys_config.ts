import { requestClient } from '#/api/request';

import {
  type ConfigDetailReq,
  type Config
} from '#/types/sys_config';

/**
 * 配置详情
 */
export async function configDetailApi(params: ConfigDetailReq): Promise<Config> {
  return requestClient.post<Config>('/basic/v1/system/config/detail', params);
}

/**
 * 配置更新(新建)
 */
export async function configUpdateApi(params: Config): Promise<any> {
  return requestClient.post('/basic/v1/system/config/update', params);
} 
