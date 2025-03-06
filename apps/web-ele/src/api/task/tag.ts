import { requestClient } from '#/api/request';
import type { TagListReq, TagListResp } from '#/types/tag';

/**
 * 标签列表
 */
export async function tagListApi(params: TagListReq, offset: number, length: number): Promise<TagListResp> {
  return requestClient.post<TagListResp>(`/fabri/v1/tag/list/${offset}/${length}`, params);
}
