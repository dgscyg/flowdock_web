<template slot-scope="scope">
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden">
      <!-- 主内容区 -->
      <div v-if="!showCreateDialog && !showEditDialog" class="h-full p-6 overflow-auto">
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- 选择平台和状态 -->
            <el-select v-model="platform" placeholder="选择平台" class="w-32">
              <el-option label="全部平台" :value="0" />
              <el-option label="Android" :value="1" />
              <el-option label="iOS" :value="2" />
              <el-option label="PC" :value="3" />
              <el-option label="Web" :value="4" />
            </el-select>
            <el-select v-model="status" placeholder="任务状态" class="w-32">
              <el-option label="全部状态" :value="0" />
              <el-option label="未开始" :value="1" />
              <el-option label="进行中" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
            <el-select
              v-model="selectedTagIds"
              multiple
              filterable
              remote
              reserve-keyword
              placeholder="选择标签"
              :remote-method="remoteTagSearch"
              :loading="tagLoading"
              class="w-64"
            >
              <el-option
                v-for="tag in tagList"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              />
            </el-select>
            <el-date-picker
              v-model="createTimeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </div>
          <div class="flex items-center ml-auto space-x-4">
            <!-- 搜索和创建按钮 -->
            <el-input
              v-model="searchQuery"
              placeholder="搜索任务..."
              class="w-64"
              :prefix-icon="Search"
            />
            <el-button
              type="primary"
              @click="showCreateDialog = true"
              class="!rounded-button whitespace-nowrap"
            >
              <el-icon class="mr-1">
                <Plus />
              </el-icon>
              创建任务
            </el-button>
          </div>
        </div>
        <!-- 任务列表 -->
        <el-table
          ref="tableRef"
          :data="filteredTaskList"
          style="width: 100%"
          class="custom-table dynamic-row-height"
          @sort-change="handleSortChange"
          :row-style="{ height: rowHeight + 'px' }"
          :header-row-style="{ height: '50px' }"
        >
          <el-table-column prop="name" label="任务名称" />
          <el-table-column prop="target" label="采集对象" />
          <el-table-column prop="platform" label="平台" width="120">
            <template #default="scope">
              <el-tag :type="getPlatformTagType(scope.row.platform)">
                {{ getPlatformDisplay(scope.row.platform) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusDisplay(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="taskTags" label="标签" width="180">
            <template #default="scope">
              <div class="flex flex-wrap items-center">
                <el-tooltip
                  v-for="tag in scope.row.taskTags"
                  :key="tag.tagId"
                  :content="tag.tagName"
                  placement="top"
                >
                  <div
                    class="mr-2 mb-1"
                    style="
                      max-width: 100px;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    "
                  >
                    <el-tag :type="getTagType(tag.tagName)">
                      {{ tag.tagName }}
                    </el-tag>
                  </div>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" :show-overflow-tooltip="true" />
          <el-table-column prop="createdAt" label="创建时间" width="180" sortable />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button-group>
                <el-button size="small" type="primary" @click="handleEdit(scope.row)">
                  <el-icon>
                    <Edit />
                  </el-icon>
                </el-button>
                <el-popconfirm
                  title="确定删除任务吗？"
                  :confirm-button-text="'确定'"
                  :cancel-button-text="'取消'"
                  popper-class="popconfirm-wide"
                  @confirm="handleDelete(scope.row)"
                >
                  <template #reference>
                    <el-button size="small" type="danger">
                      <el-icon>
                        <Delete />
                      </el-icon>
                    </el-button>
                  </template>
                </el-popconfirm>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页 -->
        <div class="mt-4 flex justify-end">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
          />
        </div>
      </div>
      <!-- 创建任务页面 -->
      <div v-else-if="showCreateDialog" class="h-full p-6 overflow-auto">
        <div class="rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-medium">创建新任务</h2>
            <el-button @click="showCreateDialog = false" class="!rounded-button"
              >返回列表</el-button
            >
          </div>
          <div class="flex space-x-6">
            <!-- 左侧表单 -->
            <div class="flex-1">
              <el-form ref="formRef" :model="taskForm" label-width="150px">
                <el-form-item label="任务名称" required>
                  <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
                </el-form-item>
                <el-form-item label="采集对象" required>
                  <el-input v-model="taskForm.target" placeholder="请输入采集对象名称" />
                </el-form-item>
                <el-form-item label="平台" required>
                  <el-radio-group v-model="taskForm.platform">
                    <el-radio :value="1">Android</el-radio>
                    <el-radio :value="2">iOS</el-radio>
                    <el-radio :value="3">PC</el-radio>
                    <el-radio :value="4">Web</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="任务结束时间" required>
                  <el-date-picker
                    v-model="taskForm.deadline"
                    type="datetime"
                    placeholder="请选择任务结束时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                    :disabled-date="disabledDate"
                  ></el-date-picker>
                </el-form-item>
                <el-form-item label="标签">
                  <el-select
                    v-model="taskForm.tagIds"
                    multiple
                    filterable
                    placeholder="请选择标签"
                    class="w-full"
                  >
                    <el-option
                      v-for="tag in tagList"
                      :key="tag.id"
                      :label="tag.name"
                      :value="tag.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="备注">
                  <el-input
                    v-model="taskForm.remark"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入备注信息"
                  />
                </el-form-item>
              </el-form>
            </div>
            <!-- 右侧上传区 -->
            <div class="flex-1">
              <div class="border-2 border-dashed rounded-lg p-6 text-center">
                <el-upload
                  class="upload-demo"
                  drag
                  multiple
                  :auto-upload="true"
                  :on-progress="handleProgress"
                  :on-success="handleSuccess"
                  action="/api/upload"
                >
                  <el-icon class="text-4xl mb-2">
                    <Upload />
                  </el-icon>
                  <div>将文件拖到此处，或<em class="text-primary">点击上传</em></div>
                </el-upload>
                <!-- 上传列表 -->
                <div v-if="uploadFiles.length" class="mt-4">
                  <div
                    v-for="file in uploadFiles"
                    :key="file.name"
                    class="flex items-center justify-between p-2 rounded mb-2"
                  >
                    <div class="flex items-center">
                      <el-icon class="mr-2">
                        <Document />
                      </el-icon>
                      <span>{{ file.name }}</span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-sm mr-2">{{ file.size }}</span>
                      <el-progress
                        v-if="file.status === 'uploading'"
                        :percentage="file.percentage"
                        :stroke-width="4"
                        class="w-20"
                      />
                      <el-icon
                        v-else-if="file.status === 'success'"
                        class="text-green-500"
                      >
                        <Check />
                      </el-icon>
                      <el-button
                        type="danger"
                        size="small"
                        circle
                        @click="handleRemoveFile(file)"
                      >
                        <el-icon>
                          <Delete />
                        </el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end mt-6">
            <el-button @click="showCreateDialog = false" class="mr-4">取消</el-button>
            <el-button
              type="primary"
              @click="handleSubmit"
              class="!rounded-button whitespace-nowrap"
            >
              确认创建
            </el-button>
          </div>
        </div>
      </div>
      <!-- 编辑任务页面 -->
      <div v-else-if="showEditDialog" class="h-full p-6 overflow-auto">
        <div class="rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-medium">编辑任务</h2>
            <el-button @click="showEditDialog = false" class="!rounded-button">返回列表</el-button>
          </div>
          <el-form ref="editFormRef" :model="editForm" label-width="150px">
            <el-form-item label="任务名称" required>
              <el-input v-model="editForm.name" placeholder="请输入任务名称" />
            </el-form-item>
            <el-form-item label="采集对象" required>
              <el-input v-model="editForm.target" placeholder="请输入采集对象名称" />
            </el-form-item>
            <el-form-item label="平台" required>
              <el-radio-group v-model="editForm.platform">
                <el-radio :value="1">Android</el-radio>
                <el-radio :value="2">iOS</el-radio>
                <el-radio :value="3">PC</el-radio>
                <el-radio :value="4">Web</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="任务结束时间" required>
              <el-date-picker v-model="editForm.deadline" type="datetime" placeholder="请选择任务结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" :disabled-date="disabledDate" />
            </el-form-item>
            <el-form-item label="标签">
              <el-select v-model="editForm.tagIds" multiple filterable placeholder="请选择标签" class="w-full">
                <el-option v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="editForm.remark" type="textarea" :rows="4" placeholder="请输入备注信息" />
            </el-form-item>
          </el-form>
          <div class="flex justify-end mt-6">
            <el-button @click="showEditDialog = false" class="mr-4">取消</el-button>
            <el-button type="primary" @click="handleUpdate" class="!rounded-button whitespace-nowrap">确认更新</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import {
  Search,
  Plus,
  Monitor,
  DataAnalysis,
  Setting,
  Edit,
  Delete,
  Upload,
  Document,
  Check,
} from "@element-plus/icons-vue";
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
} from "element-plus";
import { taskListApi, taskNewApi, taskDeleteApi, taskDetailApi, taskUpdateApi } from "#/api/task/task";
import { tagListApi } from "#/api/task/tag";
import type { Task } from "#/types/task";
import type { Tag } from "#/types/tag";
import {
  getPlatformDisplay,
  getStatusDisplay,
  getPlatformTagType,
  getStatusTagType,
  getTagType,
} from "#/types/task";
const searchQuery = ref("");
const activeMenu = ref("1");
const platform = ref(0);
const status = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(100);
const showCreateDialog = ref(false);
const taskForm = ref({
  name: "",
  target: "",
  platform: 1,
  deadline: "",
  tagIds: [] as number[],
  remark: "",
});
const createTimeRange = ref<[Date, Date]>();
const selectedTagIds = ref<number[]>([]);
const taskList = ref<Task[]>([]);
const uploadFiles = ref([
  {
    name: "data_analysis.xlsx",
    size: "2.5MB",
    status: "success",
    percentage: 100,
  },
  {
    name: "user_behavior.json",
    size: "1.8MB",
    status: "uploading",
    percentage: 65,
  },
]);
const tagList = ref<Tag[]>([]);
const tagLoading = ref(false);
const tagSearchQuery = ref("");
const createdAtSortOrder = ref<string | null>(null);
const tableRef = ref(null);
const rowHeight = ref(0);

// 新增编辑相关变量
const showEditDialog = ref(false);
const editForm = ref({
  uuid: "",
  name: "",
  target: "",
  platform: 1,
  deadline: "",
  tagIds: [] as number[],
  remark: "",
});

// 计算每行高度以平均分配表格高度
const calculateRowHeight = () => {
  nextTick(() => {
    // 表格内容区域总高度
    const tableEl = document.querySelector('.custom-table');
    if (!tableEl) return;
    
    // 获取表格容器高度并减去表头高度和其他边距
    const containerHeight = tableEl.clientHeight;
    const headerHeight = 50; // 表头高度
    const paginationHeight = 0; // 分页区域高度
    const otherPadding = 0; // 其他内边距等
    
    // 内容区域高度 = 容器高度 - 表头 - 分页 - 其他边距
    const contentHeight = containerHeight - headerHeight - paginationHeight - otherPadding;
    
    // 每行高度 = 内容区域高度 / 10行
    const calculatedRowHeight = Math.max(50, Math.floor(contentHeight / 10));
    
    rowHeight.value = calculatedRowHeight;
    
    // 确保样式更新
    const rows = document.querySelectorAll('.custom-table .el-table__row');
    rows.forEach(row => {
      (row as HTMLElement).style.height = `${calculatedRowHeight}px`;
    });
  });
};

// 修改编辑任务函数
const handleEdit = async (row: any) => {
  try {
    const res = await taskDetailApi(row.uuid);
    const task = res.task || res;
    editForm.value = {
      uuid: task.uuid,
      name: task.name || "",
      target: task.target || "",
      platform: task.platform || 1,
      deadline: task.deadline || "",
      tagIds: task.taskTags ? task.taskTags.map((tag: any) => tag.tagId) : [],
      remark: task.remark || ""
    };
    showEditDialog.value = true;
  } catch (error) {
    console.error("获取任务详情失败", error);
    ElMessage.error("获取任务详情失败");
  }
};

const handleDelete = async (row: any) => {
  try {
    await taskDeleteApi(row.uuid);
    ElMessage.success("任务删除成功");
    loadTasks();
  } catch (error) {
    ElMessage.error("任务删除失败");
    console.error("删除任务出错", error);
  }
};

const handleProgress = (event: any, file: any) => {
  console.log("上传进度", event.percent);
};
const handleSuccess = (response: any, file: any) => {
  console.log("上传成功", response);
};
const handleRemoveFile = (file: any) => {
  const index = uploadFiles.value.indexOf(file);
  if (index !== -1) {
    uploadFiles.value.splice(index, 1);
  }
};
const handleSubmit = async () => {
  try {
    await taskNewApi(taskForm.value);
    ElMessage.success(`任务创建成功`);
    showCreateDialog.value = false;
    loadTasks();
  } catch (error) {
    console.error("任务创建失败", error);
  }
};

// 新增任务更新函数
const handleUpdate = async () => {
  try {
    await taskUpdateApi(editForm.value);
    ElMessage.success("任务更新成功");
    showEditDialog.value = false;
    loadTasks();
  } catch (error) {
    console.error("任务更新失败", error);
    ElMessage.error("任务更新失败");
  }
};

async function loadTasks() {
  const offset = (currentPage.value - 1) * pageSize.value;
  const length = pageSize.value;
  const params: any = {};
  if (platform.value > 0) {
    params.platform = platform.value;
  }
  if (status.value > 0) {
    params.status = status.value;
  }
  if (searchQuery.value) {
    params.name = searchQuery.value;
  }
  if (createTimeRange.value && createTimeRange.value.length === 2) {
    params.createdAt = [createTimeRange.value[0], createTimeRange.value[1]];
  }
  if (selectedTagIds.value && selectedTagIds.value.length > 0) {
    params.tagsId = selectedTagIds.value[0];
  }
  if (createdAtSortOrder.value) {
    params.sortFields = [
      `createdAt ${createdAtSortOrder.value === "ascending" ? "asc" : "desc"}`,
    ];
  }
  try {
    const res = await taskListApi(params, offset, length);
    taskList.value = res.list || [];
    total.value = res.total;
    
    // 数据加载后重新计算行高
    nextTick(() => {
      calculateRowHeight();
    });
  } catch (error) {
    console.error("加载任务列表失败", error);
  }
}

watch(showCreateDialog, (newValue) => {
  if (newValue === true) {
    taskForm.value = {
      name: "",
      target: "",
      platform: 1,
      deadline: "",
      tagIds: [],
      remark: "",
    };
  }
});

watch([currentPage, pageSize], () => {
  loadTasks();
});

watch([platform, status, searchQuery, createTimeRange, selectedTagIds], () => {
  currentPage.value = 1;
  loadTasks();
});

const filteredTaskList = computed(() => {
  return taskList.value;
});

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now();
};

async function loadTags(query = "") {
  tagLoading.value = true;
  try {
    const params: any = { isEnable: 1 };
    if (query) {
      params.name = query;
    }
    const res = await tagListApi(params, 0, 5);
    tagList.value = res.list || [];
  } catch (error) {
    console.error("加载标签列表失败", error);
  } finally {
    tagLoading.value = false;
  }
}

const remoteTagSearch = (query: string) => {
  tagSearchQuery.value = query;
  if (query) {
    loadTags(query);
  } else {
    loadTags();
  }
};

const handleSortChange = (sort: {
  prop: string;
  order: "ascending" | "descending" | null;
}) => {
  if (sort.prop === "createdAt") {
    createdAtSortOrder.value = sort.order;
    currentPage.value = 1;
    loadTasks();
  }
};

onMounted(async () => {
  await Promise.all([loadTasks(), loadTags()]);
  
  // 初始计算行高
  calculateRowHeight();
  
  // 监听窗口大小变化，重新计算行高
  window.addEventListener('resize', calculateRowHeight);
});

defineExpose({
  remoteTagSearch,
  filteredTaskList,
});
</script>
<style>
/* 全局样式 */
.popconfirm-wide {
  min-width: 300px !important;
}

.popconfirm-wide .el-popconfirm__main {
  padding: 15px !important;
  font-size: 15px !important;
}

.popconfirm-wide .el-popconfirm__action {
  margin-top: 14px !important;
}

.popconfirm-wide .el-button {
  padding: 10px 16px !important;
  font-size: 13px !important;
}
</style>

<style scoped>
.el-menu {
  border-right: none;
}

.task-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

/* 表格容器样式，确保占据合适的空间 */
.custom-table {
  margin-bottom: 20px;
  height: calc(100vh - 250px) !important;
}

/* 动态行高表格样式 */
.dynamic-row-height :deep(.el-table__header-row) {
  height: 50px !important; /* 表头高度固定 */
}

.dynamic-row-height :deep(.el-table__cell) {
  padding: 10px 0 !important;
  vertical-align: middle !important;
}
</style>
