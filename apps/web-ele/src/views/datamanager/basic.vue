<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden">
      <!-- 主内容区 -->
      <div class="h-full p-6 overflow-auto">
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- 筛选条件 -->
            <el-select v-model="fileType" placeholder="文件类型" class="w-32">
              <el-option label="全部类型" :value="''" />
              <el-option v-for="type in fileTypes" :key="type" :label="type" :value="type" />
            </el-select>
            <el-select v-model="status" placeholder="文件状态" class="w-32">
              <el-option label="全部状态" :value="0" />
              <el-option label="待处理" :value="1" />
              <el-option label="正在处理" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="解析失败" :value="4" />
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
            <!-- 搜索和上传按钮 -->
            <el-input
              v-model="searchQuery"
              placeholder="搜索文件..."
              class="w-64"
              :prefix-icon="Search"
            />
            <el-button
              type="primary"
              @click="handleUpload"
              class="rounded-button whitespace-nowrap"
            >
              <el-icon class="mr-1">
                <Upload />
              </el-icon>
              上传文件
            </el-button>
          </div>
        </div>
        
        <!-- 文件列表 -->
        <el-table
          ref="tableRef"
          :data="fileList"
          style="width: 100%"
          class="custom-table dynamic-row-height"
          @sort-change="handleSortChange"
          v-loading="tableLoading"
          :row-style="{ height: rowHeight + 'px' }"
          :header-row-style="{ height: '50px' }"
        >
          <el-table-column prop="name" label="文件名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="fileType" label="文件类型" width="100">
            <template #default="scope">
              <el-tag :type="getFileTypeTagType(scope.row.fileType)">
                {{ scope.row.fileType || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="文件大小" width="100">
            <template #default="scope">
              {{ formatFileSize(scope.row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusDisplay(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="200" sortable="custom">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) || '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button-group>
                <el-button size="small" type="primary" @click="handleDetail(scope.row)">
                  <el-icon>
                    <InfoFilled />
                  </el-icon>
                </el-button>
                <el-button size="small" type="success" @click="handleDownload(scope.row)">
                  <el-icon>
                    <Download />
                  </el-icon>
                </el-button>
                <el-popconfirm
                  title="确定删除此文件吗？"
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
    </div>
    
    <!-- 文件详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="文件详情"
      width="600px"
      destroy-on-close
    >
      <div v-if="selectedFile" class="file-detail">
        <div class="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div class="mb-2 flex">
            <div class="font-bold w-24">文件名称:</div>
            <div>{{ selectedFile.name }}</div>
          </div>
          <div class="mb-2 flex">
            <div class="font-bold w-24">文件类型:</div>
            <div>{{ selectedFile.fileType }}</div>
          </div>
          <div class="mb-2 flex">
            <div class="font-bold w-24">文件大小:</div>
            <div>{{ formatFileSize(selectedFile.size) }}</div>
          </div>
          <div class="mb-2 flex">
            <div class="font-bold w-24">文件状态:</div>
            <div>
              <el-tag :type="getStatusTagType(selectedFile.status)">
                {{ getStatusDisplay(selectedFile.status) }}
              </el-tag>
            </div>
          </div>
          <div class="mb-2 flex">
            <div class="font-bold w-24">创建时间:</div>
            <div>{{ selectedFile.createdAt }}</div>
          </div>
          <div class="mb-2 flex">
            <div class="font-bold w-24">更新时间:</div>
            <div>{{ selectedFile.updatedAt }}</div>
          </div>
          <div class="mb-2 flex">
            <div class="font-bold w-24">存储UUID:</div>
            <div>{{ selectedFile.storageUuid }}</div>
          </div>
          <div class="mb-2 flex">
            <div class="font-bold w-24">文件UUID:</div>
            <div>{{ selectedFile.uuid }}</div>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button type="primary" @click="handleDownload(selectedFile)">下载文件</el-button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 上传文件对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传文件"
      width="600px"
      destroy-on-close
    >
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
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false">取消</el-button>
          <el-button type="primary" @click="showUploadDialog = false">
            完成
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, nextTick } from "vue";
import {
  ElButton,
  ElButtonGroup,
  ElTable,
  ElTableColumn,
  ElTag,
  ElSelect,
  ElOption,
  ElInput,
  ElIcon,
  ElDatePicker,
  ElPagination,
  ElDialog,
  ElPopconfirm,
  ElUpload,
  ElProgress
} from 'element-plus'
import {
  Search,
  Upload,
  Download,
  Delete,
  InfoFilled,
  Document,
  Check,
  Warning,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { ossConfigApi } from "#/api/task/oss";
import { S3Uploader, type S3Config } from "#/utils/s3-upload";
import type { File as FileType, FileListReq, FileNewReq } from "#/types/file";
import type { OssConfigResp } from "#/types/oss";
import { fileListApi, fileDetailApi, fileDeleteApi, fileNewApi } from "#/api/task/file";
import { ossUrlSignApi } from "#/api/task/ossSign";
// 列表筛选和分页相关变量
const fileList = ref<FileType[]>([]);
const searchQuery = ref("");
const fileType = ref("");
const status = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const createTimeRange = ref<[string, string] | undefined>(undefined);
const tableLoading = ref(false);
const createdAtSortOrder = ref<string | null>(null);
const tableRef = ref(null);

// 文件详情相关变量
const showDetailDialog = ref(false);
const selectedFile = ref<FileType | null>(null);

// 文件上传相关变量
const showUploadDialog = ref(false);
const uploadRef = ref();
const uploadFiles = ref<any[]>([]);
const s3Config = ref<S3Config | null>(null);
const uploadLoading = ref(false);
const isUploading = ref(false);
const s3UploaderInstance = ref<S3Uploader | null>(null);

// 常量定义
const fileTypes = ref<string[]>([
  "har", "pcapng", "pcap"
]);

// 添加rowHeight变量
const rowHeight = ref(50);

// 添加计算行高的方法
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
    
    // 每行高度 = 内容区域高度 / 10行（或当前页面大小）
    const calculatedRowHeight = Math.max(50, Math.floor(contentHeight / Math.min(pageSize.value, 10)));
    
    rowHeight.value = calculatedRowHeight;
    
    // 确保样式更新
    const rows = document.querySelectorAll('.custom-table .el-table__row');
    rows.forEach(row => {
      (row as HTMLElement).style.height = `${calculatedRowHeight}px`;
    });
  });
};

// 状态显示文字
const getStatusDisplay = (status?: number) => {
  switch (status) {
    case 1:
      return "待处理";
    case 2:
      return "正在处理";
    case 3:
      return "已完成";
    case 4:
      return "解析失败";
    default:
      return "未知";
  }
};

// 状态标签类型
const getStatusTagType = (status?: number) => {
  switch (status) {
    case 1:
      return "info";
    case 2:
      return "warning";
    case 3:
      return "success";
    case 4:
      return "danger";
    default:
      return "info";
  }
};

// 文件类型标签样式
const getFileTypeTagType = (fileType?: string) => {
  if (!fileType) return "info";
  
  const type = fileType.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp"].includes(type)) {
    return "success";
  } else if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(type)) {
    return "primary";
  } else if (["zip", "rar", "7z", "tar", "gz"].includes(type)) {
    return "warning";
  } else if (["mp3", "wav", "mp4", "avi", "mov", "flv"].includes(type)) {
    return "danger";
  } else {
    return "info";
  }
};

