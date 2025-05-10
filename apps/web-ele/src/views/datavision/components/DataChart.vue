<template>
  <div class="data-chart-container">
    <div class="chart-header">
      <h3 class="text-xl font-medium">图表分析</h3>
      <div class="chart-actions">
        <el-select v-model="chartType" placeholder="选择图表类型" @change="handleChartTypeChange" class="w-36">
          <el-option label="时间线" value="timeline"></el-option>
          <el-option label="云图" value="wordcloud"></el-option>
        </el-select>
        <el-button type="primary" plain icon="Download" @click="exportChart" class="rounded-button">导出图表</el-button>
      </div>
    </div>

    <div class="filter-options">
      <el-form :inline="true" class="chart-form">
        <el-form-item v-if="chartType === 'timeline'" label="指标">
          <el-select 
            v-model="yAxisField" 
            placeholder="选择指标" 
            @change="fetchChartData"
            class="w-48"
          >
            <el-option 
              v-for="field in timelineChartFields" 
              :key="field.value" 
              :label="field.label" 
              :value="field.value"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="chartType === 'timeline'" label="图表样式">
          <el-select 
            v-model="chartVisualType" 
            placeholder="选择图表样式" 
            @change="updateChartType"
            class="w-36"
          >
            <el-option label="线图" value="line"></el-option>
            <el-option label="柱图" value="bar"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="chartType === 'timeline' && yAxisField === 'statusCode'" label="状态类型">
          <el-select 
            v-model="statusType" 
            placeholder="选择状态类型" 
            @change="fetchChartData"
            class="w-36"
          >
            <el-option 
              v-for="option in statusTypeOptions" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="chartType === 'wordcloud'" label="数据类型">
          <el-select v-model="xAxisField" placeholder="选择数据类型" @change="fetchChartData" class="w-36">
            <el-option
              v-for="field in cloudChartFields"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="fetchChartData" :loading="loading" class="rounded-button">更新图表</el-button>
          <el-button @click="resetFilters" class="rounded-button">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container" ref="chartContainer" :loading="loading">
      <div v-if="!taskId && !fileId && !fileUuid" class="no-data-tip">
        请先选择数据文件
      </div>
    </div>

    <!-- 数据汇总信息 -->
    <div class="chart-summary" v-if="showSummary">
      <h4 class="text-lg font-medium">数据统计摘要</h4>
      <el-row :gutter="20">
        <el-col :span="8" v-for="(stat, index) in summaryStats" :key="index">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 时间轴缩放控制 -->
    <div v-if="chartType === 'timeline' && timelineData?.series?.length" class="timeline-controls">
      <div class="zoom-controls">
        <el-tooltip content="放大时间轴">
          <el-button :icon="ZoomIn" circle @click="zoomTimeline(0.8)" :disabled="zoomLevel <= 0.2"></el-button>
        </el-tooltip>
        <el-tooltip content="重置缩放">
          <el-button :icon="Refresh" circle @click="resetZoom"></el-button>
        </el-tooltip>
        <el-tooltip content="缩小时间轴">
          <el-button :icon="ZoomOut" circle @click="zoomTimeline(1.2)" :disabled="zoomLevel >= 3"></el-button>
        </el-tooltip>
      </div>
      <el-text type="info">时间跨度：{{ formatTimeRange }}</el-text>
    </div>

    <!-- 云图数据限制设置 -->
    <div v-if="chartType === 'wordcloud'" class="cloud-controls">
      <el-form :inline="true">
        <el-form-item label="显示数量">
          <el-input-number
            v-model="cloudDataLimit"
            :min="5"
            :max="100"
            @change="fetchChartData"
            size="small"
          ></el-input-number>
        </el-form-item>
        <el-text v-if="cloudData?.data" type="info" class="data-count-info">
          共 {{ cloudData.data.length }} 项数据
        </el-text>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElMessage,
  ElCard,
  ElCol,
  ElRow,
  ElInputNumber,
  ElTooltip,
  ElText
} from "element-plus";
import { ZoomIn, ZoomOut, Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { timelineChartApi, cloudChartApi } from '#/api/es';
import type { 
  TimelineChartRequest, 
  TimelineChartResponse, 
  CloudChartRequest, 
  CloudChartResponse,
  CloudChartItem
} from '#/types/es';

// 接口定义
interface Field {
  label: string;
  value: string;
  type: string;
}

interface ChartSummary {
  label: string;
  value: string;
}

interface DataItem {
  [key: string]: any;
}

interface ComponentData {
  sourceFile?: any;
  data?: DataItem[];
  taskId?: string;
  fileId?: string;
  fileUuid?: string;
  [key: string]: any;
}

// 定义TimelinePoint和TimelineSeries接口
interface TimelinePoint {
  value: number;
  count: number;
  xIndex?: number;
  [key: string]: any;
}

interface TimelineSeries {
  name: string;
  data: TimelinePoint[];
  categoryType?: string;
  [key: string]: any;
}

// 定义props
const props = defineProps({
  data: {
    type: Object as () => ComponentData,
    default: () => ({})
  }
});

// 数据
const chartType = ref<string>('timeline');
const xAxisField = ref<string>('hour');
const yAxisField = ref<string>('packets');
const chart = ref<any>(null);
const summaryStats = ref<ChartSummary[]>([]);
const showSummary = ref(false);
const chartContainer = ref<HTMLElement | null>(null);
const timelineData = ref<TimelineChartResponse | null>(null);
const cloudData = ref<CloudChartResponse | null>(null);
const loading = ref<boolean>(false);
const taskId = computed(() => props.data?.taskId || '');
const fileId = computed(() => props.data?.fileId || '');
const fileUuid = computed(() => props.data?.fileUuid || props.data?.sourceFile?.fileUuid || '');
const cloudDataLimit = ref(10); // 云图默认显示10条数据
const zoomLevel = ref(1); // 时间轴缩放级别
const originalTimelineOption = ref<any>(null); // 保存原始时间轴配置
const chartVisualType = ref<string>('line'); // 图表可视化类型：线图或柱图

// 计算属性
// 如果为时间线和云图，则提供不同的字段选择
const isCloudChart = computed(() => chartType.value === 'wordcloud');
const isTimelineChart = computed(() => chartType.value === 'timeline');

// 时间线图表可选字段
const timelineChartFields = computed<Field[]>(() => {
  return [
    { label: '数据包数量', value: 'packets', type: 'number' },
    { label: '状态码', value: 'statusCode', type: 'number' },
    { label: '响应时间', value: 'responseTime', type: 'number' }
  ];
});

// 云图可选字段
const cloudChartFields = computed<Field[]>(() => {
  return [
    { label: 'URL', value: 'url', type: 'string' },
    { label: '路径', value: 'path', type: 'string' },
    { label: '请求方法', value: 'method', type: 'string' },
    { label: '域名', value: 'domain', type: 'string' },
    { label: '状态码', value: 'statusCode', type: 'string' },
    { label: '内容类型', value: 'contentType', type: 'string' }
  ];
});

// 状态码类型选择（当选择状态码图表时使用）
const statusTypeOptions = computed(() => {
  return [
    { label: '全部', value: 'all' },
    { label: '2xx系列', value: '2xx' },
    { label: '3xx系列', value: '3xx' },
    { label: '4xx系列', value: '4xx' },
    { label: '5xx系列', value: '5xx' }
  ];
});

const statusType = ref<string | number[]>([200, 201, 202, 204, 301, 302, 304, 307, 308, 400, 401, 403, 404, 429, 500, 502, 503, 504]);

// 计算时间跨度展示
const formatTimeRange = computed(() => {
  if (!timelineData.value || !timelineData.value.xAxis || timelineData.value.xAxis.length < 2) {
    return '无数据';
  }
  
  try {
    // 获取首尾时间点
    const firstTime = timelineData.value.xAxis[0] || '';
    const lastTime = timelineData.value.xAxis[timelineData.value.xAxis.length - 1] || '';
    
    // 格式化为精确到秒的显示方式
    const formatTime = (timeStr: string): string => {
      if (!timeStr) return '';
      
      try {
        if (timeStr.includes('T')) {
          const parts = timeStr.split('T');
          const datePart = parts[0] || '';
          const timePart = parts[1] ? parts[1].split('.')[0] || '' : '';
          
          // 确保时间部分包含HH:MM:SS格式
          if (timePart) {
            const timeComponents = timePart.split(':');
            if (timeComponents.length >= 3) {
              // 完整显示时间，包括日期和精确到秒的时间
              return `${datePart} ${timeComponents[0]}:${timeComponents[1]}:${timeComponents[2]}`;
            } else if (timeComponents.length === 2) {
              // 如果只有时和分，添加秒
              return `${datePart} ${timeComponents[0]}:${timeComponents[1]}:00`;
            }
          }
          return `${datePart} ${timePart}`;
        }
        
        // 尝试作为日期对象解析
        const date = new Date(timeStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
        
        return timeStr;
      } catch {
        return timeStr;
      }
    };
    
    return `${formatTime(firstTime)} 至 ${formatTime(lastTime)}`;
  } catch (error) {
    console.error('格式化时间范围出错:', error);
    return '时间范围未知';
  }
});

// 方法
// 处理图表类型更改
const handleChartTypeChange = (): void => {
  // 首先，如果有现有图表，移除事件监听器
  if (chartContainer.value && chartType.value === 'timeline') {
    chartContainer.value.removeEventListener('wheel', handleMouseWheel);
  }
  
  // 重置字段选择
  if (chartType.value === 'timeline') {
    yAxisField.value = 'packets';
    statusType.value = [200, 201, 202, 204, 301, 302, 304, 307, 308, 400, 401, 403, 404, 429, 500, 502, 503, 504];
  } 
  // 针对云图，默认使用URL作为展示字段
  else if (chartType.value === 'wordcloud') {
    xAxisField.value = 'url';
  }
  
  fetchChartData();
};

// 重置过滤器
const resetFilters = (): void => {
  if (chartType.value === 'timeline') {
    yAxisField.value = 'packets';
    statusType.value = [200, 201, 202, 204, 301, 302, 304, 307, 308, 400, 401, 403, 404, 429, 500, 502, 503, 504];
  } else if (chartType.value === 'wordcloud') {
    xAxisField.value = 'url';
  }
  fetchChartData();
};

// 获取图表数据
const fetchChartData = async (): Promise<void> => {
  if (!taskId.value && !fileId.value && !fileUuid.value) {
    ElMessage.warning('请先选择文件');
    return;
  }
  
  loading.value = true;
  
  try {
    if (chartType.value === 'timeline') {
      await fetchTimelineData();
    } else if (chartType.value === 'wordcloud') {
      await fetchCloudData();
    }
    
    renderChart();
  } catch (error) {
    console.error('获取图表数据失败:', error);
    ElMessage.error('获取图表数据失败');
  } finally {
    loading.value = false;
  }
};

// 获取时间线数据
const fetchTimelineData = async (): Promise<void> => {
  loading.value = true;
  try {
    const request: TimelineChartRequest = {
      taskId: taskId.value,
      fileId: fileId.value,
      fileUuid: fileUuid.value,
      chartType: Array.isArray(yAxisField.value) ? yAxisField.value[0] as string : yAxisField.value as string,
      statusType: yAxisField.value === 'statusCode' ? 
        (typeof statusType.value === 'string' ? statusType.value : statusType.value.join(',')) : 
        undefined
    };
    
    const response = await timelineChartApi(request);
    timelineData.value = response;
  } catch (error) {
    console.error('获取时间线数据失败:', error);
    ElMessage.error('获取时间线数据失败');
  } finally {
    loading.value = false;
  }
};

// 获取云图数据
const fetchCloudData = async (): Promise<void> => {
  const request: CloudChartRequest = {
    taskId: taskId.value,
    fileId: fileId.value,
    fileUuid: fileUuid.value,
    chartType: xAxisField.value,
    limit: cloudDataLimit.value // 使用用户设置的限制值
  };
  
  const response = await cloudChartApi(request);
  cloudData.value = response;
};

// 渲染图表
const renderChart = (): void => {
  // 检查是否有必要的字段和数据
  if ((chartType.value === 'wordcloud' && !xAxisField.value) ||
      (chartType.value === 'timeline' && !yAxisField.value)) {
    destroyChart();
    return;
  }
  
  if ((chartType.value === 'timeline' && !timelineData.value) ||
      (chartType.value === 'wordcloud' && !cloudData.value)) {
    return;
  }
  
  // 确保时间数据按照时间顺序排序
  if (chartType.value === 'timeline' && timelineData.value) {
    normalizeTimelineData();
  }
  
  nextTick(() => {
    // 初始化图表
    if (!chart.value && chartContainer.value) {
      // 设置更大的高度以容纳所有标签
      chartContainer.value.style.height = '500px';
      chart.value = echarts.init(chartContainer.value);
      
      // 只在timeline图表时添加鼠标滚轮事件
      if (chartType.value === 'timeline') {
        chartContainer.value.addEventListener('wheel', handleMouseWheel);
      }
    }
    
    if (!chart.value) return;
    
    // 根据图表类型和选择的字段生成配置
    const option = generateChartOption();
    
    // 应用配置
    chart.value.setOption(option, true);
    
    // 保存原始时间轴配置
    if (chartType.value === 'timeline') {
      originalTimelineOption.value = structuredClone(option);
    }
    
    // 生成统计摘要
    if (chartType.value === 'timeline') {
      generateSummaryStats();
    } else {
      showSummary.value = false;
    }
  });
};

// 处理时间轴数据，确保按时间顺序显示
const normalizeTimelineData = (): void => {
  if (!timelineData.value || !timelineData.value.xAxis || timelineData.value.xAxis.length < 2) return;
  
  console.log('原始的时间轴数据:', timelineData.value.xAxis);
  
  // 对时间轴数据和对应的系列数据进行排序
  try {
    // 创建时间和索引的映射，精确到毫秒
    const timeMap = timelineData.value.xAxis.map((time, index) => {
      // 确保ISO格式时间戳被正确解析，精确到毫秒
      let timestamp = 0;
      try {
        timestamp = new Date(time).getTime();
      } catch (e) {
        console.error('时间格式解析错误:', time, e);
      }
      
      return {
        time,
        originalIndex: index,
        timestamp
      };
    });
    
    // 按时间戳排序（确保秒级排序）
    timeMap.sort((a, b) => a.timestamp - b.timestamp);
    
    // 获取排序后的时间和序列数据
    const sortedTimes = timeMap.map(item => item.time);
    const indexMap = timeMap.map(item => item.originalIndex);
    
    // 移除相同时间戳的数据点(相同秒)以防重叠
    const uniqueTimes: string[] = [];
    const uniqueIndices: number[] = [];
    const seen = new Set<number>();
    
    timeMap.forEach(item => {
      // 使用秒级粒度检查时间戳是否唯一
      const secondTimestamp = Math.floor(item.timestamp / 1000);
      if (!seen.has(secondTimestamp)) {
        seen.add(secondTimestamp);
        uniqueTimes.push(item.time);
        uniqueIndices.push(item.originalIndex);
      } else {
        console.log(`跳过重复的秒级时间戳: ${item.time}`);
      }
    });
    
    // 更新时间轴数据，使用唯一的秒级时间点
    timelineData.value.xAxis = uniqueTimes;
    
    // 更新系列数据，确保与排序后的时间轴对应
    timelineData.value.series.forEach(series => {
      if (series && typeof series === 'object' && 'categoryType' in series && series.categoryType === 'statusCode') {
        // 对于状态码数据，需要更新xIndex
        if (Array.isArray(series.data)) {
          // 创建新的数据数组
          const newData: any[] = [];
          
          series.data.forEach(point => {
            if ('xIndex' in point && typeof point.xIndex === 'number') {
              // 找到新的索引位置（如果在唯一索引列表中）
              const newIndexPos = uniqueIndices.indexOf(point.xIndex);
              if (newIndexPos >= 0) {
                // 复制原始点并更新xIndex
                const newPoint = { ...point, xIndex: newIndexPos };
                newData.push(newPoint);
              }
            }
          });
          
          // 更新为唯一的数据点
          series.data = newData;
        }
      } else if (Array.isArray(series.data)) {
        // 对于普通数据，按新的顺序重排数组
        const newData: any[] = [];
        
        // 只保留与唯一时间点对应的数据
        uniqueIndices.forEach((origIndex, newIndex) => {
          if (origIndex < series.data.length) {
            newData.push(series.data[origIndex]);
          }
        });
        
        // 更新为唯一的数据点
        series.data = newData;
      }
    });
    
    console.log('处理后的时间轴数据 (按秒排序，无重复):', timelineData.value.xAxis);
    console.log('处理后的时间点数量:', timelineData.value.xAxis.length);
  } catch (error) {
    console.error('排序时间轴数据失败:', error);
  }
};

// 生成图表配置
const generateChartOption = (): Record<string, any> => {
  // 根据图表类型生成配置
  switch (chartType.value) {
    case 'timeline':
      return generateTimelineOption();
    case 'wordcloud':
      return generateWordCloudOption();
    default:
      return {};
  }
};

// 生成时间线图表配置
const generateTimelineOption = (): Record<string, any> => {
  if (!timelineData.value) return {};
  
  const { series, xAxis } = timelineData.value;
  
  // 判断是否是响应时间数据
  const isResponseTime = Array.isArray(yAxisField.value) && 
    yAxisField.value.includes('responseTime');
  
  return {
    title: {
      text: '时间序列数据（秒级显示）',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        // 获取时间点
        const axisValue = params[0].axisValue;
        
        // 格式化时间到秒级别
        let formattedTime = axisValue;
        if (axisValue && axisValue.includes('T')) {
          const parts = axisValue.split('T');
          if (parts.length > 1 && parts[1]) {
            // 提取时间部分 HH:MM:SS
            const timePart = parts[1].split('.')[0] || '';
            if (timePart) {
              // 显示完整时间
              formattedTime = `${parts[0]} ${timePart}`;
            }
          }
        }
        
        let result = formattedTime + '<br/>';
        
        // 格式化每个系列的数据
        params.forEach((param: any) => {
          let value = param.value;
          if (param.seriesName.includes('响应时间')) {
            value = value.toFixed(2) + ' ms';
          }
          result += param.marker + ' ' + param.seriesName + ': ' + value + '<br/>';
        });
        
        return result;
      },
      axisPointer: {
        animation: false,
        type: 'cross',
        lineStyle: {
          color: '#409EFF',
          width: 1,
          opacity: 0.5
        }
      }
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '20%', // 增加底部空间以容纳所有X轴标签
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxis,
      boundaryGap: false,
      axisLine: { onZero: true },
      axisLabel: {
        formatter: function(value: string) {
          // 确保value存在
          if (!value) return '';
          
          // 只显示时间中的秒部分，让用户能清晰看到秒级变化
          if (value.includes('T')) {
            const parts = value.split('T');
            if (parts.length > 1 && parts[1]) {
              // 提取时间部分 HH:MM:SS
              const timePart = parts[1].split('.')[0] || '';
              const timeComponents = timePart.split(':');
              if (timeComponents.length >= 3) {
                // 显示完整 HH:MM:SS 格式
                return timeComponents.join(':');
              }
            }
          }
          
          // 如果不是标准格式，返回原始值
          return value;
        },
        rotate: 45,
        // 强制显示所有标签，不跳过任何数据点
        interval: 0,
        // 保证足够的空间显示标签
        margin: 8,
        showMaxLabel: true,
        showMinLabel: true,
        alignWithLabel: true
      },
      scale: true,
      // 确保X轴刻度和数据点一一对应
      axisTick: {
        alignWithLabel: true,
        interval: 0
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          opacity: 0.2
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: isResponseTime ? '响应时间(ms)' : '数量',
        position: 'left',
        axisLabel: {
          formatter: '{value}'
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            opacity: 0.2
          }
        }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
        xAxisIndex: [0]
      }
    ],
    series: series.map(s => {
      const isResponseTime = s.name.includes('响应时间');
      
      // 针对不同类型数据进行格式化
      let formattedData: number[] = [];
      if (s && typeof s === 'object' && 'categoryType' in s && s.categoryType === 'statusCode') {
        // 对于状态码数据，使用索引来放置数据
        const data = Array.from({ length: xAxis.length }).fill(0); // 用0填充整个数组
        
        // 按照索引填充实际数据
        if (Array.isArray(s.data)) {
          s.data.forEach((point: TimelinePoint) => {
            if (point && typeof point === 'object' && 'xIndex' in point && typeof point.xIndex === 'number') {
              data[point.xIndex] = isResponseTime && 'value' in point ? point.value : 
                'count' in point ? point.count : 0;
            }
          });
        }
        
        formattedData = data as number[];
      } else {
        // 对于其他数据，直接映射值
        formattedData = Array.isArray(s.data) ? s.data.map((point: TimelinePoint) => 
          isResponseTime && 'value' in point ? point.value : 
          'count' in point ? point.count : 0
        ) : [];
      }
      
      return {
        name: s.name,
        type: chartVisualType.value,
        data: formattedData,
        smooth: false, // 不平滑线条，以保留秒级数据的精确性
        step: false, // 不使用阶梯图，保留原始数据点
        connectNulls: false, // 不连接空值，以保持数据原始性
        symbol: chartVisualType.value === 'line' ? 'circle' : 'none',
        symbolSize: 6,
        // 始终显示数据点，以便看到每秒的数据
        showSymbol: true,
        emphasis: {
          focus: 'series',
          scale: true,
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          lineStyle: {
            width: 3
          }
        },
        // 确保显示所有数据点
        showAllSymbol: true,
        sampling: 'none', // 不进行采样，显示所有数据点
        lineStyle: {
          width: 2,
          cap: 'round'
        },
        areaStyle: {
          opacity: 0.2,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: isResponseTime ? 'rgba(128, 0, 255, 0.5)' : 'rgba(58, 77, 233, 0.5)'
            },
            {
              offset: 1,
              color: isResponseTime ? 'rgba(128, 0, 255, 0.1)' : 'rgba(58, 77, 233, 0.1)'
            }
          ])
        }
      };
    })
  };
};

