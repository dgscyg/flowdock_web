<template>
  <div class="bg-background">
    <!-- 密码更新卡片 -->
    <ElCard class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span>密码设置</span>
          <ElButton
            type="primary"
            link
            @click="passwordCollapsed = !passwordCollapsed"
          >
            {{ passwordCollapsed ? '展开' : '收起' }}
            <ElIcon class="ml-1">
              <component :is="passwordCollapsed ? ArrowDown : ArrowUp" />
            </ElIcon>
          </ElButton>
        </div>
      </template>
      <el-collapse-transition>
        <div v-show="!passwordCollapsed">
          <ElForm
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <ElFormItem label="旧密码" prop="oldPassword">
              <ElInput
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入旧密码"
                show-password
              />
            </ElFormItem>
            <ElFormItem label="新密码" prop="newPassword">
              <div class="password-strength mb-2">
                <div class="strength-bar-container">
                  <div class="strength-bar">
                    <div 
                      class="strength-level" 
                      :style="{width: passwordStrength.percentage + '%'}"
                      :class="[passwordStrength.colorClass.replace('text-', 'bg-')]"
                    ></div>
                  </div>
                </div>
                <div class="strength-text text-xs mt-1" :class="passwordStrength.colorClass">
                  {{ passwordStrength.message }}
                </div>
              </div>
              <ElInput
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
                @input="checkPasswordStrength"
              />
              <div class="password-requirements mt-2">
                <div class="text-xs" :class="{'text-green-500': passwordForm.newPassword.length >= 8, 'text-red-500': passwordForm.newPassword && passwordForm.newPassword.length < 8}">
                  <ElIcon>
                    <component :is="passwordForm.newPassword.length >= 8 ? Check : Close" />
                  </ElIcon>
                  长度不少于8位
                </div>
                <div class="text-xs" :class="{'text-green-500': /[a-z]/.test(passwordForm.newPassword), 'text-red-500': passwordForm.newPassword && !/[a-z]/.test(passwordForm.newPassword)}">
                  <ElIcon>
                    <component :is="/[a-z]/.test(passwordForm.newPassword) ? Check : Close" />
                  </ElIcon>
                  包含小写字母
                </div>
                <div class="text-xs" :class="{'text-green-500': /[A-Z]/.test(passwordForm.newPassword), 'text-red-500': passwordForm.newPassword && !/[A-Z]/.test(passwordForm.newPassword)}">
                  <ElIcon>
                    <component :is="/[A-Z]/.test(passwordForm.newPassword) ? Check : Close" />
                  </ElIcon>
                  包含大写字母
                </div>
                <div class="text-xs" :class="{'text-green-500': /[0-9]/.test(passwordForm.newPassword), 'text-red-500': passwordForm.newPassword && !/[0-9]/.test(passwordForm.newPassword)}">
                  <ElIcon>
                    <component :is="/[0-9]/.test(passwordForm.newPassword) ? Check : Close" />
                  </ElIcon>
                  包含数字
                </div>
                <div class="text-xs" :class="{'text-green-500': /[^A-Za-z0-9]/.test(passwordForm.newPassword), 'text-red-500': passwordForm.newPassword && !/[^A-Za-z0-9]/.test(passwordForm.newPassword)}">
                  <ElIcon>
                    <component :is="/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? Check : Close" />
                  </ElIcon>
                  包含特殊字符
                </div>
              </div>
            </ElFormItem>
            <ElFormItem label="确认密码" prop="confirmPassword">
              <ElInput
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" @click="handleUpdatePassword">
                更新密码
              </ElButton>
            </ElFormItem>
          </ElForm>
        </div>
      </el-collapse-transition>
    </ElCard>

    <!-- 用户信息更新卡片 -->
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span>个人信息</span>
          <ElButton
            type="primary"
            link
            @click="userInfoCollapsed = !userInfoCollapsed"
          >
            {{ userInfoCollapsed ? '展开' : '收起' }}
            <ElIcon class="ml-1">
              <component :is="userInfoCollapsed ? ArrowDown : ArrowUp" />
            </ElIcon>
          </ElButton>
        </div>
      </template>
      <el-collapse-transition>
        <div v-show="!userInfoCollapsed">
          <ElForm
            ref="userFormRef"
            :model="userForm"
            label-width="100px"
          >
            <ElFormItem label="真实姓名" prop="username">
              <ElInput
                v-model="userForm.username"
                placeholder="请输入真实姓名"
              />
            </ElFormItem>
            <ElFormItem label="昵称" prop="realName">
              <ElInput
                v-model="userForm.realName"
                placeholder="请输入昵称"
              />
            </ElFormItem>
            <ElFormItem label="头像" prop="avatar">
              <div class="avatar-uploader">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :disabled="uploadLoading"
                  :before-upload="beforeAvatarUpload"
                  accept="image/*"
                >
                  <img
                    v-if="userForm.avatar && !uploading"
                    :src="avatarUrl"
                    class="avatar"
                  />
                  <el-icon v-else-if="uploading" class="avatar-uploader-icon">
                    <el-progress
                      type="circle"
                      :percentage="uploadProgress"
                      :width="80"
                    />
                  </el-icon>
                  <el-icon v-else class="avatar-uploader-icon">
                    <Plus />
                  </el-icon>
                </el-upload>
              </div>
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" @click="handleUpdateUserInfo">
                更新信息
              </ElButton>
            </ElFormItem>
          </ElForm>
        </div>
      </el-collapse-transition>
    </ElCard>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDown, ArrowUp, Plus, Check, Close } from '@element-plus/icons-vue';
