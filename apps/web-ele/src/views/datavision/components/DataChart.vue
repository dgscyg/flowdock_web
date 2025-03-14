<template>
  <div class="data-chart-container">
    <div class="chart-header">
      <h3 class="text-xl font-medium">图表分析</h3>
      <div class="chart-actions">
        <el-select v-model="chartType" placeholder="选择图表类型" @change="handleChartTypeChange" class="w-36">
          <el-option label="柱状图" value="bar"></el-option>
          <el-option label="折线图" value="line"></el-option>
          <el-option label="饼图" value="pie"></el-option>
          <el-option label="散点图" value="scatter"></el-option>
        </el-select>
        <el-button type="primary" plain icon="Download" @click="exportChart" class="rounded-button">导出图表</el-button>
      </div>
    </div>

    <div class="filter-options">
      <el-form :inline="true" class="chart-form">
        <el-form-item label="X轴">
          <el-select v-model="xAxisField" placeholder="选择X轴字段" @change="renderChart" class="w-36">
            <el-option
              v-for="field in availableFields"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Y轴">
          <el-select 
            v-model="yAxisField" 
            placeholder="选择Y轴字段" 
            @change="renderChart"
            multiple
            v-if="chartType !== 'pie'"
            class="w-48"
          >
            <el-option
              v-for="field in availableFields.filter(f => f.type === 'number')"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
          <el-select 
            v-model="yAxisField" 
            placeholder="选择值字段" 
            @change="renderChart"
            v-else
            class="w-36"
          >
            <el-option
              v-for="field in availableFields.filter(f => f.type === 'number')"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分组" v-if="chartType !== 'pie'">
          <el-select v-model="groupField" placeholder="选择分组字段" @change="renderChart" class="w-36">
            <el-option label="无" value=""></el-option>
            <el-option
              v-for="field in availableFields.filter(f => f.type === 'string')"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="renderChart" class="rounded-button">更新图表</el-button>
          <el-button @click="resetFilters" class="rounded-button">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container" ref="chartContainer"></div>

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
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ElButton,
  ElIcon,
  ElPopover,
  ElForm,
  ElFormItem,
  ElTable,
  ElTableColumn,
  ElSelect,
  ElInput,
  ElMenuItem,
  ElMenu,
  ElOption,
  ElTag,
  ElButtonGroup,
  ElPagination,
  ElRadio,
  ElRadioGroup,
  ElUpload,
  ElProgress,
  ElDatePicker,
  ElTooltip,
  ElMessage,
  ElMessageBox,
  ElPopconfirm,
  ElTabPane,
  ElTabs,
  ElInputNumber,
  ElDialog,
  ElDescriptions,
  ElDescriptionsItem,
  ElCard,
  ElCol,
  ElRow,
} from "element-plus";
// 注意：实际项目中需要引入echarts或其他图表库
// import * as echarts from 'echarts'

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
const chartType = ref<'bar' | 'line' | 'pie' | 'scatter'>('bar');
const xAxisField = ref('');
const yAxisField = ref<string | string[]>('');
const groupField = ref('');
const chart = ref<any>(null);
const summaryStats = ref<ChartSummary[]>([]);
const showSummary = ref(false);
const chartContainer = ref<HTMLElement | null>(null);

// 计算属性
// 可用于图表的字段
const availableFields = computed<Field[]>(() => {
  if (!props.data || !props.data.data || !props.data.data.length) {
    return [];
  }

  // 从第一条数据推断字段类型
  const sample = props.data.data[0];
  if (!sample) return [];
  
  return Object.keys(sample).map(key => {
    const value = sample[key];
    let type = typeof value;
    
    // 处理日期类型 - 用字符串表示自定义类型
    if (type === 'string' && !isNaN(Date.parse(value))) {
      type = 'string'; // 保持为字符串类型
    }
    
    return {
      label: formatFieldLabel(key),
      value: key,
      type: type
    };
  });
});

// 方法
// 格式化字段标签
const formatFieldLabel = (key: string): string => {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
};

// 处理图表类型更改
const handleChartTypeChange = (): void => {
  if (chartType.value === 'pie' && Array.isArray(yAxisField.value)) {
    // 饼图只能选择一个值字段
    yAxisField.value = yAxisField.value[0] || '';
  }
  renderChart();
};

