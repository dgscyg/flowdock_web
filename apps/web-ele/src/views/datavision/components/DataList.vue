<template>
  <div class="data-list-container" :class="{ 'har-type': fileType === 'har', 'other-type': fileType !== 'har' }">
    <div class="data-list-header">
      <div class="header-title">
        <h3 class="text-xl font-medium">数据列表详情</h3>
        <span class="data-count">共 {{ totalRecords }} 条数据</span>
      </div>
      <div class="header-actions">
        <el-tooltip content="打开列选择" placement="top">
          <el-button size="small" @click="columnSelectorVisible = true" icon="Setting">选择显示字段</el-button>
        </el-tooltip>
        <el-tooltip content="重置列配置" placement="top">
          <el-button size="small" @click="resetColumns" icon="Refresh">重置列配置</el-button>
        </el-tooltip>
      </div>
    </div>

    <div class="table-help-tip">
      <el-alert
        title="提示: 您可以右键点击表头或点击'选择显示字段'按钮来自定义显示的列。双击记录或点击'查看详情'可查看完整信息。"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <div class="table-container">
      <el-table
        :data="filteredData"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
        :max-height="tableMaxHeight"
        class="custom-table dynamic-row-height"
        @header-contextmenu="handleHeaderContextMenu"
        :row-style="{ height: rowHeight + 'px' }"
        :header-row-style="{ height: '50px' }"
        @row-dblclick="handleRowDoubleClick"
      >
        <!-- 动态生成表格列 - 修复为使用渲染函数的方式 -->
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="100 / visibleColumns.length + '%'"
          sortable
        >
          <template #default="{ row }">
            <span :class="getValueClass(row[column.prop])">
              {{ formatCellValue(row[column.prop], column.prop) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button
                type="primary"
                link
                size="small"
                @click="viewDetail(scope.row)"
              >
                查看详情
              </el-button>
              <el-button
                type="primary"
                link
                size="small"
                @click="showRelatedData(scope.row)"
              >
                关联数据
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页调试信息 -->
    <div class="debug-info" v-if="false">
      <h3>分页调试信息</h3>
      <pre>
        当前页: {{ currentPage }}
        每页记录数: {{ pageSize }}
        总记录数: {{ totalRecords }}
        offset: {{ (currentPage - 1) * pageSize }}
        length: {{ pageSize }}
      </pre>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalRecords"
        layout="total, sizes, prev, pager, next, jumper"
        @update:current-page="handlePaginationChange"
        @update:page-size="handlePaginationChange"
      >
      </el-pagination>
    </div>

    <!-- 详情悬浮面板 -->
    <div class="detail-panel-overlay" v-if="detailPanelVisible" @click.self="closeDetailPanel">
      <div class="detail-panel" :class="{ 'detail-panel-visible': detailPanelVisible }">
        <div class="detail-panel-header">
          <div class="panel-header-title">
            <span>记录详情</span>
            <span v-if="selectedItem" class="record-id">ID: {{ selectedItem.captureIndex }}</span>
          </div>
          <el-button
            link
            icon="Close"
            class="close-button"
            @click="closeDetailPanel"
          />
        </div>
        
        <div v-if="selectedItem" class="detail-panel-content">
          <el-tabs tab-position="left" class="detail-tabs">
            <el-tab-pane label="基本信息">
              <el-descriptions border :column="1" size="small" class="detail-description">
                <template v-for="column in getMainColumns()" :key="column.prop">
                  <el-descriptions-item :label="column.label">
                    <div :class="['detail-value', getValueClass(selectedItem[column.prop])]">
                      {{ formatCellValue(selectedItem[column.prop], column.prop) }}
                    </div>
                  </el-descriptions-item>
                </template>
              </el-descriptions>
            </el-tab-pane>
            
            <el-tab-pane label="请求头部" v-if="selectedItem.requestHeaders && selectedItem.requestHeaders.length">
              <el-table :data="selectedItem.requestHeaders" border size="small" stripe>
                <el-table-column prop="name" label="名称" min-width="30%"></el-table-column>
                <el-table-column prop="value" label="值" min-width="70%"></el-table-column>
              </el-table>
            </el-tab-pane>
            
            <el-tab-pane label="响应头部" v-if="selectedItem.responseHeaders && selectedItem.responseHeaders.length">
              <el-table :data="selectedItem.responseHeaders" border size="small" stripe>
                <el-table-column prop="name" label="名称" min-width="30%"></el-table-column>
                <el-table-column prop="value" label="值" min-width="70%"></el-table-column>
              </el-table>
            </el-tab-pane>
            
            <el-tab-pane label="负载摘要" v-if="selectedItem.payloadSummary">
              <div class="payload-content">
                <pre v-if="isHexFormat(selectedItem.payloadSummary)" class="hex-payload">{{ formatHexPayload(selectedItem.payloadSummary) }}</pre>
                <pre v-else>{{ selectedItem.payloadSummary }}</pre>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <!-- 列选择弹出菜单 -->
    <el-dialog
      title="选择显示字段"
      v-model="columnSelectorVisible"
      width="500px"
    >
      <div class="column-selector-info">
        <p>当前文件类型: <strong>{{ fileType || '未知' }}</strong></p>
        <p>可用字段总数: <strong>{{ availableColumns.length }}</strong></p>
      </div>
      
      <el-checkbox
        v-model="selectAllColumns"
        :indeterminate="isIndeterminate"
        @change="handleCheckAllColumnsChange"
      >
        全选
      </el-checkbox>
      <div class="column-checkbox-group">
        <el-checkbox
          v-for="column in availableColumns"
          :key="column.prop"
          v-model="column.visible"
          @change="handleColumnVisibilityChange"
        >
          {{ column.label }}
        </el-checkbox>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="columnSelectorVisible = false">取消</el-button>
          <el-button type="danger" @click="resetColumns">重置全部</el-button>
          <el-button type="primary" @click="saveColumnSettings">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick, shallowRef } from 'vue'
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
  ElCheckbox,
  ElAlert,
} from "element-plus";

