<!-- 代码已包含 CSS：使用 TailwindCSS , 安装 TailwindCSS 后方可看到布局样式效果 -->
<template slot-scope="scope">
  <div class="min-h-screen flex flex-col">
    <!-- 顶部导航 -->
    <header class="h-14 flex items-center justify-between px-4 border-b">
      <div class="flex items-center space-x-4">
      </div>
      <div class="flex items-center space-x-4">
        <el-input v-model="searchQuery" placeholder="搜索任务..." class="w-64" :prefix-icon="Search" />
        <el-button type="primary" @click="showCreateDialog = true" class="!rounded-button whitespace-nowrap">
          <el-icon class="mr-1">
            <Plus />
          </el-icon>
          创建任务
        </el-button>
      </div>
    </header>
    <div class="flex-1 overflow-hidden">
      <!-- 主内容区 -->
      <div v-if="!showCreateDialog" class="h-full p-6 overflow-auto">
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <el-select v-model="platform" placeholder="选择平台" class="w-32">
              <el-option label="全部平台" value="" />
              <el-option label="Android" value="android" />
              <el-option label="iOS" value="ios" />
              <el-option label="PC" value="pc" />
            </el-select>
            <el-select v-model="status" placeholder="任务状态" class="w-32">
              <el-option label="全部状态" value="" />
              <el-option label="进行中" value="running" />
              <el-option label="已完成" value="completed" />
              <el-option label="已暂停" value="paused" />
            </el-select>
          </div>
        </div>
        <!-- 任务列表 -->
        <el-table :data="taskList" style="width: 100%" class="custom-table">
          <el-table-column prop="name" label="任务名称" />
          <el-table-column prop="target" label="采集对象" />
          <el-table-column prop="platform" label="平台" width="120">
            <template #default="scope">
              <el-tag :type="getPlatformTagType(scope?.row.platform)">
                {{ scope?.row.platform }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope?.row.status)">
                {{ scope?.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button-group>
                <el-button size="small" type="primary" @click="handleEdit(scope?.row)">
                  <el-icon>
                    <Edit />
                  </el-icon>
                </el-button>
                <el-button size="small" type="danger" @click="handleDelete(scope?.row)">
                  <el-icon>
                    <Delete />
                  </el-icon>
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页 -->
        <div class="mt-4 flex justify-end">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
            :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" />
        </div>
      </div>
      <!-- 创建任务页面 -->
      <div v-else class="h-full p-6 overflow-auto">
      <div class="rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-medium">创建新任务</h2>
          <el-button @click="showCreateDialog = false" class="!rounded-button">返回列表</el-button>
        </div>
        <div class="flex space-x-6">
          <!-- 左侧表单 -->
          <div class="flex-1">
            <el-form ref="formRef" :model="taskForm" label-width="100px">
              <el-form-item label="任务名称" required>
                <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
              </el-form-item>
              <el-form-item label="采集对象" required>
                <el-input v-model="taskForm.target" placeholder="请输入采集对象名称" />
              </el-form-item>
              <el-form-item label="平台" required>
                <el-radio-group v-model="taskForm.platform">
                  <el-radio label="android">Android</el-radio>
                  <el-radio label="ios">iOS</el-radio>
                  <el-radio label="pc">PC</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="标签">
                <el-select v-model="taskForm.tags" multiple placeholder="请选择标签" class="w-full">
                  <el-option label="重要" value="important" />
                  <el-option label="紧急" value="urgent" />
                  <el-option label="常规" value="normal" />
                </el-select>
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="taskForm.remark" type="textarea" :rows="4" placeholder="请输入备注信息" />
              </el-form-item>
            </el-form>
          </div>
          <!-- 右侧上传区 -->
          <div class="flex-1">
            <div class="border-2 border-dashed rounded-lg p-6 text-center">
              <el-upload class="upload-demo" drag multiple :auto-upload="true" :on-progress="handleProgress"
                :on-success="handleSuccess" action="/api/upload">
                <el-icon class="text-4xl mb-2">
                  <Upload />
                </el-icon>
                <div >
                  将文件拖到此处，或<em class="text-primary">点击上传</em>
                </div>
              </el-upload>
              <!-- 上传列表 -->
              <div v-if="uploadFiles.length" class="mt-4">
                <div v-for="file in uploadFiles" :key="file.name"
                  class="flex items-center justify-between p-2  rounded mb-2">
                  <div class="flex items-center">
                    <el-icon class="mr-2">
                      <Document />
                    </el-icon>
                    <span>{{ file.name }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-sm mr-2">{{ file.size }}</span>
                    <el-progress v-if="file.status === 'uploading'" :percentage="file.percentage" :stroke-width="4"
                      class="w-20" />
                    <el-icon v-else-if="file.status === 'success'" class="text-green-500">
                      <Check />
                    </el-icon>
                    <el-button type="danger" size="small" circle @click="handleRemoveFile(file)">
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
          <el-button type="primary" @click="handleSubmit" class="!rounded-button whitespace-nowrap">
            确认创建
          </el-button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>
<script lang="ts" setup>
import { ref, computed } from 'vue';
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
  Check
} from '@element-plus/icons-vue';
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
} from 'element-plus';
const searchQuery = ref('');
const activeMenu = ref('1');
const platform = ref('');
const status = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(100);
const showCreateDialog = ref(false);
const taskForm = ref({
  name: '',
  target: '',
  platform: '',
  tags: [],
  remark: ''
});
const taskList = ref([
  {
    name: '淘宝商品数据采集',
    target: '电商平台',
    platform: 'PC',
    status: '进行中',
    createTime: '2024-01-15 10:30:00'
  },
  {
    name: '抖音视频数据分析',
    target: '短视频平台',
    platform: 'Android',
    status: '已完成',
    createTime: '2024-01-14 15:20:00'
  },
  {
    name: '微信小程序用户行为',
    target: '社交平台',
    platform: 'iOS',
    status: '已暂停',
    createTime: '2024-01-13 09:15:00'
  }
]);
const uploadFiles = ref([
  {
    name: 'data_analysis.xlsx',
    size: '2.5MB',
    status: 'success',
    percentage: 100
  },
  {
    name: 'user_behavior.json',
    size: '1.8MB',
    status: 'uploading',
    percentage: 65
  }
]);
const getPlatformTagType = (platform: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const types: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    'Android': 'success',
    'iOS': 'warning',
    'PC': 'info'
  };
  return types[platform] || 'info';
};
const getStatusTagType = (status: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const types: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    '进行中': 'primary',
    '已完成': 'success',
    '已暂停': 'warning'
  };
  return types[status] || 'info';
};
const handleEdit = (row: any) => {
  console.log('编辑任务', row);
};
const handleDelete = (row: any) => {
  console.log('删除任务', row);
};
const handleProgress = (event: any, file: any) => {
  console.log('上传进度', event.percent);
};
const handleSuccess = (response: any, file: any) => {
  console.log('上传成功', response);
};
const handleRemoveFile = (file: any) => {
  const index = uploadFiles.value.indexOf(file);
  if (index !== -1) {
    uploadFiles.value.splice(index, 1);
  }
};
const handleSubmit = () => {
  console.log('提交表单', taskForm.value);
  showCreateDialog.value = false;
};
</script>
<style scoped>
.el-menu {
  border-right: none;
}

.task-dialog :deep(.el-dialog__body) {
  padding: 20px;
}
</style>
