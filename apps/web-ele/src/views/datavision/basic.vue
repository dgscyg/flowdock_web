<template>
  <div class="data-vision-container">
    <!-- 判断是否显示选择覆盖层或主内容区域 -->
    <template v-if="!selectedTask || !selectedFile">
      <!-- 未选择任务或文件时的覆盖层 -->
      <div class="selection-overlay">
        <div class="selection-card">
          <h2 class="card-title">选择数据任务</h2>
          <p class="card-subtitle">请先选择任务和文件以查看数据分析</p>
          
          <div class="selection-form">
            <div class="form-item">
              <label>任务名称</label>
              <el-autocomplete
                v-model="taskSearchKeyword"
                :fetch-suggestions="fetchTaskSuggestions"
                placeholder="搜索任务"
                clearable
                :prefix-icon="Search"
                class="input-full-width"
                :loading="taskLoading"
                :trigger-on-focus="true"
                @select="handleTaskSelectFromSuggestion"
                @clear="handleClearTaskSearch"
                @focus="handleTaskSearchFocus"
              >
                <template #default="{ item }">
                  <div class="task-suggestion-item">
                    <div class="task-name">{{ item.task.name }}</div>
                    <div class="task-meta">
                      <el-tag size="small" :type="getPlatformTagType(item.task.platform)">
                        {{ getPlatformDisplay(item.task.platform) }}
                      </el-tag>
                      <el-tag size="small" :type="getStatusTagType(item.task.status)" class="ml-2">
                        {{ getStatusDisplay(item.task.status) }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </el-autocomplete>
            </div>
            
            <div class="form-item">
              <label>任务文件</label>
              <el-select
                v-model="selectedFile"
                filterable
                remote
                placeholder="选择任务文件"
                :remote-method="searchFiles"
                :loading="fileSearchLoading"
                class="input-full-width"
                :disabled="!selectedTask"
                @focus="loadTaskFiles"
              >
                <template #prefix>
                  <el-icon><Document /></el-icon>
                </template>
                <el-option
                  v-for="item in fileOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                  <div class="file-option">
                    <span>{{ item.label }}</span>
                    <span class="file-option-meta">
                      {{ (item.fileData.fileSize || 0) / 1024 | 0 }} KB · {{ item.fileData.fileType }}
                    </span>
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- 主内容区域：仅在选择了任务和文件后显示 -->
    <template v-else>
      <!-- 顶部筛选区 -->
      <div class="filter-container">
        <!-- 已选择任务和文件的提示信息放在左侧 -->
        <div class="selected-info">
          <el-tag type="success" size="large">
            <el-icon><Select /></el-icon>
            <span class="ml-1">
              <template v-if="selectedFile && selectedTask">
                已选择: {{ selectedTask.name }} - 
                {{ selectedFileInfo?.label }} 
                <span class="file-type-container">
                  <el-tag type="info" size="small" effect="plain" class="file-type-tag">
                      <el-icon><Document /></el-icon>
                      <span> 文件类型: </span>
                      <span>{{ selectedFileInfo?.fileData.fileType }}</span>
                    </el-tag>
                </span>
              </template>
            </span>
          </el-tag>
        </div>
        <!-- 右侧筛选器 -->
        <div class="filter-controls">
          <div class="task-filter">
            <el-autocomplete
              v-model="taskSearchKeyword"
              :fetch-suggestions="fetchTaskSuggestions"
              placeholder="搜索任务"
              clearable
              :prefix-icon="Search"
              class="w-64"
              :loading="taskLoading"
              :trigger-on-focus="true"
              @select="handleTaskSelectFromSuggestion"
              @clear="handleClearTaskSearch"
              @focus="handleTaskSearchFocus"
            >
              <template #default="{ item }">
                <div class="task-suggestion-item">
                  <div class="task-name">{{ item.task.name }}</div>
                  <div class="task-meta">
                    <el-tag size="small" :type="getPlatformTagType(item.task.platform)">
                      {{ getPlatformDisplay(item.task.platform) }}
                    </el-tag>
                    <el-tag size="small" :type="getStatusTagType(item.task.status)" class="ml-2">
                      {{ getStatusDisplay(item.task.status) }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-autocomplete>
          </div>
          <div class="file-filter ml-4">
            <el-select
              v-model="selectedFile"
              filterable
              remote
              placeholder="选择任务文件"
              :remote-method="searchFiles"
              :loading="fileSearchLoading"
              class="w-64"
              :disabled="!selectedTask"
              @focus="loadTaskFiles"
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
              <el-option
                v-for="item in fileOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <div class="file-option">
                  <span>{{ item.label }}</span>
                  <span class="file-option-meta">
                    {{ (item.fileData.fileSize || 0) / 1024 | 0 }} KB · {{ item.fileData.fileType }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>
      </div>

      <!-- 数据分析结果区域，当有数据时显示 -->
      <div v-if="taskData">
        <!-- 页签区域 -->
        <div class="tab-container" ref="tabContainer">
          <el-tabs v-model="activeTab" @tab-click="handleTabClick" type="card">
            <el-tab-pane name="list" label="数据列表"></el-tab-pane>
            <el-tab-pane name="chart" label="图表分析"></el-tab-pane>
            <el-tab-pane name="source" label="源数据"></el-tab-pane>
          </el-tabs>
        </div>

        <!-- 内容展示区域 -->
        <div class="content-container">
          <component 
            :is="currentComponent" 
            :data="currentData" 
            @pageChange="handlePageChange"
          />
        </div>
      </div>

      <!-- 需要任务和文件但没有数据时显示的提示 -->
      <div v-else class="no-selection-tip">
        <el-empty description="尚未加载数据">
          <template #description>
            <p>已选择任务和文件，但尚未加载数据</p>
          </template>
          <el-button type="primary" @click="loadDataAfterSelection">加载数据</el-button>
        </el-empty>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import DataList from '#/views/datavision/components/DataList.vue'
import DataChart from '#/views/datavision/components/DataChart.vue'
import DataSource from '#/views/datavision/components/DataSource.vue'
import { Search, Select, Document, Refresh, Download } from '@element-plus/icons-vue'
import { taskListApi, taskDetailApi } from '#/api/task/task'
import type { Task, TaskTag, TaskFile, TaskListReq } from '#/types/task'
import { 
  getPlatformDisplay, 
  getStatusDisplay,
  getPlatformTagType,
  getStatusTagType
} from '#/types/task'
import { fileInfoEsListApi } from '#/api/es/es_file'
import type { FileInfoEs, FileInfoEsListReq } from '#/types/es'
import { ElLoading, ElMessage } from 'element-plus'

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
  ElMessageBox,
  ElPopconfirm,
  ElTabPane,
  ElTabs,
  ElInputNumber,
  ElDialog,
  ElAutocomplete,
  ElAlert,
  ElEmpty
} from "element-plus";

// 其他接口定义
interface FileOption {
  value: string;
  label: string;
  fileData: TaskFile;
}

// 定义任务数据对象类型
interface TaskDataType {
  taskId: string;
  taskInfo: Task;
  fileInfo?: any;
  files: any[];
  data: any[];
  total?: number;
  selectedFileId: string;
}

// 筛选相关
const taskSearchKeyword = ref('')
const selectedTask = ref<Task | null>(null)
const selectedFile = ref('')
const fileSearchLoading = ref(false)
const fileOptions = ref<FileOption[]>([])
const taskLoading = ref(false)
const taskOptions = ref<Task[]>([])

// 页签相关
const activeTab = ref<'list' | 'chart' | 'source'>('list')
const tabContainer = ref<HTMLElement | null>(null)

// 数据相关
const taskData = ref<TaskDataType | null>(null)

// 图表相关
const activeChartTab = ref('value')

// 计算属性
const currentComponent = computed(() => {
  const componentMap = {
    list: DataList,
    chart: DataChart,
    source: DataSource
  }
  return componentMap[activeTab.value as keyof typeof componentMap]
})

// 获取选定文件的信息
const selectedFileInfo = computed(() => {
  if (!selectedFile.value) return null
  return fileOptions.value.find(f => f.value === selectedFile.value)
})

const currentData = computed(() => {
  // 确保不传递null值给组件
  if (!taskData.value) {
    // 返回一个带有空data数组的对象，以匹配DataList等组件期望的结构
    return { data: [] }
  }
  return taskData.value
})

// 搜索任务的suggestion方法
const fetchTaskSuggestions = (query: string, cb: (data: any[]) => void) => {
  // 先清空之前的加载状态和结果
  taskLoading.value = true
  
  // 执行搜索，这是一个异步操作
  searchTasks(query).then(() => {
    // 搜索完成后，使用最新结果更新建议
    const suggestions = taskOptions.value.map(task => ({
      value: task.name || '未命名任务',
      task
    }))
    
    cb(suggestions)
  }).catch(error => {
    console.error('获取任务建议失败:', error)
    cb([]) // 出错时返回空数组
  }).finally(() => {
    taskLoading.value = false
  })
}

// 处理选择任务建议
const handleTaskSelectFromSuggestion = (item: any) => {
  if (item && item.task) {
    console.log('选择了任务:', item.task)
    handleTaskSelect(item.task)
  }
}

// 搜索任务
const searchTasks = async (query: string = '') => {
  try {
    const params: TaskListReq = { 
      status: 3,  // 只搜索已完成的任务
      sortFields: ['updatedAt desc']  // 按更新时间倒序排列
    }
    
    // 如果有查询关键词，添加到查询参数
    if (query && query.trim()) {
      params.name = query.trim()
      console.log('搜索任务:', query)
    } else {
      console.log('加载默认任务列表')
    }
    
    const res = await taskListApi(params, 0, 10)
    taskOptions.value = res.list || []
    console.log('搜索结果:', taskOptions.value.length, '条记录')
    
    return res.list // 返回结果以便链式处理
  } catch (error) {
    console.error('搜索任务失败:', error)
    ElMessage.error('搜索任务失败')
    taskOptions.value = []
    throw error // 重新抛出错误以便调用方捕获
  }
}

// 选择任务后获取任务详情和文件
const handleTaskSelect = async (task: Task) => {
  if (!task || !task.uuid) return
  
  console.log('开始获取任务详情:', task.uuid)
  
  try {
    const loading = ElLoading.service({
      lock: true,
      text: '加载任务文件...',
      background: 'rgba(255, 255, 255, 0.7)',
    })
    
    // 将selectedTask提前设置，以解除文件选择框的禁用状态
    selectedTask.value = task
    
    const response = await taskDetailApi(task.uuid)
    console.log('获取到任务详情:', response)
    
    // 根据API返回结构处理任务详情
    if (response.task) {
      // 标准格式：{ task: Task }
      selectedTask.value = response.task
    } else if ('id' in response && 'uuid' in response) {
      // 替代格式：直接返回Task对象
      selectedTask.value = response as unknown as Task
    } else {
      console.error('API返回的任务详情格式异常:', response)
      ElMessage.error('任务详情数据格式异常')
    }
    
    // 确保selectedTask在进一步处理前已经设置
    if (!selectedTask.value) {
      loading.close()
      return
    }
    
    // 更新文件选项
    if (selectedTask.value.taskFiles && selectedTask.value.taskFiles.length > 0) {
      console.log('任务文件数量:', selectedTask.value.taskFiles.length)
      fileOptions.value = selectedTask.value.taskFiles.map((file: TaskFile) => ({
        value: String(file.fileId),
        label: file.fileName || `未命名文件 (${file.fileType})`,
        fileData: file
      }))
      console.log('文件选项已更新:', fileOptions.value)
    } else {
      console.log('没有找到任务文件')
      fileOptions.value = []
      ElMessage.warning('该任务没有可分析的文件')
    }
    
    loading.close()
  } catch (error) {
    console.error('获取任务详情失败:', error)
    ElMessage.error('获取任务详情失败')
    fileOptions.value = []
  }
}

// 搜索文件的方法 - 从已选任务的文件中过滤
const searchFiles = (query: string) => {
  if (!selectedTask.value || !selectedTask.value.taskFiles) {
    fileOptions.value = []
    return
  }
  
  fileSearchLoading.value = true
  
  // 从任务文件中过滤
  setTimeout(() => {
    if (!selectedTask.value || !selectedTask.value.taskFiles) return
    
    const files = selectedTask.value.taskFiles
    if (query) {
      fileOptions.value = files
        .filter((file: TaskFile) => file.fileName?.toLowerCase().includes(query.toLowerCase()))
        .map((file: TaskFile) => ({
          value: String(file.fileId),
          label: file.fileName || `未命名文件 (${file.fileType})`,
          fileData: file
        }))
    } else {
      fileOptions.value = files.map((file: TaskFile) => ({
        value: String(file.fileId),
        label: file.fileName || `未命名文件 (${file.fileType})`,
        fileData: file
      }))
    }
    fileSearchLoading.value = false
  }, 300)
}

// 页签切换处理
const handleTabClick = () => {
  // 可能需要重新加载或处理数据
  console.log('切换到:', activeTab.value)
}

// 加载任务数据的函数
const fetchTaskData = async () => {
  if (!selectedTask.value || !selectedFile.value || !selectedFileInfo.value) {
    ElMessage.warning('请先选择任务和文件')
    return
  }
  
  const loading = ElLoading.service({
    lock: true,
    text: '加载数据中...',
    background: 'rgba(255, 255, 255, 0.7)',
  })
  
  try {
    // 构建请求参数
    const requestParams: FileInfoEsListReq = {
      taskId: selectedTask.value.uuid,
      fileId: selectedFile.value,
      fileUuid: selectedFileInfo.value.fileData.fileUuid?.toString(),
      sortFields: ['timestamp desc'], // 默认按时间戳降序排序
      offset: 0,
      length: 20 // 初始加载20条数据
    }
    
    console.log('开始请求ES数据:', requestParams)
    
    // 调用API获取数据
    const response = await fileInfoEsListApi(requestParams, requestParams.offset, requestParams.length)
    
    console.log('ES数据获取成功:', response)
    console.log('服务器返回的total值:', response.total, '类型:', typeof response.total)
    
    // 正确处理total值，即使是0
    const totalRecords = typeof response.total === 'number' ? response.total : (response.list?.length || 0);
    
    // 更新数据 - 处理新的API响应格式
    taskData.value = {
      taskId: selectedTask.value.uuid,
      taskInfo: selectedTask.value,
      fileInfo: {
        fileType: selectedFileInfo.value.fileData.fileType,
        fileName: selectedFileInfo.value.fileData.fileName,
        fileId: selectedFile.value,
        fileUuid: selectedFileInfo.value.fileData.fileUuid?.toString()
      },
      files: selectedTask.value.taskFiles || [],
      data: response.list || [], // 使用list字段，这个在fileInfoEsListApi中已处理转换
      total: totalRecords, // 使用正确处理过的total值
      selectedFileId: selectedFile.value
    }
    
    // 设置默认页签
    activeTab.value = 'list'
    
    console.log('更新后的taskData:', { 
      dataLength: taskData.value.data.length, 
      total: taskData.value.total 
    });
    
    ElMessage.success(`成功加载 ${response.list?.length || 0} 条数据, 总计 ${totalRecords} 条`)
  } catch (error) {
    console.error('加载ES数据失败:', error)
    ElMessage.error('加载数据失败，请重试')
    // 确保taskData初始为null
    taskData.value = null
  } finally {
    loading.close()
  }
}

// 处理选择完成后的逻辑
const handleSelectionComplete = () => {
  if (!selectedTask.value || !selectedFile.value) {
    ElMessage.warning('请先选择任务和文件')
    return
  }
  
  // 调用加载数据函数
  fetchTaskData()
}

// 加载选定文件的数据
const loadDataAfterSelection = async () => {
  if (!selectedTask.value || !selectedFile.value) {
    ElMessage.warning('请先选择任务和文件')
    return
  }
  
  // 调用fetchTaskData加载数据
  fetchTaskData()
}

// 监听选定文件的变化，自动加载数据
watch(() => selectedFile.value, (newFileId, oldFileId) => {
  if (newFileId && selectedTask.value) {
    console.log('文件切换: 从', oldFileId, '到', newFileId);
    
    // 重置DataList组件的分页状态 - 需要先清空数据，然后重新加载
    if (taskData.value) {
      console.log('清空现有数据，以便重置分页状态');
      // 保存当前任务和文件信息，但清空数据列表
      taskData.value = {
        ...taskData.value,
        data: [], // 清空数据列表
        selectedFileId: newFileId
      };
    }
    
    // 自动加载数据
    loadDataAfterSelection();
  }
});

// 生成模拟数据的函数 - 仅用于测试
const generateMockData = (count: number) => {
  const result = []
  for (let i = 0; i < count; i++) {
    result.push({
      id: `packet-${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      sourceFormat: 'pcap',
      sourceIP: `192.168.1.${i % 254 + 1}`,
      destinationIP: `10.0.0.${i % 254 + 1}`,
      transportProtocol: i % 2 === 0 ? 'TCP' : 'UDP',
      sourcePort: 1000 + i,
      destinationPort: 80 + (i % 20),
      packetLength: 100 + (i * 10),
      applicationProtocol: i % 3 === 0 ? 'HTTP' : (i % 3 === 1 ? 'DNS' : 'TLS')
    })
  }
  return result
}

// 添加数据加载状态变量
const dataLoading = ref(false)

// 监听图表标签页变化
watch(activeChartTab, (newVal) => {
  // 延迟一下，等待DOM更新
  setTimeout(() => {
    initCharts()
  }, 100)
})

// 监听数据变化
watch(() => taskData.value?.data, (newVal) => {
  if (newVal && newVal.length > 0) {
    // 延迟一下，等待DOM更新
    setTimeout(() => {
      initCharts()
    }, 100)
  }
}, { deep: true })

// 生命周期钩子
onMounted(() => {
  initStoredSelection()
  searchTasks()
})

// 在文件选择框获取焦点时重新加载文件
const loadTaskFiles = () => {
  if (selectedTask.value && selectedTask.value.taskFiles) {
    console.log('重新加载文件列表')
    fileOptions.value = selectedTask.value.taskFiles.map((file: TaskFile) => ({
      value: String(file.fileId),
      label: file.fileName || `未命名文件 (${file.fileType})`,
      fileData: file
    }))
  }
}

// 检查初始时是否有存储的任务选择
const initStoredSelection = () => {
  try {
    const storedTaskId = localStorage.getItem('lastSelectedTaskId')
    const storedFileId = localStorage.getItem('lastSelectedFileId')
    
    if (storedTaskId) {
      console.log('找到存储的选择:', { taskId: storedTaskId, fileId: storedFileId })
      // 这里可以添加加载存储的任务和文件的逻辑
    } else {
      // 初始化空的任务数据对象
      taskData.value = null
    }
  } catch (error) {
    console.error('恢复存储的选择失败:', error)
    taskData.value = null
  }
}

// 保存用户选择到本地存储
const saveUserSelection = () => {
  if (taskData.value?.taskId) {
    localStorage.setItem('lastSelectedTaskId', taskData.value.taskId)
    if (taskData.value.selectedFileId) {
      localStorage.setItem('lastSelectedFileId', taskData.value.selectedFileId)
    }
  }
}

// 获取表格列
const getTableColumns = () => {
  if (!taskData.value?.data?.length) return []
  
  // 从第一条数据推断列
  const firstItem = taskData.value.data[0]
  return Object.keys(firstItem).map(key => ({
    prop: key,
    label: formatColumnName(key),
    sortable: true,
    width: key === 'id' ? '80px' : ''
  }))
}

// 格式化列名
const formatColumnName = (name: string) => {
  // 将camelCase或snake_case转换为更友好的显示名称
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

// 导出数据
const exportData = () => {
  if (!taskData.value?.data?.length) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  try {
    // 创建CSV内容
    const columns = getTableColumns()
    const headers = columns.map(col => col.label).join(',')
    const rows = taskData.value.data.map(item => {
      return columns.map(col => item[col.prop]).join(',')
    }).join('\n')
    
    const csvContent = `${headers}\n${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${selectedTask.value?.name || 'data'}_export.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败')
  }
}

// 获取指标数据
const getMetrics = () => {
  if (!taskData.value?.data?.length) return []
  
  const data = taskData.value.data
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0)
  const avgValue = Math.round(totalValue / data.length)
  
  return [
    {
      title: '数据总量',
      value: data.length,
      trend: 0 // 这里可以添加环比计算
    },
    {
      title: '总值',
      value: totalValue,
      trend: 5.2
    },
    {
      title: '平均值',
      value: avgValue,
      trend: -2.1
    },
    {
      title: '最大值',
      value: Math.max(...data.map(item => item.value || 0)),
      trend: 12.5
    }
  ]
}

// 初始化图表
const initCharts = () => {
  if (!taskData.value?.data?.length) return
  
  // 这里应该使用实际的图表库，例如ECharts
  // 由于是模拟实现，这里只添加注释
  console.log('初始化图表:', activeChartTab.value)
  
  // 根据当前活动的图表标签页初始化不同的图表
  switch (activeChartTab.value) {
    case 'value':
      console.log('渲染数值分布图表')
      // renderValueChart()
      break
    case 'category':
      console.log('渲染类别分析图表')
      // renderCategoryChart()
      break
    case 'trend':
      console.log('渲染时间趋势图表')
      // renderTrendChart()
      break
  }
}

// 处理清除任务搜索
const handleClearTaskSearch = () => {
  console.log('清除任务搜索')
  // 清除已选任务和文件
  selectedTask.value = null
  selectedFile.value = ''
  fileOptions.value = []
  // 加载默认任务列表
  searchTasks()
}

// 处理任务搜索框获取焦点
const handleTaskSearchFocus = () => {
  // 只有当列表为空时才加载默认列表
  if (!taskOptions.value.length) {
    console.log('搜索框获得焦点，加载默认列表')
    searchTasks()
  }
}

// 添加处理分页变化的方法
const handlePageChange = async (pageInfo: { offset: number, length: number, page: number, size: number }) => {
  if (!selectedTask.value || !selectedFile.value || !selectedFileInfo.value) return
  
  console.log('接收到分页变更:', pageInfo)
  
  // 添加一个简单的防抖标记，避免短时间内重复请求
  const requestId = Date.now().toString()
  console.log(`分页请求开始: ID=${requestId}, 页码=${pageInfo.page}, 每页条数=${pageInfo.size}`)
  
  const loading = ElLoading.service({
    lock: true,
    text: '加载数据中...',
    background: 'rgba(255, 255, 255, 0.7)',
  })
  
  try {
    // 构建请求参数
    const requestParams: FileInfoEsListReq = {
      taskId: selectedTask.value.uuid,
      fileId: selectedFile.value,
      fileUuid: selectedFileInfo.value.fileData.fileUuid?.toString(),
      sortFields: ['timestamp desc'],
      offset: pageInfo.offset,
      length: pageInfo.length
    }
    
    console.log(`[请求 ${requestId}] 发送ES查询请求:`, requestParams)
    
    // 调用API获取新页数据
    const response = await fileInfoEsListApi(requestParams, requestParams.offset, requestParams.length)
    
    console.log(`[请求 ${requestId}] ES分页数据响应:`, response)
    console.log(`[请求 ${requestId}] 服务器返回的total值类型:`, typeof response.total, '值:', response.total)
    
    // 如果taskData不存在，则初始化
    if (!taskData.value) {
      taskData.value = {
        taskId: selectedTask.value.uuid,
        taskInfo: selectedTask.value,
        fileInfo: {
          fileType: selectedFileInfo.value.fileData.fileType,
          fileName: selectedFileInfo.value.fileData.fileName,
          fileId: selectedFile.value,
          fileUuid: selectedFileInfo.value.fileData.fileUuid?.toString()
        },
        files: selectedTask.value.taskFiles || [],
        data: [],
        selectedFileId: selectedFile.value,
        total: 0
      }
    }
    
    // 更新数据
    taskData.value.data = response.list || []
    
    // 明确记录total变更
    const oldTotal = taskData.value.total || 0;
    
    // 关键修改: 确保即使response.total为0也正确设置到taskData.total
    if (typeof response.total === 'number') {
      // 直接使用response.total，即使它是0
      taskData.value.total = response.total;
    } else if (response.total === undefined) {
      // 如果没有total字段，使用返回的数据长度
      taskData.value.total = response.list?.length || 0;
    }
    
    console.log(`[请求 ${requestId}] 分页数据加载成功:`, {
      listLength: response.list?.length || 0,
      oldTotal,
      newTotal: taskData.value.total,
      responseTotal: response.total,
      responseType: typeof response.total
    })
    
  } catch (error) {
    console.error(`[请求 ${requestId}] 分页加载数据失败:`, error)
    ElMessage.error('加载数据失败，请重试')
  } finally {
    loading.close()
    console.log(`[请求 ${requestId}] 请求结束`)
  }
}
</script>

<style scoped>
.data-vision-container {
  padding: 20px;
  width: 100%;
  height: 100%;
  position: relative;
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-controls {
  display: flex;
  align-items: center;
}

.selected-info {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
}

.selected-info .el-tag {
  height: auto;
  padding: 8px 12px;
  line-height: 1.5;
}

.ml-1 {
  margin-left: 0.25rem;
}

.task-filter {
  width: 300px;
}

.file-filter {
  width: 350px;
}

.tab-container {
  margin-bottom: 20px;
  border: 2px solid var(--el-color-primary-light-5);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.content-container {
  /* min-height: 800px;
  max-height: calc(100vh - 150px); */
  border-radius: 4px;
  padding: 0;
  overflow: auto;
}

/* Tabs 样式 */
:deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
  background-color: var(--el-bg-color);
  border-radius: 0;
  border-bottom: 1px solid var(--el-border-color);
}

:deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  transition: color 0.3s, background-color 0.3s; /* 只保留颜色过渡动画 */
  position: relative;
  height: 50px;
  line-height: 50px;
  border-right: 1px solid var(--el-border-color);
  margin-top: 0;
  padding: 0 20px;
}

:deep(.el-tabs__item:hover) {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

/* 移除这个选择器，不再改变其他标签尺寸 */
/* :deep(.el-tabs__item:hover ~ .el-tabs__item),
:deep(.el-tabs__item:not(:hover)) {
  flex: 0.9;
} */

:deep(.el-tabs__item:last-child) {
  border-right: none;
}

:deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  background-color: #fff;
  border-bottom: 3px solid var(--el-color-primary); /* 增加底部边框厚度 */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05); /* 添加轻微阴影突出活动标签 */
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs--card>.el-tabs__header) {
  margin: 0;
  border: none;
}

:deep(.el-tabs--card>.el-tabs__header .el-tabs__nav) {
  border: none;
}

:deep(.el-tabs--card>.el-tabs__header .el-tabs__item) {
  border: none;
  position: relative;
}

/* 为每个tab添加右侧边框效果 */
:deep(.el-tabs--card>.el-tabs__header .el-tabs__item:not(:last-child)::after) {
  content: '';
  position: absolute;
  right: 0;
  top: 15%;
  height: 70%;
  width: 1px;
  background-color: var(--el-border-color);
}

:deep(.w-64) {
  width: 16rem;
}

:deep(.w-48) {
  width: 20rem;
}

/* 覆盖层样式 */
.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.selection-card {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 2rem;
  width: 450px;
  max-width: 90%;
}

.card-title {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--el-color-primary);
  text-align: center;
}

.card-subtitle {
  font-size: 0.95rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 1.5rem;
  text-align: center;
}

.selection-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-item label {
  font-size: 0.9rem;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.input-full-width {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.task-suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.task-name {
  font-weight: 500;
}

.task-meta {
  display: flex;
  gap: 5px;
}

.file-option {
  display: flex;
  flex-direction: column;
}

.file-option-meta {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.ml-2 {
  margin-left: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.selection-complete-tip {
  margin-bottom: 20px;
}

.selection-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.selection-action {
  margin-left: 10px;
}

.data-analysis-results {
  margin-bottom: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.results-controls {
  display: flex;
  gap: 10px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.loading-text {
  margin-top: 10px;
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
}

.data-table-container {
  margin-top: 20px;
}

.no-data-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
}

.metric-cards {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.metric-card {
  flex: 1;
  padding: 10px;
  background-color: var(--el-bg-color);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.metric-title {
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 5px;
}

.metric-value {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--el-color-primary);
}

.metric-trend {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.trend-up {
  color: var(--el-color-success);
}

.trend-down {
  color: var(--el-color-error);
}

.chart-container {
  margin-bottom: 20px;
}

.chart-tabs {
  margin-bottom: 20px;
}

.chart-wrapper {
  height: 300px;
}

.chart {
  height: 100%;
}

.ml-4 {
  margin-left: 1rem;
}

.no-selection-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  min-height: 300px;
}

.selected-info .file-type {
  opacity: 0.8;
  font-size: 0.9em;
  color: var(--el-color-white);
  font-style: italic;
}

.file-type-container {
  margin-left: 8px;
  display: inline-block;
  vertical-align: middle;
}

.file-type-tag {
  font-weight: 500;
  border-radius: 4px;
  cursor: help;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-type-tag:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
</style>
