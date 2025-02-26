<template>
  <div class="storage-page">
    <!-- 数据存储源区域 -->
    <el-card class="section-card">
      <template #header>
        <span>数据存储源</span>
      </template>
      <el-row :gutter="20">
        <!-- 本地存储卡片 -->
        <el-col :span="12">
          <div class="clickable-card" @click="openDialog('local')">
            <el-card class="storage-source-card" shadow="hover">
              <template #header>
                <span>本地存储</span>
              </template>
              <div class="card-content">
                <span class="card-label">状态：</span>
                <el-tag type="success" v-if="form.localPath">已设置</el-tag>
                <el-tag type="info" v-else>未设置</el-tag>
              </div>
              <div class="card-content" v-if="form.localPath">
                <span class="card-label">存储路径：</span>
                <span>{{ form.localPath }}</span>
              </div>
              <div class="card-content" v-if="form.localRemaining">
                <span class="card-label">剩余空间：</span>
                <span>{{ form.localRemaining }}</span>
              </div>
            </el-card>
          </div>
        </el-col>
        <!-- WebDAV卡片 -->
        <el-col :span="12">
          <div class="clickable-card" @click="openDialog('webdav')">
            <el-card class="storage-source-card" shadow="hover">
              <template #header>
                <span>WebDAV</span>
              </template>
              <div class="card-content">
                <span class="card-label">状态：</span>
                <el-tag type="success" v-if="form.webdavUrl">已设置</el-tag>
                <el-tag type="info" v-else>未设置</el-tag>
              </div>
              <div class="card-content" v-if="form.webdavUrl">
                <span class="card-label">服务器地址：</span>
                <span>{{ form.webdavUrl }}</span>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top:20px;">
        <!-- OSS卡片 -->
        <el-col :span="12">
          <div class="clickable-card" @click="openDialog('oss')">
            <el-card class="storage-source-card" shadow="hover">
              <template #header>
                <span>OSS</span>
              </template>
              <div class="card-content">
                <span class="card-label">状态：</span>
                <el-tag type="success" v-if="form.ossEndpoint">已设置</el-tag>
                <el-tag type="info" v-else>未设置</el-tag>
              </div>
              <div class="card-content" v-if="form.ossEndpoint">
                <span class="card-label">Endpoint：</span>
                <span>{{ form.ossEndpoint }}</span>
              </div>
              <div class="card-content" v-if="form.ossBucket">
                <span class="card-label">Bucket</span>
                <span>{{ form.ossBucket }}</span>
              </div>
            </el-card>
          </div>
        </el-col>
        <el-col :span="12"></el-col>
      </el-row>
    </el-card>

    <!-- 数据操作区域 -->
    <el-card class="section-card" style="margin-top:20px;">
      <template #header>
        <span>数据操作</span>
      </template>
      <el-form :model="operation" label-width="150px">
        <el-form-item label="数据源存储位置">
          <el-select v-model="operation.chosenStorage" placeholder="请选择数据源存储">
            <el-option
              v-for="option in availableStorageOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="自动备份功能">
          <el-switch v-model="operation.autoBackup"></el-switch>
        </el-form-item>

        <!-- Conditionally show backup settings -->
        <div v-if="operation.autoBackup">
          <el-form-item label="自动备份频率">
            <el-popover
              placement="top-start"
              :width="320"
              trigger="click"
              v-model:visible="frequencyPopoverVisible"
              transition="el-zoom-in-bottom"
            >
              <template #reference>
                <el-button>
                  {{ frequencySummary }}
                  <i class="el-icon--right el-icon-arrow-down"></i>
                </el-button>
              </template>
              <div class="popover-content">
                <el-tabs v-model="operation.backupFrequency.unit">
                  <el-tab-pane label="每月" name="month">
                    <div class="frequency-options">
                      <el-checkbox-group v-model="operation.backupFrequency.monthDays">
                        <el-checkbox v-for="day in 31" :key="day" :value="day">{{ day }}</el-checkbox>
                      </el-checkbox-group>
                      <el-checkbox v-model="operation.backupFrequency.lastDayOfMonth">最后一天</el-checkbox>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="每周" name="week">
                    <div class="frequency-options">
                      <el-checkbox-group v-model="operation.backupFrequency.weekDays">
                        <el-checkbox :value="1">周一</el-checkbox>
                        <el-checkbox :value="2">周二</el-checkbox>
                        <el-checkbox :value="3">周三</el-checkbox>
                        <el-checkbox :value="4">周四</el-checkbox>
                        <el-checkbox :value="5">周五</el-checkbox>
                        <el-checkbox :value="6">周六</el-checkbox>
                        <el-checkbox :value="0">周日</el-checkbox>
                      </el-checkbox-group>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="每日" name="day">
                    <div class="frequency-options">
                      <el-time-picker
                        v-model="operation.backupFrequency.time"
                        placeholder="选择时间"
                        format="HH:mm"
                        value-format="HH:mm"
                      ></el-time-picker>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </el-popover>
          </el-form-item>

          <el-form-item label="自动备份副本上限">
            <el-input-number
              v-model="operation.backupRetentionLimit"
              :min="1"
              placeholder="请输入上限数量"
            ></el-input-number>
          </el-form-item>
        </div>

        <el-form-item label="备份存储位置">
          <el-input v-model="operation.backupLocation" placeholder="请输入备份存储路径"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="manualBackup">手动备份</el-button>
          <el-button type="info" @click="downloadBackup">下载备份</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通用设置弹出对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form :model="dialogForm" label-width="120px">
        <!-- 本地存储设置 -->
        <template v-if="currentDialog === 'local'">
          <el-form-item label="存储路径">
            <el-input v-model="dialogForm.localPath"></el-input>
          </el-form-item>
        </template>
        <!-- WebDAV设置 -->
        <template v-else-if="currentDialog === 'webdav'">
          <el-form-item label="服务器地址">
            <el-input v-model="dialogForm.webdavUrl"></el-input>
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="dialogForm.webdavUser"></el-input>
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="dialogForm.webdavPassword" type="password"></el-input>
          </el-form-item>
        </template>
        <!-- OSS设置 -->
        <template v-else-if="currentDialog === 'oss'">
          <el-form-item label="Endpoint">
            <el-input v-model="dialogForm.ossEndpoint"></el-input>
          </el-form-item>
          <el-form-item label="Access Key">
            <el-input v-model="dialogForm.ossAccessKey"></el-input>
          </el-form-item>
          <el-form-item label="Secret Key">
            <el-input v-model="dialogForm.ossSecretKey" type="password"></el-input>
          </el-form-item>
          <el-form-item label="Bucket">
            <el-input v-model="dialogForm.ossBucket"></el-input>
          </el-form-item>
        </template>
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

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import {
  ElMessage,
  ElCard,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElButton,
  ElRow,
  ElCol,
  ElInput,
  ElSwitch,
  ElInputNumber,
  ElDialog,
  ElTag,
  ElCheckboxGroup,
  ElCheckbox,
  ElTimePicker,
  ElPopover,
  ElTabs,
  ElTabPane,
} from "element-plus";

