<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden">
      <!-- 主内容区 -->
      <div class="h-full p-6 overflow-auto">
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- 状态筛选 -->
            <ElSelect v-model="status" placeholder="用户状态" class="w-32">
              <ElOption label="全部状态" :value="0" />
              <ElOption label="正常" :value="1" />
              <ElOption label="注销" :value="2" />
              <ElOption label="禁用" :value="3" />
            </ElSelect>
          </div>
          <div class="flex items-center ml-auto space-x-4">
            <!-- 搜索 -->
            <ElInput
              v-model="searchQuery"
              placeholder="搜索用户昵称/姓名..."
              class="w-64"
              :prefix-icon="Search"
            />
          </div>
        </div>
        <!-- 用户列表 -->
        <ElTable
          ref="tableRef"
          :data="userList"
          style="width: 100%"
          class="custom-table dynamic-row-height"
          @sort-change="handleSortChange"
          :row-style="{ height: rowHeight + 'px' }"
          :header-row-style="{ height: '50px' }"
          v-loading="loading"
        >
          <ElTableColumn prop="userNo" label="用户编号" />
          <ElTableColumn prop="nickname" label="昵称" sortable="custom" />
          <ElTableColumn prop="realname" label="真实姓名" sortable="custom" />
          <ElTableColumn label="头像" width="100">
            <template #default="scope">
              <ElAvatar 
                :size="40" 
                :src="getAvatarUrl(scope.row)" 
                v-if="scope.row.avatar">
                {{ scope.row.nickname?.substring(0, 1) }}
              </ElAvatar>
              <ElAvatar :size="40" v-else>{{ scope.row.nickname?.substring(0, 1) }}</ElAvatar>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="status" label="状态" width="100">
            <template #default="scope">
              <ElTag :type="getStatusTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="lastLoginTime" label="上次登录时间" width="180" sortable="custom" />
          <ElTableColumn prop="lastLoginIp" label="上次登录IP" width="140" />
          <ElTableColumn prop="createdAt" label="创建时间" width="180" sortable="custom" />
          <ElTableColumn label="操作" width="120" fixed="right">
            <template #default="scope">
              <div>
                <ElButton 
                  v-if="scope.row.status === 1" 
                  size="small" 
                  type="danger" 
                  @click="handleStatusChange(scope.row, 3)"
                >
                  禁用
                </ElButton>
                <ElButton 
                  v-if="scope.row.status === 3" 
                  size="small" 
                  type="success" 
                  @click="handleStatusChange(scope.row, 1)"
                >
                  启用
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>
        <!-- 分页 -->
        <div class="mt-4 flex justify-end">
          <ElPagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
    
    <!-- 禁用用户对话框 -->
    <ElDialog
      v-model="disableDialogVisible"
      title="禁用用户"
      width="500px"
    >
      <ElForm :model="disableForm" label-width="100px">
        <ElFormItem label="禁用原因" required>
          <ElInput 
            v-model="disableForm.disableReason" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入禁用原因"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="disableDialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="confirmDisable" :loading="submitting">
            确认
          </ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { 
  ElSelect, 
  ElOption, 
  ElInput, 
  ElTable, 
  ElTableColumn, 
  ElAvatar, 
  ElTag, 
  ElButton, 
  ElPagination, 
  ElDialog, 
  ElForm, 
  ElFormItem,
  ElMessage,
  ElMessageBox
} from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import type { UserList, UserListReq, UserEnableReq } from '#/types/user';
import { getUserList, userEnable } from '#/api/user';
import { ossConfigApi } from '#/api/task/oss';
import type { OssConfigResp } from '#/types/oss';
import { S3Uploader, type S3Config } from '#/utils/s3-upload';

// 表格行高
const rowHeight = 60;

// 搜索和筛选参数
const status = ref<number>(0);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const submitting = ref(false);

// 排序相关
const sortField = ref('');
const sortOrder = ref('');

// 用户列表
const userList = ref<UserList[]>([]);

// S3 相关
const s3Config = ref<S3Config | null>(null);
const s3Uploader = ref<S3Uploader | null>(null);
const avatarUrlMap = reactive(new Map<number, string>());

// 禁用用户相关
const disableDialogVisible = ref(false);
const disableForm = ref<{
  userId: number;
  disableReason: string;
}>({
  userId: 0,
  disableReason: '',
});
const currentUserToDisable = ref<UserList | null>(null);

// 监听筛选条件变化
watch([status, searchQuery], () => {
  currentPage.value = 1;
  fetchUserList();
});

// 生命周期钩子
onMounted(async () => {
  await getOssConfig();
  fetchUserList();
});

// 获取OSS配置
const getOssConfig = async () => {
  try {
    console.log('正在请求OSS配置...');
    const res = await ossConfigApi();
    s3Config.value = res;
    
    // 初始化S3上传器
    if (res) {
      s3Uploader.value = new S3Uploader(res);
      console.log('S3上传器初始化成功');
    }
    
    return res;
  } catch (error) {
    console.error("获取OSS配置失败", error);
    ElMessage.error("获取OSS配置失败");
    return null;
  }
};