// 接口定义
interface TableColumn {
  prop: string;
  label: string;
  width?: string;
  visible?: boolean;
}

interface DataItem {
  [key: string]: any;
  id?: string | number;
}

interface ComponentData {
  data?: DataItem[];
  fileInfo?: {
    fileType?: string;
    [key: string]: any;
  };
  total?: number;
  [key: string]: any;
}

// 定义props
const props = defineProps({
  data: {
    type: Object as () => ComponentData,
    default: () => ({})
  }
})

// 定义emit
const emit = defineEmits(['update:currentPage', 'update:pageSize', 'pageChange'])

// 数据
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const tableMaxHeight = ref(950)
const selectedItem = ref<DataItem | null>(null)
const columnSelectorVisible = ref(false)
const selectAllColumns = ref(false)
const isIndeterminate = ref(false)
const rowHeight = ref(90) // 添加行高设置
const detailPanelVisible = ref(false) // 详情面板可见性

// 文件类型相关
const fileType = ref('')

// 列定义
const availableColumns = ref<TableColumn[]>([])
const visibleColumns = computed(() => availableColumns.value.filter(col => col.visible !== false))

// 文件类型常量
const FILE_TYPES = {
  HAR: 'har',
  PCAP: ['pcapng', 'pcap', 'cap'] as string[]
}