const form = reactive({
  localPath: '',
  localRemaining: '',
  webdavUrl: '',
  webdavUser: '',
  webdavPassword: '',
  ossEndpoint: '',
  ossAccessKey: '',
  ossSecretKey: '',
  ossBucket: '',
});

const operation = reactive({
  chosenStorage: '',
  autoBackup: false,
  backupFrequency: {
    unit: 'day', // Default: Daily
    monthDays: [], // Array of selected days of the month (1-31)
    lastDayOfMonth: false, // Boolean for "last day of month"
    weekDays: [], // Array of selected days of the week (0-6, Sunday=0)
    time: null,   // Time of day (for daily/hourly) - format: "HH:mm"
  },
  backupRetentionLimit: 10,
  backupLocation: '',
});

const dialogVisible = ref(false);
const currentDialog = ref('');
const dialogForm = reactive({
  localPath: '',
  localRemaining: '',
  webdavUrl: '',
  webdavUser: '',
  webdavPassword: '',
  ossEndpoint: '',
  ossAccessKey: '',
  ossSecretKey: '',
  ossBucket: '',
});
const dialogTitle = ref('');

// Popover visibility
const frequencyPopoverVisible = ref(false);

// Computed property for a summary of the frequency
const frequencySummary = computed(() => {
  const { unit, monthDays, lastDayOfMonth, weekDays, time } = operation.backupFrequency;

  if (unit === 'month') {
    if (monthDays.length === 0 && !lastDayOfMonth) {
      return '未设置';
    }
    const days = monthDays.sort((a, b) => a - b).join(', ');
    return `每月 ${days}${lastDayOfMonth ? ' 及最后一天' : ''}`;
  } else if (unit === 'week') {
    if (weekDays.length === 0) {
      return '未设置';
    }
    const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
    const days = weekDays.sort((a,b) => a-b).map(day => daysOfWeek[day]).join(', ');
    return `每周 ${days}`;
  } else if (unit === 'day') {
    return time ? `每日 ${time}` : '每日';
  }
  return '未设置';
});

