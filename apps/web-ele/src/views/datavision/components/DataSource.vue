<template>
  <div class="data-source-container">
    <div class="source-header">
      <h3 class="text-xl font-medium">源数据查看</h3>
      <div class="source-actions">
        <el-button type="primary" icon="Download" @click="downloadSource" class="rounded-button">下载原始文件</el-button>
      </div>
    </div>

    <!-- 源文件信息 -->
    <div class="source-info">
      <el-descriptions title="文件信息" border :column="2" size="default">
        <el-descriptions-item label="文件名">{{ sourceFileInfo.fileName || '--' }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(sourceFileInfo.fileSize) }}</el-descriptions-item>
        <el-descriptions-item label="解析完成时间">{{ sourceFileInfo.uploadTime || '--' }}</el-descriptions-item>
        <el-descriptions-item label="文件类型">{{ sourceFileInfo.fileType || '--' }}</el-descriptions-item>
        <el-descriptions-item label="解析状态">
          <el-tag :type="getTagType(sourceFileInfo.parseStatus)">
            {{ sourceFileInfo.parseStatus || '--' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联任务">{{ sourceFileInfo.taskName || '--' }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 文件预览区域 -->
    <div class="file-preview-section">
      <div class="section-header">
        <h4 class="text-lg font-medium">文件预览</h4>
        <el-radio-group v-model="previewMode" size="small">
          <el-radio-button label="文本模式" value="text">文本模式</el-radio-button>
          <el-radio-button label="JSON模式" value="json">JSON模式</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 文本预览 -->
      <div class="preview-container" v-if="previewMode === 'text'">
        <pre class="text-preview">{{ fileContent }}</pre>
      </div>
      <!-- JSON预览 -->
      <div class="preview-container" v-else-if="previewMode === 'json'">
        <pre class="json-preview">{{ formattedJson }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
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
  ElRadioButton,
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
  ElTimeline,
  ElTimelineItem,
} from "element-plus";
import { 
  getStatusDisplay,
  getStatusTagType
} from '#/types/task'

// 接口定义
interface SourceFileInfo {
  fileName?: string;
  fileSize?: number;
  uploadTime?: string;
  fileType?: string;
  parseStatus?: string;
  taskName?: string;
}

interface ParseLog {
  time: string;
  level: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

interface TableColumn {
  prop: string;
  label: string;
}

interface ComponentData {
  sourceFile?: SourceFileInfo;
  fileContent?: string;
  data?: any[];
  parseLogs?: ParseLog[];
  taskInfo?: any;
  fileInfo?: any;
  taskId?: string;
  selectedFileId?: string;
  files?: any[];
}

// 定义props
const props = defineProps({
  data: {
    type: Object as () => ComponentData,
    default: () => ({})
  }
})

// 数据
const previewMode = ref<'text' | 'table' | 'json'>('text')
const fileContent = ref('')
const tableData = ref<any[]>([])
const tableColumns = ref<TableColumn[]>([])
const parseLogs = ref<ParseLog[]>([])
const sourceFileInfo = ref<SourceFileInfo>({})

// 计算属性
// 格式化的JSON
const formattedJson = computed(() => {
  try {
    if (!props.data || !props.data.data) return ''
    return JSON.stringify(props.data.data, null, 2)
  } catch (e) {
    return '无效的JSON数据'
  }
})

// 方法
// 格式化文件大小
const formatFileSize = (size: number | undefined): string => {
  if (!size) return '--'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let formattedSize = size
  let unitIndex = 0
  
  while (formattedSize >= 1024 && unitIndex < units.length - 1) {
    formattedSize /= 1024
    unitIndex++
  }
  
  return `${formattedSize.toFixed(2)} ${units[unitIndex]}`
}

// 获取Tag组件的类型
const getTagType = (status: string | undefined): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  if (!status) return 'info'
  
  const statusMap: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    '成功': 'success',
    '失败': 'danger',
    '进行中': 'warning',
    '待处理': 'info'
  }
  return statusMap[status] || 'info'
}

// 获取时间线项目类型
const getLogTypeForTimeline = (level: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const levelMap: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    'error': 'danger',
    'warning': 'warning',
    'info': 'info',
    'success': 'success'
  }
  return levelMap[level] || 'info'
}

