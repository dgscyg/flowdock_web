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
              <el-option label="解析失败" :value="5" />
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
              class="rounded-button whitespace-nowrap"
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
                <template v-if="scope.row.taskTags && scope.row.taskTags.length > 0">
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
                </template>
                <el-tag v-else type="info" class="mr-2 mb-1">-</el-tag>
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
            <el-button @click="showCreateDialog = false" class="rounded-button"
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
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  :before-remove="handleRemoveFile"
                  :disabled="uploadLoading || !s3Config"
                  ref="uploadRef"
                >
                  <el-icon class="text-4xl mb-2">
                    <Upload />
                  </el-icon>
                  <div v-if="uploadLoading">正在加载上传配置...</div>
                  <div v-else>将文件拖到此处，或<em class="text-primary">点击上传</em></div>
                </el-upload>
                <!-- 上传列表 -->
                <div v-if="uploadFiles.length" class="mt-4">
                  <div
                    v-for="file in uploadFiles"
                    :key="file.uid"
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
                      <el-icon v-else-if="file.status === 'error'" class="text-red-500">
                        <Warning />
                      </el-icon>
                      <el-button
                        type="danger"
                        size="small"
                        circle
                        @click="handleRemoveUploadFile(file)"
                      >
                        <el-icon>
                          <Delete />
                        </el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
                <div class="mt-4" v-if="uploadFiles.some(f => f.status === 'waiting')">
                  <el-button type="primary" @click="uploadAllFiles" :loading="isUploading">
                    开始上传
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end mt-6">
            <el-button @click="showCreateDialog = false" class="mr-4">取消</el-button>
            <el-button
              type="primary"
              @click="handleSubmit"
              :loading="isSubmitting"
              class="rounded-button whitespace-nowrap"
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
            <el-button @click="showEditDialog = false" class="rounded-button">返回列表</el-button>
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
            <el-button
              type="primary"
              @click="handleUpdate"
              :loading="isSubmitting"
              class="rounded-button whitespace-nowrap"
            >
              确认更新
            </el-button>
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
  Warning,
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
import { ossConfigApi } from "../../api/task/oss";
import { fileNewApi } from "../../api/task/file";
import { S3Uploader, type S3Config } from "../../utils/s3-upload";
import type { Task } from "#/types/task";
import type { Tag } from "#/types/tag";
import type { FileNewReq } from "#/types/file";
import type { OssConfigResp } from "#/types/oss";
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
  fileIds: [] as number[],
  remark: "",
});
const createTimeRange = ref<[Date, Date]>();
const selectedTagIds = ref<number[]>([]);
const taskList = ref<Task[]>([]);
const uploadFiles = ref<any[]>([]);
const s3Config = ref<S3Config | null>(null);
const tagList = ref<Tag[]>([]);
const tagLoading = ref(false);
const tagSearchQuery = ref("");
const createdAtSortOrder = ref<string | null>(null);
const tableRef = ref(null);
const rowHeight = ref(0);
const uploadLoading = ref(false);

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

const uploadRef = ref();
const s3Uploader = ref<S3Uploader | null>(null);
const isUploading = ref(false);
const isSubmitting = ref(false);

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

// 文件选择事件处理
const handleFileChange = (file: any) => {
  // 如果文件已经在列表中，不重复添加
  if (uploadFiles.value.some(f => f.uid === file.uid)) {
    return;
  }
  
  // 添加文件到上传列表，初始状态为等待上传
  uploadFiles.value.push({
    uid: file.uid,
    rawFile: file.raw, // 保存原始文件对象
    name: file.name,
    size: formatFileSize(file.size),
    status: 'waiting',
    percentage: 0
  });
};

// 移除上传列表中的文件
const handleRemoveUploadFile = (file: any) => {
  const index = uploadFiles.value.findIndex(item => item.uid === file.uid);
  if (index !== -1) {
    // 如果有fileId，从任务表单中移除
    if (uploadFiles.value[index].fileId) {
      const idIndex = taskForm.value.fileIds.indexOf(uploadFiles.value[index].fileId);
      if (idIndex !== -1) {
        taskForm.value.fileIds.splice(idIndex, 1);
      }
    }
    uploadFiles.value.splice(index, 1);
  }
};

