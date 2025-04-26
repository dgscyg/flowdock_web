<template>
  <div class="overview-page">
    <!-- 统计卡片区域 -->
    <ElRow :gutter="16" class="mb-4">
      <!-- 用户数量卡片 -->
      <ElCol :span="8">
        <ElCard class="overview-card" shadow="hover" v-loading="loadingUsers">
          <div class="card-header">
            <div class="card-title">
              <ElIcon><User /></ElIcon>
              <span>用户数量</span>
            </div>
            <ElTag :type="userStats.growthRate > 0 ? 'success' : 'danger'" size="small">
              {{ userStats.growthRate > 0 ? '+' : '' }}{{ userStats.growthRate }}%
            </ElTag>
          </div>
          <div class="card-content">
            <div class="card-value">{{ userStats.total }}</div>
            <div class="card-desc">
              较上期{{ userStats.growth > 0 ? '增长' : '减少' }} {{ Math.abs(userStats.growth) }} 人
            </div>
          </div>
        </ElCard>
      </ElCol>
      
      <!-- 任务创建数量卡片 -->
      <ElCol :span="8">
        <ElCard class="overview-card" shadow="hover" v-loading="loadingTasks">
          <div class="card-header">
            <div class="card-title">
              <ElIcon><List /></ElIcon>
              <span>任务创建数量</span>
            </div>
            <ElTag :type="taskStats.growthRate > 0 ? 'success' : 'danger'" size="small">
              {{ taskStats.growthRate > 0 ? '+' : '' }}{{ taskStats.growthRate }}%
            </ElTag>
          </div>
          <div class="card-content">
            <div class="card-value">{{ taskStats.total }}</div>
            <div class="card-desc">
              较上期{{ taskStats.growth > 0 ? '增长' : '减少' }} {{ Math.abs(taskStats.growth) }} 个
            </div>
          </div>
        </ElCard>
      </ElCol>

      <!-- 存储占用情况卡片 -->
      <ElCol :span="8">
        <ElCard class="overview-card" shadow="hover" v-loading="loadingStorage">
          <div class="card-header">
            <div class="card-title">
              <ElIcon><Folder /></ElIcon>
              <span>存储占用情况</span>
            </div>
          </div>
          <div class="card-content">
            <div class="storage-info">
              <div class="storage-text">
                <div class="card-value">{{ storageStats.usedCapacity }}</div>
                <div class="card-desc">
                  <span>总容量: {{ storageStats.totalCapacity }}</span>
                  <span class="ml-2">剩余: {{ storageStats.remainingCapacity }}</span>
                </div>
              </div>
              <ElProgress 
                type="dashboard" 
                :percentage="storageStats.usedPercentage" 
                :color="storageProgressColors" 
                :stroke-width="10"
                :width="70"
              />
            </div>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 折线图区域 -->
    <ElRow :gutter="16">
      <!-- 用户数量趋势 -->
      <ElCol :span="12">
        <ElCard class="chart-card" shadow="hover" v-loading="loadingUsers">
          <template #header>
            <div class="chart-header">
              <span>用户数量趋势</span>
              <ElSelect v-model="userChartPeriod" size="small" class="chart-period-select">
                <ElOption label="最近7天" value="7days" />
                <ElOption label="最近30天" value="30days" />
                <ElOption label="最近3个月" value="3months" />
              </ElSelect>
            </div>
          </template>
          <div class="chart-container">
            <EchartsUI ref="userChartRef" height="300px" />
          </div>
        </ElCard>
      </ElCol>

      <!-- 任务创建趋势 -->
      <ElCol :span="12">
        <ElCard class="chart-card" shadow="hover" v-loading="loadingTasks">
          <template #header>
            <div class="chart-header">
              <span>任务创建趋势</span>
              <ElSelect v-model="taskChartPeriod" size="small" class="chart-period-select">
                <ElOption label="最近7天" value="7days" />
                <ElOption label="最近30天" value="30days" />
                <ElOption label="最近3个月" value="3months" />
              </ElSelect>
            </div>
          </template>
          <div class="chart-container">
            <EchartsUI ref="taskChartRef" height="300px" />
          </div>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { usePreferences } from '@vben/preferences';