// 格式化文件大小
const formatFileSize = (size?: number) => {
  if (!size) return "0B";
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

// 加载文件列表
const loadFiles = async () => {
  tableLoading.value = true;
  const offset = (currentPage.value - 1) * pageSize.value;
  const length = pageSize.value;
  
  // 初始化必填参数
  const params: FileListReq = {
    storageUuid: s3Config.value?.StorageUuid || ""
  };
  
  if (fileType.value) {
    params.fileType = fileType.value;
  }
  if (status.value > 0) {
    params.status = status.value;
  }
  if (searchQuery.value) {
    params.name = searchQuery.value;
  }
  if (createTimeRange.value && createTimeRange.value.length === 2) {
    // 时间范围在后端API中不支持，可以在前端做筛选
  }
  if (createdAtSortOrder.value) {
    params.sortFields = [
      `createdAt ${createdAtSortOrder.value === "ascending" ? "asc" : "desc"}`,
    ];
  }
  
  try {
    // 如果没有存储配置UUID，需要先获取
    if (!params.storageUuid) {
      await getOssConfig();
      if (s3Config.value?.StorageUuid) {
        params.storageUuid = s3Config.value.StorageUuid;
      } else {
        ElMessage.error("获取存储配置失败，无法加载文件列表");
        tableLoading.value = false;
        return;
      }
    }
    
    const res = await fileListApi(params, offset, length);
    fileList.value = res.list || [];
    total.value = res.total;
    
    // 数据加载后重新计算行高
    nextTick(() => {
      calculateRowHeight();
    });
  } catch (error) {
    console.error("加载文件列表失败", error);
    ElMessage.error("加载文件列表失败");
  } finally {
    tableLoading.value = false;
  }
};

// 查看文件详情
const handleDetail = async (row: FileType) => {
  try {
    const res = await fileDetailApi(row.uuid);
    selectedFile.value = (res.file || res) as FileType;
    showDetailDialog.value = true;
  } catch (error) {
    console.error("获取文件详情失败", error);
    ElMessage.error("获取文件详情失败");
  }
};

// 下载文件
const handleDownload = async (row: FileType) => {
  try {
    if (!row.url) {
      ElMessage.warning("文件地址不存在");
      return;
    }
    
    // 获取签名后的URL
    const res = await ossUrlSignApi({ url: row.url });
    const signedUrl = res.url;
    
    if (!signedUrl) {
      ElMessage.error("获取下载链接失败");
      return;
    }
    
    // 创建临时链接并触发下载
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = row.name || '未命名文件';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success("下载已开始");
  } catch (error) {
    console.error("下载文件失败", error);
    ElMessage.error("下载文件失败");
  }
};

// 删除文件
const handleDelete = async (row: FileType) => {
  try {
    await fileDeleteApi(row.uuid);
    ElMessage.success("文件删除成功");
    loadFiles();
  } catch (error) {
    console.error("删除文件失败", error);
    ElMessage.error("删除文件失败");
  }
};

// 打开上传对话框
const handleUpload = async () => {
  showUploadDialog.value = true;
  uploadFiles.value = [];
  
  // 获取OSS配置
  await getOssConfig();
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
      s3UploaderInstance.value = new S3Uploader(res);
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
  if (!s3UploaderInstance.value || isUploading.value) return;
  
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
        const result = await s3UploaderInstance.value.uploadFile(file.rawFile, (progress: number) => {
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
          // 更新状态为成功
          file.status = 'success';
          file.percentage = 100;
          ElMessage.success(`文件 ${file.name} 上传成功`);
        }
      } catch (err) {
        console.error('文件上传失败:', err);
        file.status = 'error';
        ElMessage.error(`文件 ${file.name} 上传失败`);
      }
    }
    
    // 上传完成后刷新文件列表
    await loadFiles();
  } finally {
    isUploading.value = false;
  }
};

