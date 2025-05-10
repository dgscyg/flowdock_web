import { requestClient } from '#/api/request';
import type { 
  TimelineChartRequest, 
  TimelineChartResponse, 
  CloudChartRequest, 
  CloudChartResponse 
} from '#/types/es';

/**
 * 获取时间轴数据
 * @param data 请求参数
 * @returns 时间轴数据
 */
export async function timelineChartApi(data: TimelineChartRequest): Promise<TimelineChartResponse> {
  const response = await requestClient.post<TimelineChartResponse>('/fabri/v1/es/timeline/har', data, {
    timeout: 30000
  });
  
  return response;
}

/**
 * 获取云图数据
 * @param data 请求参数
 * @returns 云图数据
 */
export async function cloudChartApi(data: CloudChartRequest): Promise<CloudChartResponse> {
  const response = await requestClient.post<CloudChartResponse>('/fabri/v1/es/cloudchart/har', data, {
    timeout: 30000
  });
  
  return response;
} 