// 不同文件类型的列定义
const columnsByFileType = {
  // HAR 文件的列定义
  [FILE_TYPES.HAR]: [
    { prop: 'captureIndex', label: 'ID', width: '80', visible: true },
    { prop: 'timestamp', label: '时间戳', width: '180', visible: true },
    { prop: 'hostname', label: '主机名', width: '180', visible: true },
    { prop: 'uri', label: 'URI', width: '300', visible: true },
    { prop: 'httpMethod', label: 'HTTP方法', width: '100', visible: true },
    { prop: 'httpStatusCode', label: 'HTTP状态码', width: '100', visible: true },
    { prop: 'httpVersion', label: 'HTTP版本', width: '100', visible: false },
    { prop: 'contentType', label: '内容类型', width: '150', visible: true },
    { prop: 'contentLength', label: '内容长度', width: '100', visible: true },
    { prop: 'responseTime', label: '响应时间', width: '100', visible: true },
    { prop: 'destinationIP', label: '目标IP', width: '150', visible: false },
    { prop: 'sourcePort', label: '源端口', width: '100', visible: false },
    { prop: 'destinationPort', label: '目标端口', width: '100', visible: false },
    { prop: 'flowId', label: '流ID', width: '100', visible: false },
    { prop: 'payloadSummary', label: '负载摘要', width: '200', visible: false },
    { prop: 'requestHeaders', label: '请求头部', width: '200', visible: false },
    { prop: 'responseHeaders', label: '响应头部', width: '200', visible: false }
  ],
  // PCAP 系列文件的列定义
  pcap: [
    { prop: 'captureIndex', label: 'ID', width: '80', visible: true },
    { prop: 'timestamp', label: '时间戳', width: '180', visible: true },
    { prop: 'sourceIP', label: '源IP', width: '150', visible: true },
    { prop: 'destinationIP', label: '目标IP', width: '150', visible: true },
    { prop: 'sourcePort', label: '源端口', width: '100', visible: true },
    { prop: 'destinationPort', label: '目标端口', width: '100', visible: true },
    { prop: 'networkProtocol', label: '网络协议', width: '100', visible: true },
    { prop: 'transportProtocol', label: '传输协议', width: '100', visible: true },
    { prop: 'applicationProtocol', label: '应用协议', width: '100', visible: true },
    { prop: 'packetLength', label: '包长度', width: '100', visible: true },
    { prop: 'captureLength', label: '捕获长度', width: '100', visible: false },
    { prop: 'sourceMAC', label: '源MAC', width: '150', visible: false },
    { prop: 'destinationMAC', label: '目标MAC', width: '150', visible: false },
    { prop: 'ttl', label: 'TTL', width: '80', visible: false },
    { prop: 'ipVersion', label: 'IP版本', width: '80', visible: false },
    { prop: 'flowId', label: '流ID', width: '100', visible: false },
    { prop: 'conversationId', label: '会话ID', width: '100', visible: false },
    { prop: 'tcpFlags', label: 'TCP标志', width: '120', visible: false },
    { prop: 'sequenceNumber', label: 'TCP序列号', width: '150', visible: false },
    { prop: 'acknowledgmentNum', label: 'TCP确认号', width: '150', visible: false },
    { prop: 'httpMethod', label: 'HTTP方法', width: '100', visible: false },
    { prop: 'httpStatusCode', label: 'HTTP状态码', width: '100', visible: false },
    { prop: 'hostname', label: '主机名', width: '180', visible: false },
    { prop: 'uri', label: 'URI', width: '200', visible: false },
    { prop: 'payloadSummary', label: '负载摘要', width: '200', visible: false },
    { prop: 'sourceFormat', label: '源格式', width: '120', visible: false },
    { prop: 'sourceFile', label: '源文件', width: '150', visible: false }
  ],
  // 默认列定义，当无法确定文件类型时使用
  default: [
    { prop: 'captureIndex', label: 'ID', width: '80', visible: true },
    { prop: 'timestamp', label: '时间戳', width: '180', visible: true },
    { prop: 'sourceFormat', label: '源格式', width: '120', visible: true },
    { prop: 'sourceFile', label: '源文件', width: '150', visible: true },
    { prop: 'networkProtocol', label: '网络协议', width: '100', visible: true },
    { prop: 'transportProtocol', label: '传输协议', width: '100', visible: true },
    { prop: 'applicationProtocol', label: '应用协议', width: '100', visible: true },
    { prop: 'packetLength', label: '包长度', width: '100', visible: true },
    { prop: 'payloadSummary', label: '负载摘要', width: '200', visible: true }
  ]
}

// 计算属性 - 过滤后的数据
const filteredData = computed(() => {
  if (!props.data || !props.data.data) return []
  
  let result = [...(props.data.data || [])]
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => {
      return Object.values(item).some(val => 
        val && String(val).toLowerCase().includes(keyword)
      )
    })
  }
  
  return result
})

// 计算总记录数
const totalRecords = computed(() => {
  // 正确处理total值的获取方式，确保能从不同层级获取
  if (props.data?.total !== undefined) {
    return props.data.total
  } else if (props.data?.data?.length) {
    // 如果没有total但有data，使用data长度
    return props.data.data.length
  }
  return 0
})

// 添加防抖函数
const debounce = (fn: Function, delay: number) => {
  let timer: number | null = null
  return (...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay) as unknown as number
  }
}

// 防抖版本的emitPageChange
const debouncedEmitPageChange = debounce(() => {
  emitPageChange()
}, 300)

// 方法
// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  emitPageChange()
}

// 发送分页变化事件
const emitPageChange = () => {
  // 计算offset和length
  const offset = (currentPage.value - 1) * pageSize.value
  const length = pageSize.value
  
  console.log('分页变化:', { 
    page: currentPage.value, 
    size: pageSize.value,
    offset,
    length,
    total: totalRecords.value
  })
  
  // 发送事件通知父组件
  emit('pageChange', { 
    page: currentPage.value, 
    size: pageSize.value,
    offset,
    length
  })
  
  // 同时更新v-model绑定
  emit('update:currentPage', currentPage.value)
  emit('update:pageSize', pageSize.value)
}