import { User, List, Folder } from '@element-plus/icons-vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import {
  ElCard,
  ElRow,
  ElCol,
  ElTag,
  ElIcon,
  ElProgress,
  ElSelect,
  ElOption,
  ElLoading
} from 'element-plus';
import dayjs from 'dayjs';
import { getUserTimeStat } from '#/api/user';
import { getTaskTimeStat } from '#/api/task/stat';
import { getOssCapacityApi } from '#/api/system/oss';
import type { UserTimeStat } from '#/types/user';
import type { TaskTimeStat } from '#/types/task';
import type { OssCapacityResp } from '#/types/storage';

// 图表周期选择
const userChartPeriod = ref<'7days' | '30days' | '3months'>('3months');
const taskChartPeriod = ref<'7days' | '30days' | '3months'>('3months');

// 数据加载状态
const loadingUsers = ref(false);
const loadingTasks = ref(false);
const loadingStorage = ref(false);

// 统计数据
const userStats = reactive({
  total: 0,
  growth: 0,
  growthRate: 0,
  data: [] as UserTimeStat[]
});

const taskStats = reactive({
  total: 0,
  growth: 0,
  growthRate: 0,
  data: [] as TaskTimeStat[]
});

const storageStats = reactive({
  totalCapacity: '0',
  usedCapacity: '0',
  remainingCapacity: '0',
  usedPercentage: 0
});

// 图表引用
const userChartRef = ref();
const taskChartRef = ref();

// 使用echarts
const { renderEcharts: renderUserChart } = useEcharts(userChartRef);
const { renderEcharts: renderTaskChart } = useEcharts(taskChartRef);

// 获取主题模式
const { isDark } = usePreferences();

// 存储进度条颜色
const storageProgressColors = computed(() => {
  return [
    { color: '#67c23a', percentage: 60 },
    { color: '#e6a23c', percentage: 80 },
    { color: '#f56c6c', percentage: 100 }
  ];
});

// 获取统计类型
const getStatType = (period: string): 1 | 2 | 3 => {
  switch (period) {
    case '30days':
      return 1;
    case '7days':
      return 2;
    case '3months':
      return 3;
    default:
      return 2;
  }
};

// 加载用户统计数据
const loadUserStats = async () => {
  try {
    loadingUsers.value = true;
    const statType = getStatType(userChartPeriod.value);
    const date = dayjs().format('YYYY-MM-DD');
    
    const res = await getUserTimeStat({ statType, date });
    userStats.data = res?.list || [];
    
    // 计算总数和增长
    if (userStats.data.length > 0) {
      // 计算所有数据的总和作为总数量
      userStats.total = userStats.data.reduce((sum, item) => sum + (item?.userNum || 0), 0);
      
      // 计算增长
      if (userStats.data.length > 1) {
        // 取前半部分的总和
        const halfLength = Math.floor(userStats.data.length / 2);
        const firstHalfSum = userStats.data.slice(0, halfLength).reduce((sum, item) => sum + (item?.userNum || 0), 0);
        const secondHalfSum = userStats.data.slice(halfLength).reduce((sum, item) => sum + (item?.userNum || 0), 0);
        
        userStats.growth = secondHalfSum - firstHalfSum;
        userStats.growthRate = firstHalfSum > 0 ? parseFloat(((userStats.growth / firstHalfSum) * 100).toFixed(1)) : 0;
      }
    }
    
    initUserChart();
  } catch (error) {
    console.error('加载用户统计数据失败:', error);
  } finally {
    loadingUsers.value = false;
  }
};

// 加载任务统计数据
const loadTaskStats = async () => {
  try {
    loadingTasks.value = true;
    const statType = getStatType(taskChartPeriod.value);
    const date = dayjs().format('YYYY-MM-DD');
    
    const res = await getTaskTimeStat({ statType, date });
    taskStats.data = res?.list || [];
    
    // 计算总数和增长
    if (taskStats.data.length > 0) {
      // 计算所有数据的总和作为总数量
      taskStats.total = taskStats.data.reduce((sum, item) => sum + (item?.taskNum || 0), 0);
      
      // 计算增长
      if (taskStats.data.length > 1) {
        // 取前半部分的总和与后半部分总和对比计算增长
        const halfLength = Math.floor(taskStats.data.length / 2);
        const firstHalfSum = taskStats.data.slice(0, halfLength).reduce((sum, item) => sum + (item?.taskNum || 0), 0);
        const secondHalfSum = taskStats.data.slice(halfLength).reduce((sum, item) => sum + (item?.taskNum || 0), 0);
        
        taskStats.growth = secondHalfSum - firstHalfSum;
        taskStats.growthRate = firstHalfSum > 0 ? parseFloat(((taskStats.growth / firstHalfSum) * 100).toFixed(1)) : 0;
      }
    }
    
    initTaskChart();
  } catch (error) {
    console.error('加载任务统计数据失败:', error);
  } finally {
    loadingTasks.value = false;
  }
};