// 重置过滤器
const resetFilters = (): void => {
  xAxisField.value = '';
  yAxisField.value = '';
  groupField.value = '';
  renderChart();
};

// 渲染图表
const renderChart = (): void => {
  // 检查是否有必要的字段
  if (!xAxisField.value || !yAxisField.value || !props.data || !props.data.data) {
    destroyChart();
    return;
  }
  
  nextTick(() => {
    // 在实际项目中，此处应初始化图表
    // chart.value = echarts.init(chartContainer.value);
    
    // 根据图表类型和选择的字段生成配置
    const option = generateChartOption();
    
    // 应用配置
    // chart.value.setOption(option);
    
    // 模拟图表渲染
    console.log('渲染图表: ', chartType.value, {
      xAxis: xAxisField.value,
      yAxis: yAxisField.value,
      groupBy: groupField.value
    });
    
    // 生成统计摘要
    generateSummaryStats();
  });
};

// 生成图表配置
const generateChartOption = (): Record<string, any> => {
  // 不同图表类型的配置生成
  switch (chartType.value) {
    case 'bar':
      return generateBarOption();
    case 'line':
      return generateLineOption();
    case 'pie':
      return generatePieOption();
    case 'scatter':
      return generateScatterOption();
    default:
      return {};
  }
};

// 生成柱状图配置
const generateBarOption = (): Record<string, any> => {
  // 此处应返回echarts的柱状图配置
  return {};
};

// 生成折线图配置
const generateLineOption = (): Record<string, any> => {
  // 此处应返回echarts的折线图配置
  return {};
};

// 生成饼图配置
const generatePieOption = (): Record<string, any> => {
  // 此处应返回echarts的饼图配置
  return {};
};

// 生成散点图配置
const generateScatterOption = (): Record<string, any> => {
  // 此处应返回echarts的散点图配置
  return {};
};

// 销毁图表
const destroyChart = (): void => {
  if (chart.value) {
    // chart.value.dispose();
    chart.value = null;
  }
};

// 导出图表
const exportChart = (): void => {
  if (chart.value) {
    // 在实际项目中，可以导出为图片
    // const url = chart.value.getDataURL({
    //   type: 'png',
    //   pixelRatio: 2,
    //   backgroundColor: '#fff'
    // });
    
    ElMessage({
      message: '图表导出功能将在后续实现',
      type: 'success'
    });
  } else {
    ElMessage.warning('请先生成图表');
  }
};

// 生成统计摘要
const generateSummaryStats = (): void => {
  if (!props.data || !props.data.data || !yAxisField.value) {
    showSummary.value = false;
    return;
  }
  
  // 只对数值类型的Y轴字段生成统计
  const yField = Array.isArray(yAxisField.value) ? yAxisField.value[0] : yAxisField.value;
  if (!yField) {
    showSummary.value = false;
    return;
  }
  
  const values = props.data.data
    .map((item: DataItem) => {
      const val = item[yField];
      return typeof val === 'number' ? val : Number(val);
    })
    .filter((val: number) => !isNaN(val));
  
  if (values.length === 0) {
    showSummary.value = false;
    return;
  }
  
  const sum = values.reduce((acc: number, val: number) => acc + val, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  summaryStats.value = [
    { label: '平均值', value: avg.toFixed(2) },
    { label: '最大值', value: max.toFixed(2) },
    { label: '最小值', value: min.toFixed(2) }
  ];
  
  showSummary.value = true;
};

// 处理窗口大小变化
const handleResize = (): void => {
  if (chart.value) {
    // chart.value.resize();
  }
};

// 生命周期钩子
onMounted(() => {
  // 初始化时设置容器高度
  if (chartContainer.value) {
    chartContainer.value.style.height = '400px';
  }
  
  // 响应窗口大小变化
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // 销毁图表和移除事件监听
  destroyChart();
  window.removeEventListener('resize', handleResize);
});

// 监听数据变化
watch(() => props.data, () => {
  renderChart();
}, { deep: true });
</script>

<style scoped>
.data-chart-container {
  padding: 0 10px;
  height: 100%;
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
}

.chart-container {
  width: 100%;
  height: calc(100vh - 450px);
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;
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
</style> 
