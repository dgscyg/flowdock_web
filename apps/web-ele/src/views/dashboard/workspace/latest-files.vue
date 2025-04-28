<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { fileListApi } from "#/api/task/file";
import { useRouter } from 'vue-router';
import type { File } from "#/types/file";
import { ossConfigApi } from "#/api/task/oss";

// 组件属性
interface Props {
  title: string;
}

defineOptions({
  name: 'LatestFiles',
});

const props = withDefaults(defineProps<Props>(), {
  title: '最新文件'
});

// 最新文件数据
const latestFiles = ref<File[]>([]);
const loading = ref(false);
const router = useRouter();
const storageUuid = ref<string | null>(null);

// 获取最新的文件列表
async function fetchLatestFiles() {
  try {
    loading.value = true;
    
    // 先获取OSS配置，确保有StorageUuid
    if (!storageUuid.value) {
      try {
        const config = await ossConfigApi();
        storageUuid.value = config?.StorageUuid || null;
      } catch (error) {
        console.error("获取OSS配置失败:", error);
      }
    }
    
    if (!storageUuid.value) {
      console.warn('未获取到StorageUuid，可能导致文件列表为空');
    }
    
    // 设置请求参数，按创建时间降序排序，并加入StorageUuid参数
    const params: any = {
      sortFields: ["createdAt desc"]
    };
    
    // 只有在storageUuid有值时才添加到参数中
    if (storageUuid.value) {
      params.storageUuid = storageUuid.value;
    }
    
    // 调用文件列表API，获取前5条记录
    const response = await fileListApi(params, 0, 5);
    
    if (response && response.list && response.list.length > 0) {
      latestFiles.value = response.list;
    }
  } catch (error) {
    console.error("获取最新文件失败:", error);
  } finally {
    loading.value = false;
  }
}

// 跳转到文件详情页
function goToFileDetail(fileUuid: string) {
  router.push(`/file?uuid=${fileUuid}`);
}

// 格式化文件大小
function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

// 获取文件图标
function getFileIcon(fileType: string): string {
  const type = fileType?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(type)) {
    return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
  } else if (['doc', 'docx', 'txt', 'pdf'].includes(type)) {
    return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  } else if (['xls', 'xlsx', 'csv'].includes(type)) {
    return 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z';
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
    return 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4';
  } else {
    return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  }
}

// 页面加载时获取最新文件
onMounted(() => {
  fetchLatestFiles();
});
</script>

<template>
  <div class="bg-card border border-border rounded-lg shadow">
    <div class="px-4 py-4 border-b border-border">
      <h3 class="text-lg font-medium text-foreground">{{ title }}</h3>
    </div>
    <div class="p-5">
      <div v-if="loading" class="w-full flex justify-center py-5">
        <div class="loading-spinner"></div>
      </div>
      <div v-else-if="latestFiles.length === 0" class="w-full text-center py-5 text-muted-foreground">
        暂无文件数据
      </div>
      <ul v-else class="divide-y divide-border" role="list">
        <li
          v-for="file in latestFiles"
          :key="file.uuid"
          class="flex justify-between gap-x-6 py-5 cursor-pointer hover:bg-muted/40 transition-colors"
          @click="goToFileDetail(file.uuid)"
        >
          <div class="flex min-w-0 items-center gap-x-4">
            <div class="flex-none rounded-full bg-muted p-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getFileIcon(file.fileType || '')" />
              </svg>
            </div>
            <div class="min-w-0 flex-auto">
              <p class="text-sm font-semibold text-foreground">
                {{ file.name }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                <span class="mr-2">类型: {{ file.fileType }}</span>
                <span class="mr-2">大小: {{ formatFileSize(file.size || 0) }}</span>
              </p>
            </div>
          </div>
          <div class="hidden h-full shrink-0 sm:flex sm:flex-col sm:items-end">
            <span class="text-xs text-muted-foreground">
              {{ file.createdAt }}
            </span>
            <a 
              v-if="file.url" 
              :href="file.url" 
              target="_blank" 
              class="mt-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900"
              @click.stop
            >
              查看
            </a>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.loading-spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 3px solid #3498db;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 