// el-upload的before-remove钩子
const handleRemoveFile = (file: any) => {
  handleRemoveUploadFile(file);
  // 返回true表示允许删除
  return true;
};

// 上传所有等待中的文件
const uploadAllFiles = async () => {
  if (!s3Uploader.value || isUploading.value) return;
  
  isUploading.value = true;
  
  try {
    // 获取所有等待上传的文件
    const waitingFiles = uploadFiles.value.filter(f => f.status === 'waiting');
    
    for (const file of waitingFiles) {
      try {
        // 更新状态为上传中
        file.status = 'uploading';
        file.percentage = 0;
        
        // 上传文件到S3
        const result = await s3Uploader.value.uploadFile(file.rawFile, (progress) => {
          file.percentage = progress;
        });
        
        // 上传成功后，将文件信息保存到后端
        const fileReq: FileNewReq = {
          name: file.rawFile.name,
          path: result.key,
          size: file.rawFile.size,
          fileType: file.rawFile.name.split('.').pop() || '',
          url: result.url,
          storageUuid: s3Config.value?.StorageUuid
        };
        
        // 调用文件创建API
        const fileRes = await fileNewApi(fileReq);
        if (fileRes && fileRes.id) {
          // 添加到任务表单的fileIds中
          file.fileId = fileRes.id;
          if (!taskForm.value.fileIds.includes(fileRes.id)) {
            taskForm.value.fileIds.push(fileRes.id);
          }
          
          // 更新状态为成功
          file.status = 'success';
          file.percentage = 100;
        }
      } catch (err) {
        console.error('文件上传失败:', err);
        file.status = 'error';
        ElMessage.error(`文件 ${file.name} 上传失败`);
      }
    }
  } finally {
    isUploading.value = false;
  }
};

// 获取OSS配置
const getOssConfig = async () => {
  try {
    uploadLoading.value = true;
    console.log('正在请求OSS配置...');
    const res = await ossConfigApi();
    s3Config.value = res;
    
    // 添加日志，检查配置是否正确
    console.log('获取到的OSS配置:', {
      Endpoint: res.Endpoint,
      Bucket: res.Bucket,
      Region: res.Region,
      Path: res.Path,
      // 不输出敏感信息
      hasAccessKey: !!res.AccessKeyId,
      hasAccessSecret: !!res.AccessKeySecret
    });
    
    // 确保必要的配置存在
    if (!res.Bucket) {
      ElMessage.warning('OSS配置不完整: 缺少Bucket信息');
    }
    
    // 初始化S3上传器
    if (res) {
      s3Uploader.value = new S3Uploader(res);
    }
    
    uploadLoading.value = false;
    return res;
  } catch (error) {
    console.error("获取OSS配置失败", error);
    ElMessage.error("获取OSS配置失败");
    uploadLoading.value = false;
    return null;
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;
  try {
    // 确保fileIds已经添加到表单中
    await taskNewApi(taskForm.value);
    ElMessage.success(`任务创建成功`);
    showCreateDialog.value = false;
    loadTasks();
  } catch (error) {
    console.error("任务创建失败", error);
    ElMessage.error("任务创建失败");
  } finally {
    isSubmitting.value = false;
  }
};

// 新增任务更新函数
const handleUpdate = async () => {
  if (isSubmitting.value) return; // 防止重复提交
  
  isSubmitting.value = true;
  try {
    await taskUpdateApi(editForm.value);
    ElMessage.success("任务更新成功");
    showEditDialog.value = false;
    loadTasks();
  } catch (error) {
    console.error("任务更新失败", error);
    ElMessage.error("任务更新失败");
  } finally {
    isSubmitting.value = false; // 重置提交状态
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

watch(showCreateDialog, async (newValue) => {
  if (newValue === true) {
    taskForm.value = {
      name: "",
      target: "",
      platform: 1,
      deadline: "",
      tagIds: [],
      fileIds: [],
      remark: "",
    };
    uploadFiles.value = [];
    
    // 获取OSS配置
    await getOssConfig();
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

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + 'B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + 'KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + 'MB';
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + 'GB';
  }
};
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