import { 
  ElButton,
  ElCard,
  ElCollapseTransition,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElProgress,
  ElUpload
} from 'element-plus';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import { getUserInfoApi, updateUserInfoApi, updateUserPasswordApi } from '#/api/core/user';
import { ossConfigApi } from '#/api/task/oss';
import type { UserInfoUpdateReq, UserPasswordUpdateReq } from '#/types/user';
import type { OssConfigResp } from '#/types/oss';
import { S3Uploader, type S3Config } from '#/utils/s3-upload';

// 表单引用
const passwordFormRef = ref<FormInstance>();
const userFormRef = ref<FormInstance>();

// 卡片折叠状态
const passwordCollapsed = ref(false);
const userInfoCollapsed = ref(false);

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 密码强度指示
const passwordStrength = reactive({
  percentage: 0,
  colorClass: 'text-gray-400',
  message: ''
});

// 用户信息表单
const userForm = reactive<UserInfoUpdateReq>({
  username: '',
  realName: '',
  avatar: ''
});

// 上传相关
const s3Config = ref<S3Config | null>(null);
const s3Uploader = ref<S3Uploader | null>(null);
const uploadLoading = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);

// 用于存储带签名的头像URL
const avatarUrl = ref('');

// 检查密码强度
const checkPasswordStrength = () => {
  const password = passwordForm.newPassword;
  
  if (!password) {
    passwordStrength.percentage = 0;
    passwordStrength.colorClass = 'text-gray-400';
    passwordStrength.message = '';
    return;
  }
  
  // 检查各项要求是否满足
  const hasLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  // 计算满足的要求数量
  const requirementsMet = [hasLength, hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  
  // 计算强度百分比 (每个要求占20%)
  let strength = requirementsMet * 20;
  
  // 更新密码强度信息
  passwordStrength.percentage = strength;
  
  if (strength < 40) {
    passwordStrength.colorClass = 'text-red-500';
    passwordStrength.message = '弱密码';
  } else if (strength < 80) {
    passwordStrength.colorClass = 'text-yellow-500';
    passwordStrength.message = '中等强度密码';
  } else if (strength < 100) {
    passwordStrength.colorClass = 'text-orange-400';
    passwordStrength.message = '较强密码';
  } else {
    passwordStrength.colorClass = 'text-green-500';
    passwordStrength.message = '强密码';
  }
  
  // 如果表单已初始化，触发验证
  if (passwordFormRef.value) {
    passwordFormRef.value.validateField('newPassword');
  }
};

// 检查密码是否符合要求的工具函数
const validatePasswordRequirements = (password: string): {valid: boolean, message: string} => {
  if (!password) return { valid: false, message: '请输入新密码' };
  if (password.length < 8) return { valid: false, message: '密码长度不能少于8位' };
  if (!/[a-z]/.test(password)) return { valid: false, message: '密码必须包含小写字母' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: '密码必须包含大写字母' };
  if (!/[0-9]/.test(password)) return { valid: false, message: '密码必须包含数字' };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: '密码必须包含特殊字符' };
  
  return { valid: true, message: '' };
};

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: (error?: Error) => void) => {
        // 检查密码是否与旧密码相同
        if (value === passwordForm.oldPassword) {
          callback(new Error('新密码不能与旧密码相同'));
          return;
        }
        
        // 检查密码是否符合复杂度要求
        const { valid, message } = validatePasswordRequirements(value);
        if (!valid) {
          callback(new Error(message));
          return;
        }
        
        // 如果确认密码已输入，校验两次输入是否一致
        if (passwordForm.confirmPassword) {
          passwordFormRef.value?.validateField('confirmPassword');
        }
        callback();
      }, 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: (error?: Error) => void) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ]
};