// 加载存储统计数据
const loadStorageStats = async () => {
  try {
    loadingStorage.value = true;
    const res = await getOssCapacityApi();
    
    storageStats.totalCapacity = res.totalCapacityFormatted;
    storageStats.usedCapacity = res.usedCapacityFormatted;
    storageStats.remainingCapacity = res.remainingCapacityFormatted;
    storageStats.usedPercentage = Math.floor(res.usedPercentage);
  } catch (error) {
    console.error('加载存储统计数据失败:', error);
  } finally {
    loadingStorage.value = false;
  }
};

// 初始化用户图表
const initUserChart = () => {
  if (userStats.data.length === 0) return;
  
  // 确保数据按时间从早到晚排序
  const sortedData = [...userStats.data].sort((a, b) => {
    return a.datetime && b.datetime ? a.datetime.localeCompare(b.datetime) : 0;
  });
  
  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: sortedData.map(item => item.datetime || '')
    },
    yAxis: {
      type: 'value' as const,
      name: '用户数',
      nameTextStyle: {
        color: isDark.value ? '#E5EAF3' : '#464C5B'
      }
    },
    series: [
      {
        name: '用户数量',
        type: 'line' as const,
        data: sortedData.map(item => item.userNum),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: isDark.value ? 'rgba(64, 158, 255, 0.7)' : 'rgba(64, 158, 255, 0.5)'
              },
              {
                offset: 1,
                color: isDark.value ? 'rgba(64, 158, 255, 0.1)' : 'rgba(64, 158, 255, 0.05)'
              }
            ]
          }
        }
      }
    ]
  };
  
  renderUserChart(option as any);
};

// 初始化任务图表
const initTaskChart = () => {
  if (taskStats.data.length === 0) return;
  
  // 确保数据按时间从早到晚排序
  const sortedData = [...taskStats.data].sort((a, b) => {
    return a.datetime && b.datetime ? a.datetime.localeCompare(b.datetime) : 0;
  });
  
  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: sortedData.map(item => item.datetime || '')
    },
    yAxis: {
      type: 'value' as const,
      name: '任务数',
      nameTextStyle: {
        color: isDark.value ? '#E5EAF3' : '#464C5B'
      }
    },
    series: [
      {
        name: '任务创建数量',
        type: 'line' as const,
        data: sortedData.map(item => item.taskNum),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#67C23A'
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: isDark.value ? 'rgba(103, 194, 58, 0.7)' : 'rgba(103, 194, 58, 0.5)'
              },
              {
                offset: 1,
                color: isDark.value ? 'rgba(103, 194, 58, 0.1)' : 'rgba(103, 194, 58, 0.05)'
              }
            ]
          }
        }
      }
    ]
  };
  
  renderTaskChart(option as any);
};

// 监听主题变化
watch(isDark, () => {
  initUserChart();
  initTaskChart();
});

// 监听周期变化
watch(userChartPeriod, () => {
  loadUserStats();
});

watch(taskChartPeriod, () => {
  loadTaskStats();
});

onMounted(() => {
  loadUserStats();
  loadTaskStats();
  loadStorageStats();
});
</script>

<style scoped>
.overview-page {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.ml-2 {
  margin-left: 8px;
}

.overview-card {
  height: 100%;
  transition: all 0.3s;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.card-title .el-icon {
  margin-right: 8px;
  font-size: 20px;
}

.card-content {
  padding: 8px 0;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.unit {
  font-size: 16px;
  font-weight: 400;
  margin-left: 4px;
}

.card-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}

.storage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.storage-text {
  flex: 1;
}

.chart-card {
  margin-bottom: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-period-select {
  width: 120px;
}

.chart-container {
  height: 300px;
}
</style>