// 生成云图配置
const generateWordCloudOption = (): Record<string, any> => {
  if (!cloudData.value) return {};
  
  const { data, type } = cloudData.value;
  
  // 获取字段的中文名
  const fieldLabel = cloudChartFields.value.find(f => f.value === type)?.label || type;
  
  // 准备数据
  const chartData = data.map(item => ({
    name: item.name,
    value: item.value
  }));
  
  return {
    title: {
      text: `${fieldLabel}热点数据`,
      left: 'center'
    },
    tooltip: {
      show: true,
      formatter: function(params: any) {
        const item = data.find(d => d.name === params.name);
        let tooltip = params.name + ': ' + params.value;
        
        // 如果有额外信息，添加到提示中
        if (item && item.extra) {
          tooltip += '<br/>' + item.extra;
        }
        
        return tooltip;
      }
    },
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '80%',
      height: '80%',
      right: null,
      bottom: null,
      sizeRange: [12, 60],
      rotationRange: [-90, 90],
      rotationStep: 45,
      gridSize: 8,
      drawOutOfBound: false,
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: function() {
          return 'rgb(' + [
            Math.round(Math.random() * 160),
            Math.round(Math.random() * 160),
            Math.round(Math.random() * 160)
          ].join(',') + ')';
        }
      },
      emphasis: {
        focus: 'self',
        textStyle: {
          textShadowBlur: 10,
          textShadowColor: '#333'
        }
      },
      data: chartData
    }]
  };
};