// 获取OSS配置
const getOssConfig = async () => {
  try {
    uploadLoading.value = true;
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
  } finally {
    uploadLoading.value = false;
  }
};

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const userInfo = await getUserInfoApi();
    userForm.username = userInfo.username || '';
    userForm.realName = userInfo.realName || '';
    userForm.avatar = userInfo.avatar || '';
  } catch (error) {
    ElMessage.error('获取用户信息失败');
    console.error(error);
  }
};

// 更新密码
const handleUpdatePassword = async () => {
  if (!passwordFormRef.value) return;
  
  await passwordFormRef.value.validate(async (valid, fields) => {
    if (!valid) return;
    
    // 检查密码是否符合所有规则
    const { valid: passwordValid, message } = validatePasswordRequirements(passwordForm.newPassword);
    if (!passwordValid) {
      ElMessage.error(message);
      return;
    }
    
    try {
      const passwordData: UserPasswordUpdateReq = {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      };
      
      await updateUserPasswordApi(passwordData);
      ElMessage.success('密码更新成功');
      // 清空表单
      passwordForm.oldPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
      passwordStrength.percentage = 0;
      passwordStrength.message = '';
      passwordStrength.colorClass = 'text-gray-400';
    } catch (error) {
      ElMessage.error('密码更新失败');
      console.error(error);
    }
  });
};

// 更新用户信息
const handleUpdateUserInfo = async () => {
  if (!userFormRef.value) return;
  
  try {
    await updateUserInfoApi(userForm);
    ElMessage.success('用户信息更新成功');
    // 刷新用户信息
    await fetchUserInfo();
  } catch (error) {
    ElMessage.error('用户信息更新失败');
    console.error(error);
  }
};

// 头像上传前验证
const beforeAvatarUpload = async (file: File) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('上传头像图片只能是图片格式!');
    return false;
  }
  
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!');
    return false;
  }
  
  // 确保S3上传器已初始化
  if (!s3Uploader.value) {
    await getOssConfig();
    if (!s3Uploader.value) {
      ElMessage.error('上传服务初始化失败');
      return false;
    }
  }
  
  uploading.value = true;
  uploadProgress.value = 0;
  
  try {
    // 上传文件到S3
    const result = await s3Uploader.value.uploadFile(file, (progress) => {
      uploadProgress.value = progress;
    });
    
    // 上传成功后，更新用户头像URL
    userForm.avatar = result.url;
    
    // 立即更新到服务器
    await updateUserInfoApi(userForm);
    ElMessage.success('头像更新成功');
  } catch (error) {
    ElMessage.error('头像上传失败');
    console.error('头像上传失败:', error);
  } finally {
    uploading.value = false;
  }
  
  // 阻止组件默认的上传行为
  return false;
};