// 统一处理分页变化事件
const handlePaginationChange = () => {
  console.log('分页组件触发更新事件，当前页码:', currentPage.value, '每页条数:', pageSize.value)
  // 直接调用防抖后的emitPageChange
  debouncedEmitPageChange()
}

// 格式化单元格值
const formatCellValue = (value: any, prop?: string): string => {
  if (value === null || value === undefined) return '--'
  
  try {
    // 处理HTTP状态码为0的情况
    if (prop === 'httpStatusCode' && value === 0) {
      return 'Aborted'
    }
    
    // 处理数组类型
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]'
      
      // 处理KeyValuePair数组 (请求头部和响应头部)
      if (value.length > 0 && typeof value[0] === 'object' && 'name' in value[0] && 'value' in value[0]) {
        // 优化处理：显示前3个头部，并使用更易读的格式显示键值对
        if (value.length > 3) {
          const headers = value.slice(0, 3).map(item => {
            const name = item.name.padEnd(15, ' ');
            return `${name}: ${item.value}`;
          }).join('\n');
          return `${headers}\n... 共${value.length}个头部`;
        }
        return value.map(item => {
          const name = item.name.padEnd(15, ' ');
          return `${name}: ${item.value}`;
        }).join('\n');
      }
      
      // 普通数组
      return JSON.stringify(value)
    }
    
    // 处理负载摘要 (payloadSummary)，根据文件类型不同进行处理
    if (prop === 'payloadSummary' && typeof value === 'string') {
      const currentFileType = getFileType();
      
      // 对于非HAR格式的十六进制数据优化显示
      if (currentFileType !== FILE_TYPES.HAR) {
        // 检查是否为十六进制格式
        if (/^[0-9A-Fa-f\s]+$/.test(value)) {
          // 十六进制数据：截断显示，并添加省略号和长度信息
          if (value.length > 50) {
            return `${value.substring(0, 50)}... (共${Math.floor(value.length/2)}字节)`;
          }
          // 对十六进制数据进行分组显示，每两个字符一组
          const formatted = value.replace(/\s+/g, '').replace(/(.{2})/g, '$1 ').trim();
          return formatted;
        }
      }
      
      // 非十六进制或HAR格式的文本摘要：做截断处理
      if (value.length > 100) {
        return `${value.substring(0, 100)}... (共${value.length}字符)`;
      }
      
      return value;
    }
    
    // 处理对象类型
    if (typeof value === 'object') {
      // FragmentInfo对象
      if ('isFragment' in value) {
        return value.isFragment ? 
          `分片: 偏移=${value.fragmentOffset}, 更多=${value.moreFragments}` : 
          '非分片'
      }
      
      // DNS信息
      if ('questions' in value || 'answers' in value) {
        let result = '';
        if (value.questions && value.questions.length) {
          result += `问题: ${value.questions.join(', ')} `;
        }
        if (value.answers && value.answers.length) {
          result += `应答数: ${value.answers.length}`;
        }
        return result || JSON.stringify(value);
      }
      
      // ICMP信息
      if ('type' in value && 'code' in value && typeof value.type === 'number') {
        return `类型: ${value.type}, 代码: ${value.code}`
      }
      
      // DHCP信息
      if ('messageType' in value && value.clientMAC) {
        return `类型: ${value.messageType}, 客户端: ${value.clientMAC}`
      }
      
      // 通用对象
      return JSON.stringify(value)
    }
    
    // 处理数字类型 - 增加可读性
    if (typeof value === 'number') {
      // 如果是毫秒时间戳，转换为时间
      if (String(value).length === 13 && value > 1500000000000) {
        return new Date(value).toLocaleString()
      }
      
      // 如果是端口号，原样返回
      if (value >= 0 && value <= 65535) {
        return String(value)
      }
      
      // 大数字增加千位分隔符
      return value.toLocaleString()
    }
    
    // 处理布尔类型
    if (typeof value === 'boolean') {
      return value ? '是' : '否'
    }
    
    // 默认情况，转换为字符串
    return String(value)
  } catch (e) {
    console.warn('格式化值失败:', value, e)
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
}

