<template>
  <div class="storage-page">
    <!-- 数据存储源区域 -->
    <el-card class="section-card">
      <template #header>
        <div class="header-with-filter">
          <span>数据存储源</span>
          <div class="filter-area">
            <el-input
              v-model="filterParams.remark"
              placeholder="搜索配置名称"
              clearable
              @clear="handleFilterChange"
              @input="handleFilterChange"
              class="filter-input"
            >
              <template #prefix>
                <el-icon class="el-input__icon"><Search /></el-icon>
              </template>
            </el-input>
            <el-select 
              v-model="filterParams.status" 
              placeholder="状态筛选" 
              clearable
              @change="handleFilterChange"
              class="filter-select"
            >
              <el-option :value="1" label="已启用"></el-option>
              <el-option :value="0" label="未启用"></el-option>
            </el-select>
            <el-button type="primary" size="small" @click="openDialog('new')">新建OSS配置</el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20" v-loading="loading">
        <!-- 判断是否有搜索/筛选条件 -->
        <template v-if="isFiltering">
          <!-- 搜索/筛选后无结果时显示提示信息 -->
          <el-col :span="24" v-if="ossConfigs.length === 0">
            <el-empty description="未找到匹配的OSS配置" :image-size="120">
              <el-button type="primary" @click="resetFilters">重置筛选</el-button>
            </el-empty>
          </el-col>
        </template>
        
        <!-- 未配置OSS且没有搜索/筛选条件时显示默认卡片 -->
        <el-col :span="12" v-else-if="ossConfigs.length === 0">
          <div class="clickable-card" @click="openDialog('new')">
            <el-card class="storage-source-card" shadow="hover">
              <template #header>
                <span>默认OSS配置</span>
              </template>
              <div class="card-content">
                <span class="card-label">状态：</span>
                <el-tag type="info">未设置</el-tag>
              </div>
            </el-card>
          </div>
        </el-col>
        
        <!-- OSS配置卡片列表 -->
        <el-col :span="12" v-for="(config, index) in ossConfigs" :key="config.uuid">
          <div class="clickable-card" 
               @click="openDialog('edit', index)"
               @mouseenter="hoveredIndex = index"
               @mouseleave="hoveredIndex = -1">
            <el-card class="storage-source-card" shadow="hover">
              <template #header>
                <div class="header-with-actions">
                  <span class="config-name">{{ config.remark || '未命名配置' }}</span>
                  <el-button 
                    type="danger" 
                    size="small" 
                    class="delete-button"
                    @click.stop="deleteConfig(index)"
                    v-show="hoveredIndex === index">删除</el-button>
                </div>
              </template>
              <div class="card-content">
                <span class="card-label">状态：</span>
                <el-tag :type="config.isEnable === 1 ? 'success' : 'info'">
                  {{ config.isEnable === 1 ? '已启用' : '未启用' }}
                </el-tag>
              </div>
              <div class="card-content">
                <span class="card-label">Endpoint：</span>
                <span>{{ config.endpoint }}</span>
              </div>
              <div class="card-content">
                <span class="card-label">Bucket：</span>
                <span>{{ config.bucket }}</span>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据操作区域 -->
    <el-card class="section-card" style="margin-top:20px;">
      <template #header>
        <span>数据操作</span>
      </template>
      <el-form :model="operation" label-width="150px" v-loading="configLoading">
        <el-form-item label="数据源存储位置">
          <el-autocomplete
            v-model="operation.storageLabel"
            :fetch-suggestions="queryStorageOptions"
            placeholder="请选择或输入数据源存储"
            class="storage-autocomplete"
            popper-class="storage-suggestions"
            @select="handleStorageSelected"
            @change="handleStorageChange"
            :trigger-on-focus="true"
          >
            <template #default="{ item }">
              <div class="storage-option">
                {{ item.value }}
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>
        <el-form-item label="备份存储位置">
          <el-input 
            v-model="operation.backupPath" 
            placeholder="请输入备份存储路径"
            @change="handleBackupPathChange"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfigs" :loading="savingConfig">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- OSS配置对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="120px">
        <el-form-item label="配置名称" prop="remark">
          <el-input v-model="dialogForm.remark" placeholder="请输入配置名称"></el-input>
        </el-form-item>
        <el-form-item label="Endpoint" prop="endpoint">
          <el-input v-model="dialogForm.endpoint" placeholder="例如: https://oss-cn-beijing.aliyuncs.com"></el-input>
        </el-form-item>
        <el-form-item label="Access Key" prop="accessKeyId">
          <el-input v-model="dialogForm.accessKeyId"></el-input>
        </el-form-item>
        <el-form-item label="Secret Key" prop="accessKeySecret">
          <el-input v-model="dialogForm.accessKeySecret" type="password"></el-input>
        </el-form-item>
        <el-form-item label="Bucket" prop="bucket">
          <el-input v-model="dialogForm.bucket"></el-input>
        </el-form-item>
        <el-form-item label="区域" prop="region">
          <el-input v-model="dialogForm.region" placeholder="例如: cn-beijing"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="dialogForm.isEnable"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDialog">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue';