// Computed property for available storage options
const availableStorageOptions = computed(() => {
  const options = [];
  if (form.localPath) {
    options.push({ label: '本地存储', value: 'local' });
  }
  if (form.webdavUrl) {
    options.push({ label: 'WebDAV', value: 'webdav' });
  }
  if (form.ossEndpoint) {
    options.push({ label: 'OSS', value: 'oss' });
  }
  return options;
});

// Watch for changes in available options and update chosenStorage if needed
watch(availableStorageOptions, (newOptions) => {
    if (newOptions.length > 0 && !newOptions.some(option => option.value === operation.chosenStorage)) {
        operation.chosenStorage = newOptions[0].value; // Select the first available option
    } else if (newOptions.length === 0) {
        operation.chosenStorage = ''; // Reset if no options are available
    }
}, { immediate: true });


const openDialog = (type) => {
  currentDialog.value = type;
  dialogTitle.value =
    type === 'local'
      ? '设置本地存储'
      : type === 'webdav'
      ? '设置WebDAV'
      : '设置OSS';
  if (type === 'local') {
    dialogForm.localPath = form.localPath;
  } else if (type === 'webdav') {
    dialogForm.webdavUrl = form.webdavUrl;
    dialogForm.webdavUser = form.webdavUser;
    dialogForm.webdavPassword = form.webdavPassword;
  } else if (type === 'oss') {
    dialogForm.ossEndpoint = form.ossEndpoint;
    dialogForm.ossAccessKey = form.ossAccessKey;
    dialogForm.ossSecretKey = form.ossSecretKey;
    dialogForm.ossBucket = form.ossBucket;
  }
  dialogVisible.value = true;
};

const saveDialog = () => {
  if (currentDialog.value === 'local') {
    form.localPath = dialogForm.localPath;
  } else if (currentDialog.value === 'webdav') {
    form.webdavUrl = dialogForm.webdavUrl;
    form.webdavUser = dialogForm.webdavUser;
    form.webdavPassword = dialogForm.webdavPassword;
  } else if (currentDialog.value === 'oss') {
    form.ossEndpoint = dialogForm.ossEndpoint;
    form.ossAccessKey = dialogForm.ossAccessKey;
    form.ossSecretKey = dialogForm.ossSecretKey;
    form.ossBucket = dialogForm.ossBucket;
  }
  dialogVisible.value = false;
  ElMessage.success('配置已保存');
};

const manualBackup = () => {
  ElMessage.info('手动备份操作已触发');
};

const downloadBackup = () => {
  ElMessage.info('下载操作已触发');
};

// Placeholder function to simulate fetching remaining space
const getRemainingSpace = async (path) => {
  // *** In a real application, replace this with an API call ***
  // Example (using a fake delay to simulate network latency):
  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    // Replace this with your actual API call
    const response = { remainingSpace: Math.floor(Math.random() * 1000) + ' GB' }; // Fake data

    if (currentDialog.value === 'local') {
        dialogForm.localRemaining = response.remainingSpace;
    }
    form.localRemaining = response.remainingSpace;

  } catch (error) {
    console.error("Error fetching remaining space:", error);
    ElMessage.error("Failed to fetch remaining space.");
     if (currentDialog.value === 'local') {
        dialogForm.localRemaining = ''; // Clear on error
    }
    form.localRemaining = '';
  }
};

// Watch for changes in the local storage path
watch(() => dialogForm.localPath, (newPath) => {
  if (currentDialog.value === 'local' && newPath) {
    getRemainingSpace(newPath);
  }
}, { immediate: false }); // Don't run on initial load, only on changes

// Watch for changes to form.localPath and update dialogForm.localPath
watch(() => form.localPath, (newPath) => {
    if(currentDialog.value === 'local'){
        dialogForm.localPath = newPath;
    }
});

// Watch for changes to dialogVisible and update remaining space if needed
watch(dialogVisible, (isVisible) => {
    if (isVisible && currentDialog.value === 'local' && dialogForm.localPath) {
        getRemainingSpace(dialogForm.localPath);
    }
});
</script>

<style scoped>
.section-card {
  margin: 20px;
}
.clickable-card {
  cursor: pointer;
}
.storage-source-card {
  padding: 15px; /* Increased padding for better spacing */
}
.card-content {
  margin-bottom: 8px; /* Added margin between card elements */
}
.card-label {
  font-weight: bold;
  margin-right: 5px;
}
.frequency-options {
  margin-top: 10px;
  /*margin-left: 20px;  Removed margin-left to align with select */
}
.popover-content {
  width: 300px; /* Adjust as needed */
}
</style>
