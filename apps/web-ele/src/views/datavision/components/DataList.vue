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
        class="custom-table"
        @header-contextmenu="handleHeaderContextMenu"
        :row-style="{ height: '40px' }"
        :header-row-style="{ height: '50px' }"
        @row-dblclick="handleRowDoubleClick"
        :cell-class-name="getCellClassName"
      >
        <!-- 动态生成表格列 - 使用嵌套属性渲染函数 -->
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="100 / visibleColumns.length + '%'"
          sortable
        >
          <template #default="{ row }">
            <span :class="getValueClass(row, column.prop)">
              {{ renderCell(row, column) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              @click="viewDetail(scope.row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
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

    <!-- 列选择器对话框 -->
    <el-dialog v-model="columnSelectorVisible" title="选择显示列" width="500px" class="column-selector-dialog">
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
              <el-descriptions border :column="1" size="small" class="detail-description" :style="{ width: '100%' }" :label-width="'120px'">
                <template v-for="column in getMainColumns()" :key="column.prop">
                  <el-descriptions-item :label="column.label">
                    <div :class="['detail-value', getValueClass(selectedItem, column.prop), 
                                 column.prop.includes('url') || column.prop.includes('URL') ? 'text-break' : '']">
                      {{ renderCell(selectedItem, column) }}
                    </div>
                  </el-descriptions-item>
                </template>
              </el-descriptions>
            </el-tab-pane>
            
            <!-- HAR详情标签页 -->
            <el-tab-pane label="请求详情" v-if="fileType === FILE_TYPES.HAR && selectedItem.har && selectedItem.har.request">
              <el-descriptions border :column="1" size="small" class="detail-description" :style="{ width: '100%' }" :label-width="'120px'">
                <el-descriptions-item label="方法">
                  <span :class="getValueClass(selectedItem, 'har.request.method')">
                    {{ selectedItem.har.request.method }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item label="URL">
                  <div class="url-content text-break">{{ selectedItem.har.request.url }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="HTTP版本">{{ selectedItem.har.request.httpVersion }}</el-descriptions-item>
                
                <!-- 请求头 - 优化为固定高度可滚动 -->
                <el-descriptions-item label="请求头" v-if="selectedItem.har.request.headers?.length">
                  <div class="headers-container">
                    <el-table :data="selectedItem.har.request.headers" border size="small" stripe>
                      <el-table-column prop="name" label="名称" min-width="30%"></el-table-column>
                      <el-table-column prop="value" label="值" min-width="70%" show-overflow-tooltip>
                        <template #default="scope">
                          <div class="text-break">{{ scope.row.value }}</div>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-descriptions-item>
                
                <!-- 请求体 -->
                <el-descriptions-item label="请求体" v-if="selectedItem.har.request.postData?.text">
                  <div class="body-container">
                    <el-tabs class="fixed-width-tabs">
                      <el-tab-pane label="格式化数据">
                        <div class="formatted-body">
                          <!-- 对于图片类型使用原来的格式化函数 -->
                          <template v-if="isImageContent(selectedItem.har.request.postData.mimeType || 'text/plain')">
                            <div v-html="formatBodyContent(selectedItem.har.request.postData.text, selectedItem.har.request.postData.mimeType || 'text/plain')"></div>
                          </template>
                          <!-- 其他类型使用highlight组件 -->
                          <template v-else>
                            <highlightjs 
                              :language="getHighlightLanguage(selectedItem.har.request.postData.mimeType || 'text/plain')"
                              :code="getFormattedCode(selectedItem.har.request.postData.text, selectedItem.har.request.postData.mimeType || 'text/plain')"
                              :autodetect="!getHighlightLanguage(selectedItem.har.request.postData.mimeType || 'text/plain')"
                            />
                          </template>
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="原始数据">
                        <div class="request-body-wrapper">
                          <pre class="request-body">{{ selectedItem.har.request.postData.text }}</pre>
                        </div>
                      </el-tab-pane>
                    </el-tabs>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            
            <!-- 响应详情标签页 -->
            <el-tab-pane label="响应详情" v-if="fileType === FILE_TYPES.HAR && selectedItem.har && selectedItem.har.response">
              <el-descriptions border :column="1" size="small" class="detail-description" :style="{ width: '100%' }" :label-width="'120px'">
                <el-descriptions-item label="状态码">
                  <span :class="getValueClass(selectedItem, 'har.response.status')">
                    {{ selectedItem.har.response.status === 0 ? 'Aborted' : selectedItem.har.response.status }}
                    {{ selectedItem.har.response.statusText }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item label="HTTP版本">
                  <div class="text-break">{{ selectedItem.har.response.httpVersion }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="内容类型">
                  <div class="text-break">{{ selectedItem.har.response.content.mimeType }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="内容大小">{{ formatSize(selectedItem.har.response.content.size) }}</el-descriptions-item>
                
                <!-- 响应头 - 优化为固定高度可滚动 -->
                <el-descriptions-item label="响应头" v-if="selectedItem.har.response.headers?.length">
                  <div class="headers-container">
                    <el-table :data="selectedItem.har.response.headers" border size="small" stripe>
                      <el-table-column prop="name" label="名称" min-width="30%"></el-table-column>
                      <el-table-column prop="value" label="值" min-width="70%" show-overflow-tooltip>
                        <template #default="scope">
                          <div class="text-break">{{ scope.row.value }}</div>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-descriptions-item>
                
                <!-- 响应体 -->
                <el-descriptions-item label="响应体" v-if="selectedItem.har.response.content?.text">
                  <div class="body-container">
                    <el-tabs class="fixed-width-tabs">
                      <el-tab-pane label="格式化数据">
                        <div class="formatted-body">
                          <!-- 对于图片类型使用原来的格式化函数 -->
                          <template v-if="isImageContent(selectedItem.har.response.content.mimeType || 'text/plain')">
                            <div v-html="formatBodyContent(selectedItem.har.response.content.text, selectedItem.har.response.content.mimeType || 'text/plain')"></div>
                          </template>
                          <!-- 其他类型使用highlight组件 -->
                          <template v-else>
                            <highlightjs 
                              :language="getHighlightLanguage(selectedItem.har.response.content.mimeType || 'text/plain')"
                              :code="getFormattedCode(selectedItem.har.response.content.text, selectedItem.har.response.content.mimeType || 'text/plain')"
                              :autodetect="!getHighlightLanguage(selectedItem.har.response.content.mimeType || 'text/plain')"
                            />
                          </template>
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="原始数据">
                        <div class="response-body-wrapper">
                          <pre class="response-body">{{ selectedItem.har.response.content.text }}</pre>
                        </div>
                      </el-tab-pane>
                    </el-tabs>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            
            <!-- PCAP详情标签页 -->
            <el-tab-pane label="PCAP信息" v-if="isPcapFile && selectedItem.pcap">
              <el-descriptions border :column="1" size="small" class="detail-description" :label-width="'120px'">
                <!-- 链路层信息 -->
                <el-descriptions-item label="链路层" v-if="selectedItem.pcap.linkType || selectedItem.pcap.sourceMAC">
                  <div class="layer-info">
                    <div v-if="selectedItem.pcap.linkType"><strong>链路类型:</strong> {{ selectedItem.pcap.linkType }}</div>
                    <div v-if="selectedItem.pcap.sourceMAC"><strong>源MAC:</strong> {{ selectedItem.pcap.sourceMAC }}</div>
                    <div v-if="selectedItem.pcap.destinationMAC"><strong>目标MAC:</strong> {{ selectedItem.pcap.destinationMAC }}</div>
                  </div>
                </el-descriptions-item>
                
                <!-- 网络层信息 -->
                <el-descriptions-item label="网络层" v-if="selectedItem.pcap.networkProtocol || selectedItem.pcap.sourceIP">
                  <div class="layer-info">
                    <div v-if="selectedItem.pcap.networkProtocol"><strong>网络协议:</strong> {{ selectedItem.pcap.networkProtocol }}</div>
                    <div v-if="selectedItem.pcap.sourceIP"><strong>源IP:</strong> {{ selectedItem.pcap.sourceIP }}</div>
                    <div v-if="selectedItem.pcap.destinationIP"><strong>目标IP:</strong> {{ selectedItem.pcap.destinationIP }}</div>
                    <div v-if="selectedItem.pcap.ipVersion !== undefined"><strong>IP版本:</strong> {{ selectedItem.pcap.ipVersion }}</div>
                    <div v-if="selectedItem.pcap.ttl !== undefined"><strong>TTL:</strong> {{ selectedItem.pcap.ttl }}</div>
                  </div>
                </el-descriptions-item>
                
                <!-- 传输层信息 -->
                <el-descriptions-item label="传输层" v-if="selectedItem.pcap.transportProtocol || selectedItem.pcap.sourcePort">
                  <div class="layer-info">
                    <div v-if="selectedItem.pcap.transportProtocol"><strong>传输协议:</strong> {{ selectedItem.pcap.transportProtocol }}</div>
                    <div v-if="selectedItem.pcap.sourcePort !== undefined"><strong>源端口:</strong> {{ selectedItem.pcap.sourcePort }}</div>
                    <div v-if="selectedItem.pcap.destinationPort !== undefined"><strong>目标端口:</strong> {{ selectedItem.pcap.destinationPort }}</div>
                    <div v-if="selectedItem.pcap.sequenceNumber !== undefined"><strong>TCP序列号:</strong> {{ selectedItem.pcap.sequenceNumber }}</div>
                    <div v-if="selectedItem.pcap.acknowledgmentNum !== undefined"><strong>TCP确认号:</strong> {{ selectedItem.pcap.acknowledgmentNum }}</div>
                    <div v-if="selectedItem.pcap.tcpFlags !== undefined"><strong>TCP标志:</strong> {{ selectedItem.pcap.tcpFlags }}</div>
                  </div>
                </el-descriptions-item>
                
                <!-- 数据包信息 -->
                <el-descriptions-item label="数据包信息">
                  <div class="layer-info">
                    <div v-if="selectedItem.pcap.packetLength !== undefined"><strong>包长度:</strong> {{ formatSize(selectedItem.pcap.packetLength) }}</div>
                    <div v-if="selectedItem.pcap.captureLength !== undefined"><strong>捕获长度:</strong> {{ formatSize(selectedItem.pcap.captureLength) }}</div>
                  </div>
                </el-descriptions-item>
                
                <!-- 原始数据 -->
                <el-descriptions-item label="原始数据" v-if="selectedItem.pcap.rawData">
                  <div class="body-container">
                    <el-tabs class="fixed-width-tabs">
                      <el-tab-pane label="格式化数据">
                        <div class="hex-data-wrapper">
                          <pre class="hex-data">{{ formatRawHexData(selectedItem.pcap.rawData) }}</pre>
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="原始数据">
                        <div class="raw-data-wrapper">
                          <pre class="raw-data">{{ selectedItem.pcap.rawData }}</pre>
                        </div>
                      </el-tab-pane>
                    </el-tabs>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            
            <!-- 协议特定信息标签页 -->
            <el-tab-pane label="协议信息" v-if="selectedItem.dns || selectedItem.icmp || selectedItem.dhcp">
              <!-- DNS信息 -->
              <el-descriptions border :column="1" size="small" class="detail-description" v-if="selectedItem.dns" :label-width="'120px'">
                <el-descriptions-item label="DNS信息">
                  <div class="protocol-info">
                    <div v-if="selectedItem.dns.queryId !== undefined"><strong>查询ID:</strong> {{ selectedItem.dns.queryId }}</div>
                    <div v-if="selectedItem.dns.qr !== undefined"><strong>类型:</strong> {{ selectedItem.dns.qr ? '响应' : '查询' }}</div>
                    <div v-if="selectedItem.dns.questions?.length"><strong>查询域名:</strong> {{ selectedItem.dns.questions.join(', ') }}</div>
                    <div v-if="selectedItem.dns.responseCode !== undefined"><strong>响应代码:</strong> {{ selectedItem.dns.responseCode }}</div>
                    <div v-if="selectedItem.dns.recordTypes?.length"><strong>记录类型:</strong> {{ selectedItem.dns.recordTypes.join(', ') }}</div>
                    <div v-if="selectedItem.dns.answers?.length">
                      <strong>回答记录:</strong>
                      <div v-for="(answer, index) in selectedItem.dns.answers" :key="index" class="dns-answer">
                        <div><strong>名称:</strong> {{ answer.name }}</div>
                        <div><strong>类型:</strong> {{ answer.type }}</div>
                        <div><strong>类别:</strong> {{ answer.class }}</div>
                        <div><strong>TTL:</strong> {{ answer.ttl }}</div>
                        <div><strong>数据:</strong> {{ answer.data }}</div>
                      </div>
                    </div>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
              
              <!-- ICMP信息 -->
              <el-descriptions border :column="1" size="small" class="detail-description" v-if="selectedItem.icmp" :label-width="'120px'">
                <el-descriptions-item label="ICMP信息">
                  <div class="protocol-info">
                    <div><strong>类型:</strong> {{ selectedItem.icmp.type }}</div>
                    <div><strong>代码:</strong> {{ selectedItem.icmp.code }}</div>
                    <div v-if="selectedItem.icmp.sequence !== undefined"><strong>序列号:</strong> {{ selectedItem.icmp.sequence }}</div>
                    <div v-if="selectedItem.icmp.id !== undefined"><strong>标识符:</strong> {{ selectedItem.icmp.id }}</div>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
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

// 引入highlight.js和vue-plugin
import 'highlight.js/styles/atom-one-dark.css';
import hljs from 'highlight.js';
import hljsVuePlugin from "@highlightjs/vue-plugin";

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

// 注册highlightjs组件
const highlightjs = hljsVuePlugin.component;

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
    { prop: 'har.request.url', label: 'URL', width: '400', visible: true },
    { prop: 'har.request.method', label: 'HTTP方法', width: '50', visible: true },
    { prop: 'har.response.status', label: 'HTTP状态码', width: '50', visible: true },
    { prop: 'har.request.httpVersion', label: 'HTTP版本', width: '50', visible: false },
    { prop: 'har.response.content.mimeType', label: '内容类型', width: '150', visible: true },
    { prop: 'har.response.content.size', label: '内容长度', width: '100', visible: true },
    { prop: 'har.time', label: '响应时间', width: '100', visible: true },
    { prop: 'har.serverIPAddress', label: '服务器IP', width: '150', visible: false },
    { prop: 'pcap.destinationPort', label: '目标端口', width: '100', visible: false },
    { prop: 'flowId', label: '流ID', width: '100', visible: false },
    { prop: 'applicationProtocol', label: '应用协议', width: '120', visible: true }
  ],
  // PCAP 系列文件的列定义
  pcap: [
    { prop: 'captureIndex', label: 'ID', width: '80', visible: true },
    { prop: 'timestamp', label: '时间戳', width: '180', visible: true },
    { prop: 'pcap.sourceIP', label: '源IP', width: '150', visible: true },
    { prop: 'pcap.destinationIP', label: '目标IP', width: '150', visible: true },
    { prop: 'pcap.sourcePort', label: '源端口', width: '100', visible: true },
    { prop: 'pcap.destinationPort', label: '目标端口', width: '100', visible: true },
    { prop: 'pcap.networkProtocol', label: '网络协议', width: '100', visible: true },
    { prop: 'pcap.transportProtocol', label: '传输协议', width: '100', visible: true },
    { prop: 'applicationProtocol', label: '应用协议', width: '100', visible: true },
    { prop: 'pcap.packetLength', label: '包长度', width: '100', visible: true },
    { prop: 'pcap.captureLength', label: '捕获长度', width: '100', visible: false },
    { prop: 'pcap.sourceMAC', label: '源MAC', width: '150', visible: false },
    { prop: 'pcap.destinationMAC', label: '目标MAC', width: '150', visible: false },
    { prop: 'pcap.ttl', label: 'TTL', width: '80', visible: false },
    { prop: 'pcap.ipVersion', label: 'IP版本', width: '80', visible: false },
    { prop: 'flowId', label: '流ID', width: '100', visible: false },
    { prop: 'conversationId', label: '会话ID', width: '100', visible: false },
    { prop: 'pcap.tcpFlags', label: 'TCP标志', width: '120', visible: false },
    { prop: 'pcap.sequenceNumber', label: 'TCP序列号', width: '150', visible: false },
    { prop: 'pcap.acknowledgmentNum', label: 'TCP确认号', width: '150', visible: false },
    { prop: 'sourceFormat', label: '源格式', width: '120', visible: false },
    { prop: 'sourceFile', label: '源文件', width: '150', visible: false }
  ],
  // 默认列定义，当无法确定文件类型时使用
  default: [
    { prop: 'captureIndex', label: 'ID', width: '80', visible: true },
    { prop: 'timestamp', label: '时间戳', width: '180', visible: true },
    { prop: 'sourceFormat', label: '源格式', width: '120', visible: true },
    { prop: 'sourceFile', label: '源文件', width: '150', visible: true },
    { prop: 'applicationProtocol', label: '应用协议', width: '100', visible: true },
    { prop: 'pcap.packetLength', label: '包长度', width: '100', visible: true }
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
  // 确保使用正确的总数记录，并处理total为0的情况
  console.log('计算总记录数:', {
    'data.total': props.data?.total, 
    'data.length': props.data?.data?.length
  });
  
  // 首先，如果props.data?.total存在（包括0），使用它
  if (props.data?.total !== undefined) {
    console.log('使用API返回的total值:', props.data.total);
    return props.data.total;
  } else if (props.data?.data?.length) {
    // 如果没有total但有data，使用data长度
    console.log('使用data数组长度:', props.data.data.length);
    return props.data.data.length;
  }
  return 0;
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

// 添加获取嵌套属性的工具函数
const getNestedValue = (obj: any, path: string) => {
  if (!obj) return undefined;
  const parts = path.split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value === undefined || value === null) return undefined;
    value = value[part];
  }
  
  return value;
};

// 格式化字节大小
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 修改格式化单元格值函数
const formatCellValue = (value: any, prop: string) => {
  if (value === undefined || value === null) return '-';
  
  // 特殊处理HTTP状态码为0的情况
  if (prop === 'har.response.status' && value === 0) {
    return 'Aborted';
  }
  
  // 根据属性类型格式化
  if (typeof value === 'string') {
    if (prop === 'timestamp') {
      // 格式化时间戳
      try {
        const date = new Date(value);
        return date.toLocaleString();
      } catch {
        return value;
      }
    } else if (prop.includes('url') || prop.includes('URL')) {
      // 不截断URL类型字段
      return value;
    } else if (value.length > 200) {
      return value.substring(0, 200) + '...';
    }
  } else if (typeof value === 'number') {
    if (prop.includes('time') && !prop.includes('timestamp')) {
      return `${value} ms`;
    } else if (prop.includes('size') || prop.includes('length')) {
      return formatSize(value);
    }
  } else if (Array.isArray(value)) {
    return value.join(', ');
  } else if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
};

// 修改单元格渲染函数
const renderCell = (row: any, column: TableColumn) => {
  const prop = column.prop;
  
  // 处理嵌套属性
  if (prop.includes('.')) {
    const value = getNestedValue(row, prop);
    
    // 特殊处理HTTP状态码为0的情况
    if (prop === 'har.response.status' && value === 0) {
      return 'Aborted';
    }
    
    return formatCellValue(value, prop);
  }
  
  return formatCellValue(row[prop], prop);
};

// 获取值的样式
const getValueClass = (row: any, prop: string): string => {
  // 对于嵌套属性，获取真实值
  let value;
  if (prop.includes('.')) {
    value = getNestedValue(row, prop);
  } else {
    value = row[prop];
  }
  
  if (value === undefined || value === null) return '';
  
  // HTTP状态码样式
  if (prop === 'har.response.status' || prop === 'httpStatusCode') {
    if (value === 0) return 'status-warning'; // 对状态码0使用警告样式
    if (value < 200) return 'status-info';
    if (value < 300) return 'status-success';
    if (value < 400) return 'status-warning';
    if (value >= 400) return 'status-error';
  }
  
  // 内容长度样式
  if (prop.includes('size') || prop.includes('length')) {
    if (value > 1024 * 1024) return 'size-large';  // 大于1MB
    if (value > 100 * 1024) return 'size-medium';  // 大于100KB
  }
  
  // 方法样式
  if (prop === 'har.request.method' || prop === 'httpMethod') {
    if (value === 'GET') return 'method-get';
    if (value === 'POST') return 'method-post';
    if (value === 'PUT') return 'method-put';
    if (value === 'DELETE') return 'method-delete';
  }
  
  return '';
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
watch(() => props.data, (newData, oldData) => {
  console.log('接收到父组件传入的新数据，数据长度:', newData?.data?.length || 0)

  // 文件变更时，重置分页状态
  const newFileId = newData?.fileInfo?.fileId || newData?.selectedFileId;
  const oldFileId = oldData?.fileInfo?.fileId || oldData?.selectedFileId;
  
  if (newFileId !== oldFileId || newData?.data?.length === 0) {
    console.log('检测到文件变化或数据清空，重置分页状态', 
      { 旧文件ID: oldFileId, 新文件ID: newFileId, 数据长度: newData?.data?.length });
    currentPage.value = 1;
    pageSize.value = 20;
  }
  
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
  const fileTypeCurrent = getFileType()
  
  if (fileTypeCurrent === FILE_TYPES.HAR) {
    return availableColumns.value.filter(col => 
      ['captureIndex', 'timestamp', 'har.request.url', 'har.response.status', 
       'har.request.httpVersion', 'har.response.content.mimeType', 'har.response.content.size',
       'har.serverIPAddress'].includes(col.prop)
    );
  } else if (fileTypeCurrent === 'pcap') {
    return availableColumns.value.filter(col => 
      ['captureIndex', 'timestamp', 'pcap.sourceIP', 'pcap.destinationIP', 'pcap.sourcePort', 'pcap.destinationPort',
       'pcap.networkProtocol', 'pcap.transportProtocol', 'applicationProtocol', 'pcap.packetLength'].includes(col.prop)
    );
  }
  
  // 默认情况下，使用可见的普通列
  return visibleColumns.value;
}

// 检查字符串是否为十六进制格式
const isHexFormat = (str: string): boolean => {
  return typeof str === 'string' && /^[0-9A-Fa-f\s]+$/.test(str);
};

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
};

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

// 添加表格单元格类名函数，用于控制宽高
const getCellClassName = () => {
  return 'compact-cell';
}

// HTML转义
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};


// 判断是否为PCAP文件
const isPcapFile = computed(() => {
  if (Array.isArray(FILE_TYPES.PCAP)) {
    return FILE_TYPES.PCAP.includes(fileType.value);
  }
  return fileType.value === 'pcap';
});

// 原始16进制数据格式化
const formatRawHexData = (hexData: string): string => {
  if (!hexData) return '';
  
  // 检查是否已经是十六进制格式
  const isHexFormat = /^([0-9A-Fa-f]{2}\s?)+$/.test(hexData.trim());
  if (!isHexFormat) {
    // 尝试将字符串转换为十六进制
    try {
      let hexResult = '';
      for (let i = 0; i < hexData.length; i++) {
        hexResult += hexData.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
      }
      hexData = hexResult;
    } catch (error) {
      console.error('十六进制转换错误:', error);
      return hexData; // 返回原始数据
    }
  }
  
  return formatHexPayload(hexData);
};

// 根据MIME类型获取highlight.js语言
const getHighlightLanguage = (mimeType: string): string => {
  // 处理常见的MIME类型映射到highlight.js支持的语言
  if (mimeType.includes('application/json')) {
    return 'json';
  } else if (mimeType.includes('text/html')) {
    return 'html';
  } else if (mimeType.includes('text/css')) {
    return 'css';
  } else if (mimeType.includes('application/xml') || mimeType.includes('text/xml')) {
    return 'xml';
  } else if (mimeType.includes('application/javascript') || mimeType.includes('text/javascript')) {
    return 'javascript';
  } else if (mimeType.includes('application/x-yaml') || mimeType.includes('text/yaml')) {
    return 'yaml';
  } else if (mimeType.includes('text/markdown')) {
    return 'markdown';
  } else if (mimeType.includes('text/x-c') || mimeType.includes('text/x-csrc')) {
    return 'c';
  } else if (mimeType.includes('text/x-java')) {
    return 'java';
  } else if (mimeType.includes('text/x-python')) {
    return 'python';
  } else if (mimeType.includes('text/x-sql')) {
    return 'sql';
  }
  
  // 对于不能识别的MIME类型，返回空字符串让组件使用autodetect
  return '';
};

// 格式化代码，针对特殊类型做预处理
const getFormattedCode = (content: string, mimeType: string): string => {
  try {
    // 处理JSON格式 - 尝试格式化
    if (mimeType.includes('application/json')) {
      try {
        const jsonObj = JSON.parse(content);
        return JSON.stringify(jsonObj, null, 2);
      } catch (e) {
        console.warn('JSON解析失败，返回原始内容');
        return content;
      }
    }
    
    // 图片内容由isImageContent分支处理，这里不需要处理
    
    // 其他类型直接返回内容
    return content;
  } catch (error) {
    console.error('格式化代码出错:', error);
    return content;
  }
};

// 格式化响应体内容
const formatBodyContent = (content: string, mimeType: string): string => {
  try {
    // 优先处理图片格式
    if (mimeType.startsWith('image/')) {
      // 判断是否为Base64编码的图片
      if (content.startsWith('data:image') || /^[A-Za-z0-9+/=]+$/.test(content)) {
        // 确保有正确的base64前缀
        const imgSrc = content.startsWith('data:image') 
          ? content 
          : `data:${mimeType};base64,${content}`;
        return `<div class="image-container"><img src="${imgSrc}" alt="响应图片" /></div>`;
      }
      return `<div class="message-container">图片数据无法显示</div>`;
    }
    
    // 仅作为备用处理，现在主要使用highlightjs组件
    return `<pre class="text-content">${escapeHtml(content)}</pre>`;
  } catch (error) {
    console.error('响应体格式化错误:', error);
    return `<pre class="text-content">${escapeHtml(content)}</pre>`;
  }
};

// 判断是否为图片内容
const isImageContent = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};
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

/* 自定义表格样式 */
.custom-table {
  width: 100%;
  --el-table-border-color: var(--el-border-color-lighter);
}

/* 值的样式定义 */
.status-info {
  color: var(--el-color-info);
  font-weight: bold;
}
.status-success {
  color: var(--el-color-success);
  font-weight: bold;
}
.status-warning {
  color: var(--el-color-warning);
  font-weight: bold;
}
.status-error {
  color: var(--el-color-danger);
  font-weight: bold;
}

/* 方法样式 */
.method-get {
  color: var(--el-color-success);
  font-weight: bold;
}
.method-post {
  color: var(--el-color-primary);
  font-weight: bold;
}
.method-put {
  color: var(--el-color-warning);
  font-weight: bold;
}
.method-delete {
  color: var(--el-color-danger);
  font-weight: bold;
}

/* 大小样式 */
.size-large {
  color: var(--el-color-danger);
}
.size-medium {
  color: var(--el-color-warning);
}

/* 详情视图样式 */
.data-detail-container {
  max-height: 75vh;
  overflow-y: auto;
  padding: 0 10px;
}

.headers-container {
  max-height: 200px;
  overflow: auto;
  font-family: monospace;
}

.header-item {
  padding: 4px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.header-name {
  font-weight: bold;
  margin-right: 8px;
  color: var(--el-color-primary);
}

.layer-details, .har-details {
  margin-top: 20px;
}

h3 {
  margin: 20px 0 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-border-color);
  color: var(--el-color-primary);
}

h4 {
  margin: 12px 0 8px;
  color: var(--el-text-color-primary);
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
  color: var(--el-color-success);
  font-weight: bold;
}

.http-method-post {
  color: var(--el-color-primary);
  font-weight: bold;
}

.http-method-put {
  color: var(--el-color-warning);
  font-weight: bold;
}

.http-method-delete {
  color: var(--el-color-danger);
  font-weight: bold;
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

/* 详情面板基本样式 */
.detail-panel {
  width: 60%;
  max-width: 1300px; /* 设置最大宽度，确保在小屏幕上不会太宽 */
  min-width: 500px; /* 设置最小宽度，确保内容能够正常显示 */
  height: 100%;
  background-color: var(--el-bg-color);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
}

/* 在小屏幕上适当调整详情面板宽度 */
@media (max-width: 1200px) {
  .detail-panel {
    width: 70%;
  }
}

@media (max-width: 768px) {
  .detail-panel {
    width: 85%;
    min-width: 320px;
  }
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
  overflow: hidden; /* 确保标题不会溢出 */
}

.record-id {
  font-size: 14px;
  color: var(--el-color-info);
  font-weight: normal;
  white-space: nowrap; /* 保持ID在一行 */
}

.close-button {
  padding: 8px;
  font-size: 18px;
  flex-shrink: 0; /* 防止按钮被压缩 */
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

:deep(.el-tabs--left .el-tabs__header.is-left) {
  margin-right: 0;
}

:deep(.el-tabs__content) {
  padding: 16px;
  overflow: auto;
  height: calc(100% - 40px);
}

/* 确保详情面板中的内容不会超出边界 */
.detail-description {
  margin-bottom: 20px;
  width: 100%;
  table-layout: fixed; /* 使用固定表格布局 */
}

/* 调整el-descriptions组件的样式 */
:deep(.el-descriptions__body) {
  width: 100%;
}

:deep(.el-descriptions__table) {
  width: 100%;
  table-layout: fixed;
}

:deep(.el-descriptions__cell) {
  box-sizing: border-box;
}

/* 确保描述项标签固定宽度 */
:deep(.el-descriptions-item__label) {
  width: 25%;
  min-width: 100px;
  box-sizing: border-box;
}

/* 确保描述项内容不会溢出 */
:deep(.el-descriptions-item__content) {
  width: 75%;
  word-break: break-word;
  overflow-wrap: break-word;
  overflow: auto;
  white-space: normal;
  box-sizing: border-box;
}

/* 请求头容器样式优化 */
.headers-container {
  max-height: 200px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  width: 100%;
}

/* 确保请求头表格不会超出容器 */
:deep(.headers-container .el-table) {
  width: 100% !important;
  table-layout: fixed;
}

:deep(.headers-container .el-table .el-table__body) {
  width: 100% !important;
}

:deep(.headers-container .el-table .el-table__header) {
  width: 100% !important;
}

/* 表格单元格内容换行 */
:deep(.headers-container .el-table .cell) {
  word-break: break-word;
  white-space: normal;
  line-height: 1.5;
}

.body-container {
  width: 100%;
  overflow: hidden;
}

/* 处理响应体和请求体容器 */
:deep(.body-container .el-tabs) {
  width: 100%;
}

:deep(.body-container .el-tabs__content) {
  overflow: visible;
}

:deep(.body-container .el-tab-pane) {
  overflow: hidden;
}

.formatted-body {
  max-height: 500px;
  overflow: auto;
  background-color: var(--el-fill-color-light);
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  width: 100%;
  box-sizing: border-box;
}

.formatted-body > div {
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

/* 添加包装器确保滚动在内部发生 */
.request-body-wrapper,
.response-body-wrapper,
.raw-data-wrapper,
.hex-data-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* 请求/响应体样式 */
.request-body, .response-body, .raw-data, .hex-data {
  max-height: 500px;
  overflow-y: auto;
  background-color: var(--el-fill-color-light);
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  width: 100%;
  box-sizing: border-box;
  word-break: break-all; /* 确保长文本换行 */
}

.detail-value {
  word-break: break-word;
  max-width: 100%;
  overflow-wrap: break-word;
}

/* 新增的样式 */
.headers-container {
  max-height: 200px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.body-container {
  width: 100%;
  overflow: hidden; /* 防止溢出 */
}

.formatted-body {
  max-height: 500px;
  overflow: auto;
  background-color: var(--el-fill-color-light);
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  /* 确保内容适应容器宽度 */
  width: 100%;
  box-sizing: border-box;
}

.formatted-body > div {
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

/* 添加包装器确保滚动在内部发生 */
.request-body-wrapper,
.response-body-wrapper,
.raw-data-wrapper,
.hex-data-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* 请求/响应体样式 */
.request-body, .response-body, .raw-data, .hex-data {
  max-height: 500px;
  overflow-y: auto;
  background-color: var(--el-fill-color-light);
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  width: 100%;
  box-sizing: border-box;
  word-break: break-all; /* 确保长文本换行 */
}

/* 确保标签页不会被内容推动 */
.fixed-width-tabs {
  width: 100%;
}

:deep(.fixed-width-tabs .el-tabs__content) {
  overflow: visible;
  width: 100%;
}

:deep(.fixed-width-tabs .el-tabs__nav) {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
}

/* JSON高亮和其他内容样式 */
.json-highlight, .html-highlight, .css-highlight, .xml-highlight, 
.javascript-highlight, .yaml-highlight, .auto-highlight {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-family: monospace;
  max-height: 500px;
  overflow: auto;
  width: 100%;
  box-sizing: border-box;
}

/* 允许highlight.js样式生效 */
:deep(.hljs) {
  background: transparent;
  padding: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  width: 100%;
  overflow-x: hidden;
}

/* highlightjs组件样式 */
:deep(.highlightjs) {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  background-color: var(--el-fill-color-light);
  padding: 10px;
  border-radius: 4px;
  box-sizing: border-box;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 500px;
  overflow: auto;
}

.image-container img {
  max-width: 100%;
  object-fit: contain;
}

.html-preview {
  max-height: 500px;
  overflow: auto;
  padding: 10px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
}

.message-container {
  padding: 10px;
  color: var(--el-text-color-secondary);
  font-style: italic;
  text-align: center;
}

.text-content {
  word-wrap: break-word;
  white-space: pre-wrap;
}

.hex-data {
  max-height: 500px;
  overflow: auto;
  background-color: var(--el-fill-color-light);
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre;
  line-height: 1.5;
  font-size: 14px;
}

/* 确保长文本(如URL)可以自动换行 */
.text-break {
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.url-content {
  max-width: 100%;
  overflow-wrap: break-word;
}

/* 为所有描述项内容添加自动换行支持 */
:deep(.el-descriptions-item__content) {
  word-break: break-word;
  white-space: normal;
}

/* 修复表格内容换行问题 */
:deep(.el-table .cell) {
  word-break: break-word;
  line-height: 1.5;
}
</style> 