import {
  ElMessage,
  ElMessageBox,
  ElCard,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElButton,
  ElRow,
  ElCol,
  ElInput,
  ElDialog,
  ElTag,
  ElSwitch,
  ElIcon,
  ElEmpty,
  ElAutocomplete,
} from "element-plus";
import { Search } from '@element-plus/icons-vue';
import { 
  storageListApi, 
  storageNewApi, 
  storageDeleteApi, 
  storageUpdateApi 
} from '#/api/system/storage';
// 导入配置API
import {
  configDetailApi,
  configUpdateApi,
} from '#/api/system/sys_config';

import type { S3Storage } from '#/types/storage';
import type { FormInstance } from 'element-plus';

// OSS配置列表
const ossConfigs = ref<S3Storage[]>([]);
const loading = ref(false);
const configLoading = ref(false);
const savingConfig = ref(false);

// 分页参数
const pageParams = reactive({
  offset: 0,
  length: 20
});

// 筛选参数
const filterParams = reactive({
  remark: '',
  status: '' as '' | 0 | 1
});

const operation = reactive({
  storageUuid: '',  // 存储实际的UUID值
  storageLabel: '', // 显示给用户的标签
  backupPath: '',
});

// 记录当前鼠标悬停的卡片索引
const hoveredIndex = ref(-1);

const dialogVisible = ref(false);
const currentDialog = ref('');
const editingIndex = ref(-1);
const dialogForm = reactive({
  uuid: '',
  endpoint: '',
  accessKeyId: '',
  accessKeySecret: '',
  bucket: '',
  region: '',
  remark: '',
  isEnable: 1,
});
const dialogTitle = ref('');

// 表单引用
const dialogFormRef = ref<FormInstance | null>(null);
const dialogRules = reactive({
  remark: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
  endpoint: [{ required: true, message: 'Endpoint不能为空', trigger: 'blur' }],
  accessKeyId: [{ required: true, message: 'Access Key不能为空', trigger: 'blur' }],
  accessKeySecret: [{ required: true, message: 'Secret Key不能为空', trigger: 'blur' }],
  bucket: [{ required: true, message: 'Bucket不能为空', trigger: 'blur' }],
  region: [{ required: true, message: '区域不能为空', trigger: 'blur' }],
});

// 处理筛选条件变化
const handleFilterChange = () => {
  fetchOssConfigs();
};