// 销毁图表
const destroyChart = (): void => {
  if (chart.value) {
    // 如果是时间线图表，移除滚轮事件监听
    if (chartType.value === 'timeline' && chartContainer.value) {
      chartContainer.value.removeEventListener('wheel', handleMouseWheel);
    }
    
    chart.value.dispose();
    chart.value = null;
  }
};

// 导出图表
const exportChart = (): void => {
  if (chart.value) {
    // 导出为图片
    const url = chart.value.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    });
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `${chartType.value}-chart.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage({
      message: '图表已导出',
      type: 'success'
    });
  } else {
    ElMessage.warning('请先生成图表');
  }
};

// 生成统计摘要
const generateSummaryStats = (): void => {
  if (!timelineData.value || !timelineData.value.series || !timelineData.value.series.length) {
    showSummary.value = false;
    return;
  }
  
  summaryStats.value = [];
  
  // 对每个系列生成统计
  timelineData.value.series.forEach(series => {
    const isResponseTime = series.name.includes('响应时间');
    
    // 提取数据点的值
    const values = series.data.map(point => isResponseTime ? point.value : point.count);
    
    if (values.length === 0) return;
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // 格式化值
    const formatValue = (value: number) => {
      if (isResponseTime) {
        return value.toFixed(2) + ' ms';
      }
      return value.toFixed(0);
    };
    
    summaryStats.value.push(
      { label: `${series.name}平均值`, value: formatValue(avg) },
      { label: `${series.name}最大值`, value: formatValue(max) },
      { label: `${series.name}最小值`, value: formatValue(min) }
    );
  });
  
  showSummary.value = summaryStats.value.length > 0;
};

// 处理窗口大小变化
const handleResize = (): void => {
  if (chart.value) {
    chart.value.resize();
  }
};

// 生命周期钩子
onMounted(() => {
  // 初始化时设置容器高度
  if (chartContainer.value) {
    chartContainer.value.style.height = '400px';
  }
  
  // 初始渲染
  fetchChartData();
  
  // 响应窗口大小变化
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // 销毁图表前确保移除所有事件监听器
  if (chartContainer.value && chartType.value === 'timeline') {
    chartContainer.value.removeEventListener('wheel', handleMouseWheel);
  }
  
  // 销毁图表和移除窗口大小变化事件监听
  destroyChart();
  window.removeEventListener('resize', handleResize);
});

// 监听数据源变化
watch(() => [
  props.data?.taskId,
  props.data?.fileId,
  props.data?.fileUuid,
  props.data?.sourceFile
], () => {
  fetchChartData();
}, { deep: true });

watch(() => chartType.value, () => {
  handleChartTypeChange();
});

// 时间轴缩放方法
const zoomTimeline = (factor: number): void => {
  if (!chart.value || !timelineData.value) return;
  
  // 更新缩放级别
  zoomLevel.value = Math.min(Math.max(0.2, zoomLevel.value * factor), 3);
  
  // 获取当前图表选项
  const currentOption = chart.value.getOption();
  
  // 更新dataZoom选项
  const dataZoomOption = {
    start: Math.max(0, 50 - 50 * zoomLevel.value),
    end: Math.min(100, 50 + 50 * zoomLevel.value)
  };
  
  // 应用缩放
  chart.value.setOption({
    dataZoom: [
      {
        type: 'inside',
        ...dataZoomOption
      }
    ]
  });
};

// 重置缩放
const resetZoom = (): void => {
  if (!chart.value || !originalTimelineOption.value) return;
  zoomLevel.value = 1;
  chart.value.setOption(originalTimelineOption.value);
};

// 处理鼠标滚轮事件
const handleMouseWheel = (e: WheelEvent): void => {
  if (chartType.value !== 'timeline') return;
  
  // 阻止默认滚动行为
  e.preventDefault();
  
  // 确定缩放方向和系数
  const factor = e.deltaY > 0 ? 1.1 : 0.9;
  
  // 应用缩放
  zoomTimeline(factor);
};

function updateChartType() {
  if (chart.value) {
    renderChart();
  }
}
</script>

<style scoped>
.data-chart-container {
  padding: 0 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 10px;
}

.chart-header h3 {
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 10px;
}

.filter-options {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
}

.chart-container {
  width: 100%;
  flex: 1;
  min-height: 400px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;
  position: relative;
}

.chart-summary {
  margin-top: 20px;
}

.chart-summary h4 {
  margin-bottom: 15px;
}

.stat-card {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

:deep(.w-36) {
  width: 9rem;
}

:deep(.w-48) {
  width: 12rem;
}

:deep(.rounded-button) {
  border-radius: 0.25rem !important;
}

.no-data-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
  font-size: 16px;
}

.timeline-controls {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-fill-color-light);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.zoom-controls {
  display: flex;
  gap: 10px;
}

.cloud-controls {
  margin-top: 20px;
  display: flex;
  align-items: center;
  background-color: var(--el-fill-color-light);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.cloud-controls :deep(.el-form) {
  width: 100%;
  display: flex;
  align-items: center;
}

.cloud-controls :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 20px;
}

.data-count-info {
  margin-left: 1rem;
}
</style> 