// 获取值的样式
const getValueClass = (value: any): string => {
  if (value === null || value === undefined) return 'empty-value'
  
  // HTTP状态码着色
  if (typeof value === 'number' && String(value).length === 3) {
    if (value >= 200 && value < 300) return 'success-value' // 2xx
    if (value >= 300 && value < 400) return 'redirect-value' // 3xx
    if (value >= 400 && value < 500) return 'client-error-value' // 4xx
    if (value >= 500) return 'server-error-value' // 5xx
  }
  
  // 根据数据类型设置样式
  if (typeof value === 'number') return 'number-value'
  if (typeof value === 'boolean') return value ? 'boolean-true-value' : 'boolean-false-value'
  if (Array.isArray(value)) return 'array-value'
  if (typeof value === 'object') return 'object-value'
  
  // 特殊字符串值高亮
  if (typeof value === 'string') {
    // IP地址样式
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return 'ip-value'
    
    // HTTP方法样式
    if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(value)) {
      return `http-method-${value.toLowerCase()}`
    }
    
    // 协议样式
    if (['HTTP', 'HTTPS', 'TCP', 'UDP', 'DNS', 'ICMP', 'TLS'].includes(value)) {
      return `protocol-value`
    }
  }
  
  return ''
}

// 查看详情
const viewDetail = (row: DataItem) => {
  selectedItem.value = row
  detailPanelVisible.value = true
}

// 查看关联数据
const showRelatedData = (row: DataItem) => {
  ElMessage({
    message: `查看ID为${row.id}的关联数据`,
    type: 'info'
  })
}

// 导出数据
const exportData = () => {
  ElMessage({
    message: '数据导出功能将在后续实现',
    type: 'success'
  })
}

// 获取文件类型
const getFileType = (): string => {
  const fileInfo = props.data?.fileInfo
  const fileTypeRaw = fileInfo?.fileType?.toLowerCase() || ''
  
  console.log('原始文件类型:', fileTypeRaw)
  
  // 检查是否是 PCAP 系列文件 - 明确的数组检查和类型保护
  const pcapFileTypes = FILE_TYPES.PCAP;
  if (fileTypeRaw && Array.isArray(pcapFileTypes) && pcapFileTypes.indexOf(fileTypeRaw) >= 0) {
    return 'pcap'
  }
  
  return fileTypeRaw
}

// 检查数据模式并应用默认值
const ensureDataFields = () => {
  // 检查模拟数据的情况，应用预设字段
  if (props.data && props.data.data && props.data.data.length > 0) {
    const fileTypeCurrent = getFileType()
    
    // 使用非空断言处理类型检查
    if (fileTypeCurrent === FILE_TYPES.HAR && columnsByFileType) {
      const harColumns = columnsByFileType[FILE_TYPES.HAR as keyof typeof columnsByFileType];
      if (harColumns) {
        props.data.data.forEach(item => {
          // 确保item有所有必要字段，如果没有则添加默认值
          harColumns.forEach(col => {
            if (item[col.prop] === undefined) {
              item[col.prop] = `模拟${col.label}`
            }
          })
        })
      }
    }
    // 同样为pcap类型应用
    else if (fileTypeCurrent === 'pcap' && columnsByFileType) {
      const pcapColumns = columnsByFileType['pcap' as keyof typeof columnsByFileType];
      if (pcapColumns) {
        props.data.data.forEach(item => {
          pcapColumns.forEach(col => {
            if (item[col.prop] === undefined) {
              item[col.prop] = `模拟${col.label}`
            }
          })
        })
      }
    }
  }
}

// 初始化列配置
const initColumns = () => {
  const fileTypeCurrent = getFileType()
  fileType.value = fileTypeCurrent // 更新文件类型显示
  
  console.log('检测到文件类型:', fileTypeCurrent)
  
  // 根据文件类型选择对应的列定义
  let columns: TableColumn[] = []
  
  if (fileTypeCurrent === FILE_TYPES.HAR) {
    console.log('应用HAR文件列配置')
    columns = JSON.parse(JSON.stringify(columnsByFileType[FILE_TYPES.HAR]))
    ensureDataFields() // 确保数据有必要字段
  } else if (fileTypeCurrent === 'pcap') {
    console.log('应用PCAP文件列配置')
    columns = JSON.parse(JSON.stringify(columnsByFileType.pcap))
    ensureDataFields() // 确保数据有必要字段
  } else {
    // 如果没有匹配的文件类型或从数据动态生成列
    if (props.data && props.data.data && props.data.data.length > 0) {
      const sample = props.data.data[0]
      if (sample) {
        console.log('从数据样本生成列:', Object.keys(sample))
        columns = Object.keys(sample).map(key => {
          return {
            prop: key,
            label: formatColumnLabel(key),
            width: key === 'id' ? '80' : '',
            visible: true
          }
        })
      } else {
        console.log('使用默认列配置')
        columns = JSON.parse(JSON.stringify(columnsByFileType.default))
      }
    }
  }
  
  // 从本地存储中恢复列可见性设置（如果有）
  const savedSettings = getSavedColumnSettings(fileTypeCurrent)
  if (savedSettings) {
    console.log('应用保存的列设置')
    // 将保存的可见性设置合并到列定义中
    columns.forEach(col => {
      if (savedSettings[col.prop] !== undefined) {
        col.visible = savedSettings[col.prop]
      }
    })
  }
  
  availableColumns.value = columns
  updateSelectAllState()
  
  // 如果没有可见列，则默认显示所有列
  if (visibleColumns.value.length === 0) {
    console.log('无可见列，显示全部')
    columns.forEach(col => col.visible = true)
    updateSelectAllState()
  }
}