// 获取OSS配置列表
const fetchOssConfigs = async () => {
  try {
    loading.value = true;
    const params = { 
      ...pageParams,
      remark: filterParams.remark || undefined,
      isEnable: filterParams.status !== '' ? filterParams.status : undefined
    };
    const res = await storageListApi(params);
    ossConfigs.value = res.list || [];
  } catch (error) {
    console.error('获取OSS配置列表失败:', error);
    ElMessage.error('获取OSS配置列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取配置详情
const getConfigDetail = async (type: string) => {
  try {
    const res = await configDetailApi({ type });
    return res.content || '';
  } catch (error) {
    console.error(`获取${type}配置失败:`, error);
    return '';
  }
};

// 保存配置
const updateConfig = async (type: string, content: string) => {
  try {
    // 构造参数符合后端API定义
    await configUpdateApi({ type, content });
    return true;
  } catch (error) {
    console.error(`保存${type}配置失败:`, error);
    ElMessage.error(`保存${type}配置失败`);
    return false;
  }
};

// 加载配置
const loadConfigs = async () => {
  configLoading.value = true;
  try {
    // 加载数据源存储位置
    const storageUuid = await getConfigDetail('DataStorage_Uuid');
    operation.storageUuid = storageUuid;
    
    // 根据UUID查找对应的存储配置名称
    updateStorageLabelByUuid(storageUuid);
    
    // 加载备份存储位置
    const backupPath = await getConfigDetail('DataStorage_Path');
    operation.backupPath = backupPath;
  } catch (error) {
    console.error('加载配置失败:', error);
    ElMessage.error('加载配置失败');
  } finally {
    configLoading.value = false;
  }
};

// 根据UUID更新显示标签
const updateStorageLabelByUuid = (uuid: string) => {
  if (!uuid) {
    operation.storageLabel = '';
    return;
  }
  
  const matchedConfig = ossConfigs.value.find(config => config.uuid === uuid);
  if (matchedConfig) {
    operation.storageLabel = matchedConfig.remark || matchedConfig.endpoint || uuid;
  } else {
    // 如果找不到匹配的配置，暂时显示UUID
    operation.storageLabel = uuid;
  }
};

// 保存所有配置
const saveConfigs = async () => {
  savingConfig.value = true;
  try {
    // 保存数据源存储位置
    const storageSuccess = await updateConfig('DataStorage_Uuid', operation.storageUuid);
    
    // 保存备份存储位置
    const backupSuccess = await updateConfig('DataStorage_Path', operation.backupPath);
    
    if (storageSuccess && backupSuccess) {
      ElMessage.success('所有配置已保存');
    }
  } catch (error) {
    console.error('保存配置失败:', error);
    ElMessage.error('保存配置失败');
  } finally {
    savingConfig.value = false;
  }
};

// 查询存储选项
const queryStorageOptions = (query: string, cb: (data: Array<{value: string}>) => void) => {
  const filteredOptions = ossConfigs.value
    .filter(config => config.isEnable === 1)
    .filter(config => {
      const label = config.remark || config.endpoint || '';
      return label.toLowerCase().includes(query.toLowerCase()) || 
             config.uuid?.toLowerCase().includes(query.toLowerCase());
    })
    .map(config => ({
      value: config.remark || config.endpoint || '',
      uuid: config.uuid
    }));
  
  cb(filteredOptions);
};

// 处理存储选择
const handleStorageSelected = (item: Record<string, any>) => {
  if (item && item.uuid) {
    operation.storageUuid = item.uuid;
    operation.storageLabel = item.value;
  }
};

// 处理存储变化
const handleStorageChange = (value: string) => {
  // 先设置显示值
  operation.storageLabel = value;
  
  // 如果输入的不是UUID格式，查找匹配的存储配置
  const matchedConfig = ossConfigs.value
    .filter(config => config.isEnable === 1)
    .find(config => config.remark === value || config.endpoint === value);
  
  if (matchedConfig && matchedConfig.uuid) {
    operation.storageUuid = matchedConfig.uuid;
  } 
  // 如果没有匹配项，可以选择清空UUID或保留之前的值
  // 这里选择清空，表示用户输入了自定义值
  else if (value.trim() !== '') {
    operation.storageUuid = '';
  }
};

// 处理备份路径变更
const handleBackupPathChange = (value: string) => {
  operation.backupPath = value;
};

// 初始化页面时获取列表和配置
onMounted(() => {
  fetchOssConfigs();
  loadConfigs();
});

// 计算属性：可用的存储选项
const availableStorageOptions = computed(() => {
  return ossConfigs.value.map(config => ({
    label: config.remark || config.endpoint || '', 
    value: config.uuid || ''
  }));
});

// 监听可用选项变化，更新选中的存储源
watch(availableStorageOptions, (newOptions) => {
  if (newOptions.length > 0 && !newOptions.some(option => option.value === operation.storageUuid)) {
    operation.storageUuid = newOptions[0]?.value || ''; // 选择第一个可用选项
  } else if (newOptions.length === 0) {
    operation.storageUuid = ''; // 如果没有可用选项则重置
  }
}, { immediate: true });

// 打开对话框
const openDialog = (type: string, index?: number) => {
  // 先重置表单，确保在对话框显示前数据已被清空
  dialogForm.uuid = '';
  dialogForm.endpoint = '';
  dialogForm.accessKeyId = '';
  dialogForm.accessKeySecret = '';
  dialogForm.bucket = '';
  dialogForm.region = '';
  dialogForm.remark = '';
  dialogForm.isEnable = 1; // 默认启用
  
  if (type === 'new') {
    dialogTitle.value = '新建OSS配置';
    editingIndex.value = -1;
  } else if (type === 'edit' && typeof index === 'number') {
    dialogTitle.value = '编辑OSS配置';
    editingIndex.value = index;
    const config = ossConfigs.value[index];
    if (config) {
      // 填充表单
      dialogForm.uuid = config.uuid || '';
      dialogForm.endpoint = config.endpoint || '';
      dialogForm.accessKeyId = config.accessKeyId || '';
      dialogForm.accessKeySecret = config.accessKeySecret || '';
      dialogForm.bucket = config.bucket || '';
      dialogForm.region = config.region || '';
      dialogForm.remark = config.remark || '';
      dialogForm.isEnable = config.isEnable || 1;
    }
  }
  
  // 设置当前对话框类型
  currentDialog.value = type;
  
  // 在下一个事件循环中打开对话框，确保表单已被重置
  setTimeout(() => {
    dialogVisible.value = true;
    // 如果引用存在，重置表单验证状态
    if (dialogFormRef.value) {
      dialogFormRef.value.resetFields();
    }
  }, 0);
};

// 保存对话框
const saveDialog = () => {
  if (!dialogFormRef.value) return;
  
  dialogFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    
    try {
      if (currentDialog.value === 'new') {
        // 新建存储配置
        const params = {
          endpoint: dialogForm.endpoint,
          accessKeyId: dialogForm.accessKeyId,
          accessKeySecret: dialogForm.accessKeySecret,
          bucket: dialogForm.bucket,
          region: dialogForm.region,
          remark: dialogForm.remark,
          isEnable: dialogForm.isEnable // 确保提交isEnable字段
        };
        
        await storageNewApi(params);
        ElMessage.success('OSS配置已添加');
      } else if (currentDialog.value === 'edit') {
        // 更新存储配置
        const params = {
          uuid: dialogForm.uuid,
          endpoint: dialogForm.endpoint,
          accessKeyId: dialogForm.accessKeyId,
          accessKeySecret: dialogForm.accessKeySecret,
          bucket: dialogForm.bucket,
          region: dialogForm.region,
          remark: dialogForm.remark,
          isEnable: dialogForm.isEnable // 确保提交isEnable字段
        };
        
        await storageUpdateApi(params);
        ElMessage.success('OSS配置已更新');
      }
      
      // 重新获取列表
      fetchOssConfigs();
      dialogVisible.value = false;
    } catch (error) {
      console.error('保存OSS配置失败:', error);
      ElMessage.error('保存OSS配置失败');
    }
  });
};

// 删除配置
const deleteConfig = (index: number) => {
  const config = ossConfigs.value[index];
  if (!config || !config.uuid) return;
  
  ElMessageBox.confirm('确定要删除此OSS配置吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await storageDeleteApi(config.uuid);
      ElMessage.success('OSS配置已删除');
      
      // 重新获取列表
      fetchOssConfigs();
      
      // 如果删除的是当前选中的存储源，重置选择
      const firstConfig = ossConfigs.value[0];
      if (ossConfigs.value.length > 0 && !ossConfigs.value.some(c => c.uuid === operation.storageUuid)) {
        operation.storageUuid = firstConfig?.uuid || '';
      } else if (ossConfigs.value.length === 0) {
        operation.storageUuid = '';
      }
    } catch (error) {
      console.error('删除OSS配置失败:', error);
      ElMessage.error('删除OSS配置失败');
    }
  }).catch(() => {});
};