// 获取状态类型 (保留兼容性)
const getStatusType = (status: string | undefined): string => {
  if (!status) return 'info'
  
  const statusMap: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    '成功': 'success',
    '失败': 'danger',
    '进行中': 'warning',
    '待处理': 'info'
  }
  return statusMap[status] || 'info'
}

// 获取日志类型
const getLogType = (level: string): string => {
  const levelMap: Record<string, string> = {
    'error': 'danger',
    'warning': 'warning',
    'info': 'info',
    'success': 'success'
  }
  return levelMap[level] || 'info'
}

// 下载原始文件
const downloadSource = (): void => {
  if (!sourceFileInfo.value.fileName) {
    ElMessage.warning('无可下载的文件')
    return
  }
  
  ElMessage({
    message: `开始下载文件: ${sourceFileInfo.value.fileName}`,
    type: 'success'
  })
  
  // 注意: 按照需求，这个功能暂时保留但不实现具体逻辑
  // 后续实现可能的方向:
  // 1. 使用文件ID从服务器获取下载链接
  // 2. 创建一个blob对象并使用URL.createObjectURL创建下载链接
  // 3. 或直接重定向到文件下载API
  
  // 示例实现方向 (后续根据API情况完善):
  // const fileId = props.data.selectedFileId;
  // const downloadUrl = `/api/files/${fileId}/download`;
  // window.open(downloadUrl, '_blank');
}

// 初始化数据
const initData = (): void => {
  if (!props.data) return
  
  // 设置文件信息
  // 优先使用传入的数据，如果没有则使用默认值
  sourceFileInfo.value = {
    fileName: props.data.fileInfo?.fileName || '示例数据.csv',
    fileSize: props.data.fileInfo?.fileSize || 1024 * 1024 * 2.5, // 2.5MB
    uploadTime: props.data.taskInfo?.updatedAt || '2023-05-15 10:30:45', // 使用task.updatedAt作为解析完成时间
    fileType: props.data.fileInfo?.fileType || 'CSV',
    parseStatus: getStatusDisplay(props.data.fileInfo?.status || 3) || '成功',
    taskName: props.data.taskInfo?.name || '数据解析任务-001'
  }
  
  // 设置文件内容预览
  fileContent.value = props.data.fileContent || '文件内容加载中...\n请稍候'
  
  // 设置表格数据
  if (props.data.data && Array.isArray(props.data.data)) {
    tableData.value = props.data.data
    
    // 从第一条记录生成表格列
    if (tableData.value.length > 0) {
      const firstItem = tableData.value[0]
      if (firstItem) {
        tableColumns.value = Object.keys(firstItem).map(key => ({
          prop: key,
          label: formatColumnLabel(key)
        }))
      }
    }
  }
  
  // 设置解析日志
  parseLogs.value = props.data.parseLogs || [
    { time: props.data.taskInfo?.updatedAt || '2023-05-15 10:31:20', level: 'success', message: '文件解析完成' }
  ]
}

// 格式化列标签
const formatColumnLabel = (key: string): string => {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
}

// 生命周期钩子
onMounted(() => {
  initData()
})

// 监听数据变化
watch(() => props.data, () => {
  initData()
}, { deep: true })
</script>

<style scoped>
.data-source-container {
  padding: 0 10px;
  height: 100%;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 10px;
}

.source-header h3 {
  margin: 0;
}

.source-info {
  margin-bottom: 30px;
}

.file-preview-section, .parse-log-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
}

.preview-container {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  min-height: 300px;
  max-height: 500px;
  overflow: auto;
}

.text-preview, .json-preview {
  margin: 0;
  word-break: break-all;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}

.json-preview {
  color: #333;
}

/* 表格样式 */
.custom-table {
  margin-bottom: 20px;
}

/* 动态行高表格样式 */
:deep(.dynamic-row-height .el-table__header-row) {
  height: 50px !important; /* 表头高度固定 */
}

:deep(.dynamic-row-height .el-table__cell) {
  padding: 10px 0 !important;
  vertical-align: middle !important;
}

:deep(.rounded-button) {
  border-radius: 0.25rem !important;
}
</style> 