// 处理表头右键菜单
const handleHeaderContextMenu = (column: any, event: Event) => {
  // Element Plus的header-contextmenu事件传递的第一个参数是column，第二个是event
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault()
    event.stopPropagation() // 停止事件冒泡
  }
  console.log('表头右键菜单触发', column)
  columnSelectorVisible.value = true
}

// 处理全选/取消全选
const handleCheckAllColumnsChange = (val: boolean | string | number) => {
  const isChecked = Boolean(val)
  availableColumns.value.forEach(col => {
    col.visible = isChecked
  })
  isIndeterminate.value = false
}

// 处理单个列可见性变化
const handleColumnVisibilityChange = () => {
  updateSelectAllState()
}

// 更新全选状态
const updateSelectAllState = () => {
  const checkedCount = availableColumns.value.filter(col => col.visible).length
  selectAllColumns.value = checkedCount === availableColumns.value.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < availableColumns.value.length
}

// 重置列配置
const resetColumns = () => {
  const fileTypeCurrent = getFileType()
  
  console.log('重置列配置，文件类型:', fileTypeCurrent)

  if (fileTypeCurrent === FILE_TYPES.HAR) {
    availableColumns.value = JSON.parse(JSON.stringify(columnsByFileType[FILE_TYPES.HAR]))
  } else if (fileTypeCurrent === 'pcap') {
    availableColumns.value = JSON.parse(JSON.stringify(columnsByFileType.pcap))
  } else {
    availableColumns.value = JSON.parse(JSON.stringify(columnsByFileType.default))
  }
  
  // 移除本地存储中的设置
  removeColumnSettings(fileTypeCurrent)
  
  updateSelectAllState()
  
  ElMessage({
    message: '已重置列配置',
    type: 'success'
  })
}

// 保存列设置
const saveColumnSettings = () => {
  const fileTypeCurrent = getFileType()
  const settings: Record<string, boolean> = {}
  
  availableColumns.value.forEach(col => {
    settings[col.prop] = !!col.visible
  })
  
  localStorage.setItem(`datalist_columns_${fileTypeCurrent}`, JSON.stringify(settings))
  columnSelectorVisible.value = false
  
  ElMessage({
    message: '列配置已保存',
    type: 'success'
  })
}

// 获取保存的列设置
const getSavedColumnSettings = (fileTypeCurrent: string): Record<string, boolean> | null => {
  const saved = localStorage.getItem(`datalist_columns_${fileTypeCurrent}`)
  return saved ? JSON.parse(saved) : null
}

// 移除列设置
const removeColumnSettings = (fileTypeCurrent: string) => {
  localStorage.removeItem(`datalist_columns_${fileTypeCurrent}`)
}

// 动态生成表格列
const generateColumns = () => {
  console.log('生成表格列，数据:', props.data)
  // 初始化列配置
  initColumns()
}

const formatColumnLabel = (key: string): string => {
  // 将key转换为更友好的标签名
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
}

// 监听props.data变化
watch(() => props.data, (newData) => {
  console.log('接收到父组件传入的新数据，数据长度:', newData?.data?.length || 0)
  // 恢复必要的功能
  console.log('数据变化，文件类型:', newData?.fileInfo?.fileType)
  generateColumns()
  
  // 数据变化时重新绑定表头右键菜单
  bindHeaderContextMenu()
  // 只记录数据变化，不主动请求新数据
}, { deep: true })

// 监听文件类型变化
watch(() => props.data?.fileInfo?.fileType, (newType) => {
  console.log('文件类型变化:', newType)
  if (newType) {
    // 文件类型变化时重新初始化列
    initColumns()
  }
})

