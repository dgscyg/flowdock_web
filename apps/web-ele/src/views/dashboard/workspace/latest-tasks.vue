<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { taskListApi } from "#/api/task/task";
import { getPlatformDisplay, getStatusDisplay } from "#/types/task";
import type { Task } from "#/types/task";
import { useRouter } from 'vue-router';

// 组件属性
interface Props {
  title: string;
}

defineOptions({
  name: 'LatestTasks',
});

const props = withDefaults(defineProps<Props>(), {
  title: '最新任务'
});

// 最新任务数据
const latestTasks = ref<Task[]>([]);
const loading = ref(false);
const router = useRouter();

// 获取最新的任务列表
async function fetchLatestTasks() {
  try {
    loading.value = true;
    
    // 设置请求参数，按创建时间降序排序
    const params = {
      sortFields: ["createdAt desc"]
    };
    
    // 调用任务列表API，获取前5条记录
    const response = await taskListApi(params, 0, 5);
    
    if (response && response.list && response.list.length > 0) {
      latestTasks.value = response.list;
    }
  } catch (error) {
    console.error("获取最新任务失败:", error);
  } finally {
    loading.value = false;
  }
}

// 跳转到任务详情页
function goToTaskDetail(taskUuid: string) {
  router.push(`/task?uuid=${taskUuid}`);
}

// 页面加载时获取最新任务
onMounted(() => {
  fetchLatestTasks();
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
      <div v-else-if="latestTasks.length === 0" class="w-full text-center py-5 text-muted-foreground">
        暂无任务数据
      </div>
      <ul v-else class="divide-y divide-border" role="list">
        <li
          v-for="task in latestTasks"
          :key="task.uuid"
          class="flex justify-between gap-x-6 py-5 cursor-pointer hover:bg-muted/40 transition-colors"
          @click="goToTaskDetail(task.uuid)"
        >
          <div class="flex min-w-0 items-center gap-x-4">
            <div class="flex-none rounded-full bg-muted p-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div class="min-w-0 flex-auto">
              <p class="text-sm font-semibold text-foreground">
                {{ task.name }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                <span class="mr-2">采集对象: {{ task.target }}</span>
                <span class="mr-2">平台: {{ getPlatformDisplay(task.platform || 0) }}</span>
                <span v-if="task.taskTags && task.taskTags.length > 0 && task.taskTags[0]" class="text-primary">
                  标签: {{ task.taskTags[0].tagName }}
                </span>
              </p>
            </div>
          </div>
          <div class="hidden h-full shrink-0 sm:flex sm:flex-col sm:items-end">
            <span class="text-xs text-muted-foreground">
              {{ task.createdAt }}
            </span>
            <span :class="`mt-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
              task.status === 1 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 
              task.status === 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' : 
              task.status === 3 ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 
              task.status === 4 ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`">
              {{ getStatusDisplay(task.status || 0) }}
            </span>
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