// 处理头像URL
const getAvatarUrl = (user: UserList) => {
  if (!user || !user.avatar) return '';
  
  // 如果已经缓存了签名URL，直接返回
  if (avatarUrlMap.has(user.id)) {
    return avatarUrlMap.get(user.id);
  }
  
  // 临时返回原始URL
  const url = user.avatar;
  
  // 异步生成签名URL
  generateSignedUrl(user);
  
  // 临时处理：如果是S3/Minio URL，添加时间戳参数
  if (s3Config.value?.Bucket && url.includes(s3Config.value.Bucket) && 
      !url.includes('X-Amz-Algorithm=') && !url.includes('Expires=')) {
    return `${url}?t=${Date.now()}`;
  }
  
  return url;
};

// 异步生成签名URL
const generateSignedUrl = async (user: UserList) => {
  try {
    if (!user.avatar || !s3Uploader.value || !s3Config.value) return;
    
    // 判断URL是否需要预签名（来自S3/Minio）
    if (s3Config.value.Bucket && user.avatar.includes(s3Config.value.Bucket)) {
      // 生成预签名URL（10分钟有效期）
      const signedUrl = await s3Uploader.value.getPresignedUrl(user.avatar, 10 * 60);
      
      // 缓存签名URL
      avatarUrlMap.set(user.id, signedUrl);
    }
  } catch (error) {
    console.error('生成预签名URL失败:', error);
  }
};

// 状态文本和标签类型
const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    1: '正常',
    2: '注销',
    3: '禁用'
  };
  return statusMap[status] || '未知';
};

const getStatusTagType = (status: number) => {
  const statusMap: Record<number, 'success' | 'info' | 'danger'> = {
    1: 'success',
    2: 'info',
    3: 'danger'
  };
  return statusMap[status] || 'info';
};

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true;
  try {
    const params: UserListReq = {
      pageIndex: currentPage.value,
      pageSize: pageSize.value,
      roleCode: '00101', // 只显示普通用户
    };
    
    // 添加筛选条件
    if (status.value > 0) {
      params.status = status.value as 1 | 2 | 3;
    }
    
    // 添加搜索条件
    if (searchQuery.value) {
      // 根据搜索内容确定搜索昵称还是真实姓名
      params.nickname = searchQuery.value;
      // 也可以同时搜索真实姓名
      // params.realname = searchQuery.value;
    }
    
    // 添加排序
    if (sortField.value && sortOrder.value) {
      params.sortFields = [`${sortField.value} ${sortOrder.value}`];
    }
    
    const res = await getUserList(params);
    userList.value = res.list || [];
    total.value = res.total;
    
    // 清理不再需要的缓存URL
    cleanupAvatarCache();

    // 预处理所有新用户的头像URL
    for (const user of userList.value) {
      if (user.avatar) {
        generateSignedUrl(user);
      }
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 清理不再需要的头像URL缓存
const cleanupAvatarCache = () => {
  const currentUserIds = new Set(userList.value.map(user => user.id));
  
  for (const userId of avatarUrlMap.keys()) {
    if (!currentUserIds.has(userId)) {
      avatarUrlMap.delete(userId);
    }
  }
};

// 处理排序变化
const handleSortChange = (sort: { prop: string; order: string }) => {
  sortField.value = sort.prop;
  // element-plus的排序顺序是ascending和descending，后端需要的是asc和desc
  sortOrder.value = sort.order === 'ascending' ? 'asc' : 
                    sort.order === 'descending' ? 'desc' : '';
  fetchUserList();
};

// 处理分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchUserList();
};

// 处理当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchUserList();
};

// 处理状态变更
const handleStatusChange = (user: UserList, newStatus: 1 | 3) => {
  if (newStatus === 3) {
    // 禁用用户，显示对话框
    currentUserToDisable.value = user;
    disableForm.value.userId = user.id;
    disableForm.value.disableReason = '';
    disableDialogVisible.value = true;
  } else {
    // 启用用户，直接确认
    ElMessageBox.confirm(
      `确定要启用用户 "${user.nickname}" 吗？`,
      '启用用户',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        changeUserStatus(user.id, newStatus);
      })
      .catch(() => {
        // 用户取消操作
      });
  }
};

// 确认禁用
const confirmDisable = async () => {
  if (!disableForm.value.disableReason.trim()) {
    ElMessage.warning('请输入禁用原因');
    return;
  }
  
  if (!currentUserToDisable.value) return;
  
  disableDialogVisible.value = false;
  changeUserStatus(disableForm.value.userId, 3, disableForm.value.disableReason);
};

// 修改用户状态
const changeUserStatus = async (userId: number, status: 1 | 3, disableReason?: string) => {
  submitting.value = true;
  try {
    const params: UserEnableReq = {
      userId,
      status,
      roleCode: '00101',
    };
    
    if (status === 3 && disableReason) {
      params.disableReason = disableReason;
    }
    
    await userEnable(params);
    ElMessage.success(status === 1 ? '用户已启用' : '用户已禁用');
    fetchUserList();
  } catch (error) {
    console.error('操作失败:', error);
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
/* 支持暗黑模式 */
:deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-tr-bg-color: var(--el-bg-color);
  --el-table-border-color: var(--el-border-color-lighter);
}

.custom-table :deep(.el-table__row) {
  transition: all 0.3s;
}

/* 表格样式 */
.dynamic-row-height {
  font-size: 14px;
}

/* 弹窗样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