// 生成列
generateColumns()

// 监听窗口大小变化仅重新绑定表头右键菜单
const handleResize = () => {
  bindHeaderContextMenu()
}
window.addEventListener('resize', handleResize)

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
  // 移除resize事件监听
  window.removeEventListener('resize', handleResize)
  
  // 移除手动添加的右键菜单事件
  const headerCells = document.querySelectorAll('.el-table__header-wrapper th')
  headerCells.forEach(cell => {
    cell.removeEventListener('contextmenu', handleContextMenu)
  })
})

// 定义一个绑定右键菜单的函数，便于多处调用
const bindHeaderContextMenu = () => {
  nextTick(() => {
    const headerCells = document.querySelectorAll('.el-table__header-wrapper th')
    headerCells.forEach(cell => {
      // 移除之前可能存在的事件监听器，防止重复绑定
      cell.removeEventListener('contextmenu', handleContextMenu)
      // 添加新的事件监听器
      cell.addEventListener('contextmenu', handleContextMenu)
    })
  })
}

// 单独的事件处理函数，便于添加和移除
const handleContextMenu = (e: Event) => {
  e.preventDefault()
  console.log('手动绑定的表头右键事件触发')
  columnSelectorVisible.value = true
}

// 获取主要显示列（用于详情页面）
const getMainColumns = () => {
  // 基于当前文件类型，显示不同的列
  const fileTypeCurrent = getFileType();
  if (fileTypeCurrent === FILE_TYPES.HAR) {
    return availableColumns.value.filter(col => 
      ['captureIndex', 'timestamp', 'uri', 'hostname', 'httpMethod', 'httpStatusCode', 
       'contentType', 'contentLength', 'sourceIP', 'destinationIP', 'transportProtocol'].includes(col.prop)
    );
  } else if (fileTypeCurrent === 'pcap') {
    return availableColumns.value.filter(col => 
      ['captureIndex', 'timestamp', 'sourceIP', 'destinationIP', 'sourcePort', 'destinationPort',
       'networkProtocol', 'transportProtocol', 'applicationProtocol', 'packetLength'].includes(col.prop)
    );
  }
  
  // 默认显示所有基本列
  return availableColumns.value.filter(col => col.prop !== 'requestHeaders' && col.prop !== 'responseHeaders');
}

// 检查字符串是否为十六进制格式
const isHexFormat = (str: string): boolean => {
  return typeof str === 'string' && /^[0-9A-Fa-f\s]+$/.test(str);
}

// 格式化十六进制字符串
const formatHexPayload = (hexString: string): string => {
  // 移除所有空格
  const cleanHex = hexString.replace(/\s+/g, '');
  
  // 每16字节一行，每2个字符一组
  let result = '';
  for (let i = 0; i < cleanHex.length; i += 32) {
    const line = cleanHex.substring(i, i + 32);
    // 将每行格式化为：地址 + 十六进制数据 + ASCII表示
    const addr = (i / 2).toString(16).padStart(8, '0');
    let hexPart = '';
    let asciiPart = '';
    
    for (let j = 0; j < line.length; j += 2) {
      const byte = line.substring(j, j + 2);
      hexPart += byte + ' ';
      
      // 转换为ASCII，不可打印字符显示为点
      const charCode = parseInt(byte, 16);
      asciiPart += (charCode >= 32 && charCode <= 126) 
        ? String.fromCharCode(charCode) 
        : '.';
    }
    
    result += `${addr}  ${hexPart.padEnd(48, ' ')}  |${asciiPart}|\n`;
  }
  
  return result;
}

// 双击行处理函数
const handleRowDoubleClick = (row: DataItem) => {
  selectedItem.value = row
  detailPanelVisible.value = true
}

// 关闭详情面板
const closeDetailPanel = () => {
  detailPanelVisible.value = false
}

// 初始化
onMounted(() => {
  // 移除自动请求初始化
  // setTimeout(() => {
  //   console.log('组件挂载完成，初始化分页')
  //   emitPageChange()
  // }, 0)
  console.log('DataList组件已挂载，等待父组件提供数据')
})
</script>

<style scoped>
.data-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.data-list-header {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  padding: 0 5px;
}

.header-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.header-title h3 {
  margin: 0;
  margin-right: 10px;
}

.data-count {
  color: #909399;
  font-size: 14px;
}