// 排序事件处理
const handleSortChange = (sort: {
  prop: string;
  order: "ascending" | "descending" | null;
}) => {
  if (sort.prop === "createdAt") {
    createdAtSortOrder.value = sort.order;
    currentPage.value = 1;
    loadFiles();
  }
};

// 监听筛选条件变化
watch([fileType, status, searchQuery, createTimeRange], () => {
  currentPage.value = 1;
  loadFiles();
});

// 监听分页变化
watch([currentPage, pageSize], () => {
  loadFiles();
});

// 页面加载时执行
onMounted(async () => {
  // 确保先获取存储配置再加载文件列表
  await getOssConfig();
  await loadFiles();
  
  // 初始计算行高
  calculateRowHeight();
  
  // 监听窗口大小变化，重新计算行高
  window.addEventListener('resize', calculateRowHeight);
});

// 格式化日期时间
const formatDateTime = (dateTimeStr?: string) => {
  if (!dateTimeStr) return '';
  
  try {
    const date = new Date(dateTimeStr);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateTimeStr;
    }
    
    // 格式化为 YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('日期格式化错误', error);
    return dateTimeStr;
  }
};
</script>

<style scoped>
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

.dynamic-row-height :deep(.el-table__row) {
  transition: height 0.3s ease;
}

/* 适配暗黑模式的样式 */
:deep(.el-dialog) {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.file-detail {
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

.dark .file-detail {
  background-color: var(--el-bg-color-overlay);
}

/* 上传区域样式 */
:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
}

/* 弹框宽样式 */
:deep(.popconfirm-wide) {
  min-width: 300px !important;
}

:deep(.popconfirm-wide .el-popconfirm__main) {
  padding: 15px !important;
  font-size: 15px !important;
}

:deep(.popconfirm-wide .el-popconfirm__action) {
  margin-top: 14px !important;
}

:deep(.popconfirm-wide .el-button) {
  padding: 10px 16px !important;
  font-size: 13px !important;
}
</style>
