<template>
  <div class="data-list-container">
    <div class="data-list-header">
      <div class="header-title">
        <h3 class="text-xl font-medium">数据列表详情</h3>
        <span class="data-count" v-if="data && data.data">共 {{ data.data.length || 0 }} 条数据</span>
      </div>
    </div>

    <el-table
      :data="filteredData"
      border
      stripe
      style="width: 100%"
      v-loading="loading"
      :max-height="tableMaxHeight"
      class="custom-table dynamic-row-height"
    >
      <!-- 动态生成表格列 -->
      <template v-for="(column, index) in tableColumns" :key="index">
        <el-table-column
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          sortable
        >
          <template #default="scope">
            <span :class="getValueClass(scope.row[column.prop])">
              {{ formatCellValue(scope.row[column.prop]) }}
            </span>
          </template>
        </el-table-column>
      </template>
      
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

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next"
        :total="filteredData.length"
      >
      </el-pagination>
    </div>

    <!-- 数据详情对话框 -->
    <el-dialog
      title="数据详情"
      v-model="detailDialogVisible"
      width="60%"
    >
      <div v-if="selectedItem">
        <el-descriptions border :column="2">
          <template v-for="(column, index) in tableColumns" :key="index">
            <el-descriptions-item :label="column.label">
              {{ formatCellValue(selectedItem[column.prop]) }}
            </el-descriptions-item>
          </template>
        </el-descriptions>
      </div>
    </el-dialog>
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
} from "element-plus";

// 接口定义
interface TableColumn {
  prop: string;
  label: string;
  width?: string;
}

interface DataItem {
  [key: string]: any;
  id?: string | number;
}

interface ComponentData {
  data?: DataItem[];
  [key: string]: any;
}

// 定义props
const props = defineProps({
  data: {
    type: Object as () => ComponentData,
    default: () => ({})
  }
})

// 数据
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const tableMaxHeight = ref(600)
const detailDialogVisible = ref(false)
const selectedItem = ref<DataItem | null>(null)

// 临时列定义，实际应该根据数据动态生成
const tableColumns = ref<TableColumn[]>([
  { prop: 'id', label: 'ID', width: '80' },
  { prop: 'name', label: '名称', width: '150' },
  { prop: 'type', label: '类型', width: '120' },
  { prop: 'value', label: '值', width: '' },
  { prop: 'date', label: '日期', width: '180' },
  { prop: 'status', label: '状态', width: '100' }
])

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
  
  // 分页处理（实际项目中可能由后端处理分页）
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return result.slice(start, end)
})

// 方法
// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 格式化单元格值
const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '--'
  return String(value)
}

// 获取值的样式
const getValueClass = (value: any): string => {
  // 可以根据不同的值返回不同的样式
  return ''
}

// 查看详情
const viewDetail = (row: DataItem) => {
  selectedItem.value = row
  detailDialogVisible.value = true
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

// 动态生成表格列
const generateColumns = () => {
  if (props.data && props.data.data && props.data.data.length > 0) {
    // 从第一条数据生成列定义
    const sample = props.data.data[0]
    if (sample) {
      tableColumns.value = Object.keys(sample).map(key => {
        return {
          prop: key,
          label: formatColumnLabel(key),
          width: key === 'id' ? '80' : ''
        }
      })
    }
  }
}

const formatColumnLabel = (key: string): string => {
  // 将key转换为更友好的标签名
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
}

// 生命周期钩子
onMounted(() => {
  // 设置表格高度
  tableMaxHeight.value = window.innerHeight - 300
  
  // 生成列
  generateColumns()
})

// 监听数据变化
watch(() => props.data, () => {
  generateColumns()
}, { deep: true })
</script>

<style scoped>
.data-list-container {
  height: 100%;
}

.data-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.header-title {
  display: flex;
  align-items: baseline;
}

.header-title h3 {
  margin: 0;
  margin-right: 10px;
}

.data-count {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: none;
}

.search-input {
  display: none;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 表格样式 */
.custom-table {
  margin-bottom: 20px;
  height: auto !important;
  max-height: calc(100vh - 380px) !important;
}

/* 动态行高表格样式 */
:deep(.dynamic-row-height .el-table__header-row) {
  height: 50px !important; /* 表头高度固定 */
}

:deep(.dynamic-row-height .el-table__cell) {
  padding: 10px 0 !important;
  vertical-align: middle !important;
}

:deep(.w-64) {
  width: 16rem;
}

:deep(.rounded-button) {
  border-radius: 0.25rem !important;
}
</style> 