.file-type-badge {
  margin-left: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.table-help-tip {
  flex: 0 0 auto;
  margin-bottom: 5px;
}

.app-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.table-container {
  flex: 1;
  overflow: hidden;
}

/* 表格样式 */
.custom-table {
  width: 100%;
  box-sizing: border-box;
}

/* 添加列宽过渡效果 */
:deep(.el-table__cell) {
  transition: width 0.3s ease, min-width 0.3s ease;
}

:deep(.el-table__header) {
  transition: width 0.3s ease;
}

:deep(.el-table__body) {
  transition: width 0.3s ease;
}

.pagination-wrapper {
  flex: 0 0 auto;
  margin-top: 5px;
  padding-bottom: 0;
  display: flex;
  justify-content: flex-end;
}

/* 统一处理所有文件类型的表格样式 */
.har-type .table-container,
.other-type .table-container {
  overflow: hidden;
}

/* 确保表格内容可滚动且占据更多空间 */
:deep(.el-table__body-wrapper) {
  overflow-y: auto !important;
}

/* 动态行高表格样式 */
:deep(.dynamic-row-height .el-table__header-row) {
  height: 50px !important; /* 表头高度固定 */
}

:deep(.dynamic-row-height .el-table__cell) {
  padding: 8px 0 !important;
  vertical-align: middle !important;
}

:deep(.w-64) {
  width: 16rem;
}

:deep(.rounded-button) {
  border-radius: 0.25rem !important;
}

/* 列选择器样式 */
.column-checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 15px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}

.column-selector-info {
  margin-bottom: 10px;
  padding: 10px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.column-selector-info p {
  margin: 5px 0;
  color: var(--el-text-color-primary);
}

.column-selector-info strong {
  color: var(--el-text-color-primary);
}

/* 单元格值样式 */
.empty-value {
  color: #909399;
  font-style: italic;
}

.success-value {
  color: #67c23a;
  font-weight: 500;
}

.redirect-value {
  color: #e6a23c;
  font-weight: 500;
}

.client-error-value {
  color: #f56c6c;
  font-weight: 500;
}

.server-error-value {
  color: #ff4949;
  font-weight: 700;
}

.number-value {
  color: #0066ff;
  font-family: monospace;
}

.boolean-true-value {
  color: #67c23a;
  font-weight: 500;
}

.boolean-false-value {
  color: #f56c6c;
  font-weight: 500;
}

.array-value, .object-value {
  color: #6b7280;
  font-family: monospace;
  font-size: 0.9em;
}

.ip-value {
  color: #6b21a8;
  font-family: monospace;
}

.http-method-get {
  color: #0ea5e9;
  font-weight: 500;
}

.http-method-post {
  color: #22c55e;
  font-weight: 500;
}

.http-method-put {
  color: #eab308;
  font-weight: 500;
}

.http-method-delete {
  color: #ef4444;
  font-weight: 500;
}

.http-method-patch, .http-method-head, .http-method-options {
  color: #6366f1;
  font-weight: 500;
}

.protocol-value {
  color: #9333ea;
  font-weight: 500;
}

/* 详情面板覆盖层 */
.detail-panel-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.detail-panel {
  width: 50%;
  height: 100%;
  background-color: var(--el-bg-color);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
}

.detail-panel-visible {
  transform: translateX(0);
}

.detail-panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 500;
}

.record-id {
  font-size: 14px;
  color: var(--el-color-info);
  font-weight: normal;
}

.close-button {
  padding: 8px;
  font-size: 18px;
}

.detail-panel-content {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.detail-tabs {
  height: 100%;
}

:deep(.el-tabs--left) {
  height: 100%;
}

:deep(.el-tabs__content) {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

.detail-description {
  width: 100%;
}

/* 负载内容样式 */
.payload-content {
  max-height: 500px;
  overflow: auto;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
}

.payload-content pre {
  margin: 0;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.hex-payload {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  letter-spacing: 0.5px;
}

/* 适配暗黑模式 */
.el-dialog {
  --el-dialog-bg-color: var(--el-bg-color);
  --el-dialog-text-color: var(--el-text-color-primary);
}

:deep(.el-tabs__item) {
  color: var(--el-text-color-regular);
}

:deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
}

:deep(.el-tabs__active-bar) {
  background-color: var(--el-color-primary);
}

:deep(.el-descriptions) {
  --el-descriptions-item-bordered-label-background: var(--el-fill-color-light);
}

:deep(.el-table) {
  --el-table-border-color: var(--el-border-color);
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-row-hover-bg-color: var(--el-fill-color);
}
</style> 