// 判断是否有筛选条件
const isFiltering = computed(() => {
  return filterParams.remark !== '' || filterParams.status !== '';
});

// 重置筛选条件
const resetFilters = () => {
  filterParams.remark = '';
  filterParams.status = '';
  fetchOssConfigs();
};

// 监听OSS配置列表变化，更新存储标签
watch(ossConfigs, () => {
  // 当配置列表加载完成后，尝试更新标签显示
  updateStorageLabelByUuid(operation.storageUuid);
});
</script>

<style scoped>
.section-card {
  margin: 20px;
}
.header-with-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-with-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-area {
  display: flex;
  gap: 10px;
  align-items: center;
}
.filter-input {
  width: 200px;
}
.filter-select {
  width: 120px;
}
.header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  position: relative;
}
.config-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.clickable-card {
  cursor: pointer;
  position: relative;
}
.storage-source-card {
  padding: 15px;
  margin-bottom: 15px;
  height: 100%;
}
.card-content {
  margin-bottom: 8px;
}
.card-label {
  font-weight: bold;
  margin-right: 5px;
}
.delete-button {
  position: absolute;
  right: 0;
  top: 0;
}
.storage-autocomplete {
  width: 100%;
}
.storage-suggestions {
  width: 100%;
}
.storage-option {
  padding: 5px 0;
}
</style>
