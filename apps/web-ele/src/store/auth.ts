import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH, LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi, registerApi } from '#/api';
import { ossConfigApi } from '#/api/task/oss';
import { type AuthApi } from '#/types/auth';
import { $t } from '#/locales';
import { S3Uploader, type S3Config } from '#/utils/s3-upload';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const registerLoading = ref(false);
  const s3Config = ref<S3Config | null>(null);
  const s3Uploader = ref<S3Uploader | null>(null);

  // 获取OSS配置并初始化S3上传器
  async function initS3Uploader() {
    try {
      if (s3Uploader.value) return s3Uploader.value;
      
      // 获取OSS配置
      const config = await ossConfigApi();
      s3Config.value = config;
      
      // 初始化S3上传器
      if (config) {
        s3Uploader.value = new S3Uploader(config);
        console.log('Auth模块: S3上传器初始化成功');
      }
      
      return s3Uploader.value;
    } catch (error) {
      console.error("获取OSS配置失败", error);
      return null;
    }
  }

  // 处理用户头像URL，返回带有24小时有效期的签名URL
  async function processAvatarUrl(userInfo: UserInfo): Promise<UserInfo> {
    if (!userInfo?.avatar) return userInfo;
    
    try {
      // 确保S3上传器已初始化
      const uploader = await initS3Uploader();
      if (!uploader || !s3Config.value?.Bucket) return userInfo;
      
      // 检查是否需要签名（URL是否来自S3/Minio）
      if (userInfo.avatar.includes(s3Config.value.Bucket)) {
        console.log('正在为头像生成24小时有效期的预签名URL');
        // 生成24小时有效期的预签名URL (24h * 60m * 60s = 86400s)
        const signedUrl = await uploader.getPresignedUrl(userInfo.avatar, 86400);
        
        // 创建用户信息副本并更新头像URL
        return {
          ...userInfo,
          avatar: signedUrl
        };
      }
    } catch (error) {
      console.error('处理头像URL失败:', error);
    }
    
    return userInfo;
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await loginApi(params);

      // 如果成功获取到 accessToken
      if (accessToken) {
        // 将 accessToken 存储到 accessStore 中
        accessStore.setAccessToken(accessToken);

        // 获取用户信息并存储到 accessStore 中
        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;

        // 初始化S3上传器并处理头像URL
        userInfo = await processAvatarUrl(userInfo);

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(userInfo.homePath || DEFAULT_HOME_PATH);
        }

        if (userInfo?.realName) {
          ElNotification({
            message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            title: $t('authentication.loginSuccess'),
            type: 'success',
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi();
    
    // 处理头像URL (添加S3签名)
    userInfo = await processAvatarUrl(userInfo);
    
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
    registerLoading.value = false;
  }

  async function authRegister(formData: any) {
    try {
      registerLoading.value = true
      
      const registerParams: AuthApi.RegisterParams = {
        username: formData.username,
        password: formData.password
      };
      
      await registerApi(registerParams);
      // 注册成功后的操作，跳转到登录页面
      await router.push('/auth/login');

      ElNotification({
        message: `${$t('authentication.registerSuccessDesc')}`,
        title: $t('authentication.registerSuccess'),
        type: 'success',
      });
    } finally {
      registerLoading.value = false;
    }
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    registerLoading,
    logout,
    authRegister,
  };
});