// 获取带签名的头像URL
const getSignedAvatarUrl = (url: string) => {
  if (!url) return '';

  try {
    // 因为S3Uploader.getPresignedUrl是异步方法，无法直接在属性绑定中调用
    // 检查URL是否是S3/Minio URL，如果是但还没有包含签名参数，添加一个时间戳参数暂时替代
    // 实际的签名URL会在组件挂载后更新
    if (s3Config.value?.Bucket && url.includes(s3Config.value.Bucket) && 
        !url.includes('X-Amz-Algorithm=') && !url.includes('Expires=')) {
      return `${url}?t=${Date.now()}`;
    }
    
    return url;
  } catch (error) {
    console.error('处理URL失败:', error);
    return url;
  }
};

// 更新头像URL为预签名URL
const updateAvatarWithSignedUrl = async () => {
  try {
    if (!userForm.avatar || !s3Uploader.value) return;
    
    // 判断URL是否需要预签名（来自S3/Minio）
    if (s3Config.value?.Bucket && userForm.avatar.includes(s3Config.value.Bucket)) {
      // 生成预签名URL（10分钟有效期）
      const signedUrl = await s3Uploader.value.getPresignedUrl(userForm.avatar, 10 * 60);
      
      // 在这里我们直接更新avatarUrl的值，而不是userForm.avatar
      // 这样不会影响保存到服务器的原始URL
      avatarUrl.value = signedUrl;
    }
  } catch (error) {
    console.error('生成预签名URL失败:', error);
  }
};

// 监听头像URL变化，自动更新签名URL
watch(() => userForm.avatar, async (newValue) => {
  if (newValue) {
    // 初始设置为原始URL
    avatarUrl.value = newValue;
    // 异步更新为签名URL
    updateAvatarWithSignedUrl();
  } else {
    avatarUrl.value = '';
  }
}, { immediate: true });

// 页面加载时获取用户信息和OSS配置
onMounted(async () => {
  await Promise.all([fetchUserInfo(), getOssConfig()]);
  // 初始化完成后更新头像URL
  updateAvatarWithSignedUrl();
});
</script>

<style scoped>
.avatar-uploader {
  display: flex;
  justify-content: center;
}

.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-uploader .el-icon {
  width: 100px;
  height: 100px;
  font-size: 28px;
  color: #8c939d;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader .el-icon:hover {
  border-color: var(--el-color-primary);
}

.el-form-item-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.password-strength {
  margin-top: 8px;
  width: 5%;
}

.strength-bar-container {
  width: 100%;
}

.strength-bar {
  height: 8px;
  width: 100%;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.strength-level {
  height: 100%;
  transition: width 0.5s ease, background-color 0.5s ease;
}

.strength-text {
  min-height: 18px;
}

.password-requirements {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.password-requirements .text-xs {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}

.password-requirements .el-icon {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.text-red-500 {
  color: #f56c6c;
}

.text-yellow-500 {
  color: #e6a23c;
}

.text-orange-400 {
  color: #ff9800;
}

.text-green-500 {
  color: #67c23a;
}

.text-gray-400 {
  color: #909399;
}

/* 背景色类 */
.bg-red-500 {
  background-color: #f56c6c;
}

.bg-yellow-500 {
  background-color: #e6a23c;
}

.bg-orange-400 {
  background-color: #ff9800;
}

.bg-green-500 {
  background-color: #67c23a;
}

.bg-gray-400 {
  background-color: #909399;
}
</style>
