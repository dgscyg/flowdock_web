<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useTimeoutFn } from '@vueuse/core';
import { ElSkeleton, ElTag, ElIcon,ElAlert,ElButton } from 'element-plus';
import { AnalysisChartCard } from '@vben/common-ui';
import { Refresh, Location } from '@element-plus/icons-vue';

// 直接从本地npm包引入和风天气图标样式
import 'qweather-icons/font/qweather-icons.css';

interface WeatherData {
  temp: string;
  text: string;
  icon: string;
  city: string;
  lastUpdate: string;
}

interface Location {
  lat: string;
  lon: string;
  city: string;
}

const weatherData = ref<WeatherData>({
  temp: '--',
  text: '加载中...',
  icon: '999',
  city: '--',
  lastUpdate: '--',
});

const loading = ref(true);
const error = ref<string | null>(null);
const refreshing = ref(false);

const location = ref<Location>({
  lat: '',
  lon: '',
  city: '',
});

const cacheKey = 'weather_data_cache';
const cacheExpiryKey = 'weather_data_cache_expiry';

// 计算背景颜色类（根据天气状况）
const weatherColorClass = computed(() => {
  const text = weatherData.value.text;
  if (text.includes('晴')) return 'weather-sunny';
  if (text.includes('雨')) return 'weather-rainy';
  if (text.includes('云') || text.includes('阴')) return 'weather-cloudy';
  if (text.includes('雪')) return 'weather-snowy';
  if (text.includes('雾') || text.includes('霾')) return 'weather-foggy';
  if (text.includes('风') || text.includes('飑')) return 'weather-windy';
  if (text.includes('雷') || text.includes('电')) return 'weather-thunder';
  return 'weather-default';
});

async function getLocationByIP() {
  try {
    const response = await fetch('http://ip-api.com/json/?lang=zh-CN');
    const data = await response.json();
    if (data.status === 'success') {
      location.value = {
        lat: data.lat.toFixed(2),
        lon: data.lon.toFixed(2),
        city: data.city,
      };
      return true;
    }
    return false;
  } catch (error_) {
    console.error('获取位置信息失败:', error_);
    return false;
  }
}

async function fetchWeather() {
  loading.value = true;
  refreshing.value = true;
  error.value = null;

  try {
    // 先获取位置信息
    const hasLocation = await getLocationByIP();
    if (!hasLocation) {
      // 降级使用北京
      location.value = {
        lat: '39.90',
        lon: '116.40',
        city: '北京市',
      };
    }

    const response = await fetch(
      `https://devapi.qweather.com/v7/weather/now?location=${location.value.lon},${location.value.lat}&key=9828c7f11c4f40139f98c9d5847b986c`
    );
    const data = await response.json();

    if (data.code === '200') {
      weatherData.value = {
        temp: `${data.now.temp}°C`,
        text: data.now.text,
        icon: data.now.icon,
        city: location.value.city,
        lastUpdate: new Date().toLocaleTimeString(),
      };

      // 写入缓存
      localStorage.setItem(cacheKey, JSON.stringify(weatherData.value));
      localStorage.setItem(cacheExpiryKey, String(Date.now() + 3 * 60 * 60 * 1000)); // 3 小时后过期
    } else {
      error.value = '获取天气数据失败';
    }
  } catch (err: any) {
    error.value = err.message || '获取天气信息失败';
  } finally {
    loading.value = false;
    setTimeout(() => {
      refreshing.value = false;
    }, 500);
  }
}

onMounted(() => {
  // 尝试从缓存读取
  const cachedData = localStorage.getItem(cacheKey);
  const expiry = localStorage.getItem(cacheExpiryKey);

  if (cachedData && expiry && Date.now() < Number(expiry)) {
    weatherData.value = JSON.parse(cachedData);
    loading.value = false;
  } else {
    fetchWeather();
  }
});

// 可选：每隔一段时间刷新天气
const { start, stop } = useTimeoutFn(fetchWeather, 10 * 60 * 1000, { immediate: false }); // 每 10 分钟刷新一次

onMounted(() => {
  start();
});
</script>

<template>
  <AnalysisChartCard title="实时天气" :loading="loading">
    <template #extra>
      <el-button
        type="primary"
        size="small"
        :loading="refreshing"
        link
        @click="fetchWeather"
        class="refresh-btn"
      >
        <el-icon><Refresh /></el-icon>
      </el-button>
    </template>

    <div class="weather-container" :class="weatherColorClass">
      <template v-if="!error && !loading">
        <div class="weather-card">
          <div class="weather-header">
            <div class="weather-icon">
              <!-- 使用和风天气图标字体 -->
              <i :class="['qi-' + weatherData.icon + '-fill']"></i>
            </div>
            <div class="weather-main">
              <div class="temperature">{{ weatherData.temp }}</div>
              <el-tag :type="['weather-sunny', 'weather-default'].includes(weatherColorClass) ? 'warning' : 'info'" 
                     effect="light" 
                     class="weather-text">
                {{ weatherData.text }}
              </el-tag>
            </div>
          </div>

          <div class="weather-footer">
            <div class="location">
              <el-icon><Location /></el-icon>
              <span>{{ weatherData.city }}</span>
            </div>
            <div class="update-time">
              更新时间: {{ weatherData.lastUpdate }}
            </div>
          </div>
        </div>
      </template>

      <el-skeleton v-if="loading" animated :rows="3" class="weather-skeleton" />
      
      <el-alert
        v-if="error"
        type="error"
        :closable="false"
        show-icon
        :title="error"
      />
    </div>
  </AnalysisChartCard>
</template>

<style scoped>
.weather-container {
  position: relative;
  min-height: 120px;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, var(--el-bg-color), var(--el-bg-color-page));
}

/* 不同天气的背景色 */
.weather-sunny {
  background: linear-gradient(135deg, #ffd76e, #ffb13a);
  color: #664500;
}

.weather-rainy {
  background: linear-gradient(135deg, #a4c2e5, #6d8cb0);
  color: #fff;
}

.weather-cloudy {
  background: linear-gradient(135deg, #c9d6e4, #9aadc2);
  color: #333;
}

.weather-snowy {
  background: linear-gradient(135deg, #deeefb, #c0d4e7);
  color: #344f6e;
}

.weather-foggy {
  background: linear-gradient(135deg, #d4d4d4, #b3b3b3);
  color: #333;
}

.weather-windy {
  background: linear-gradient(135deg, #b8e0d2, #8acbad);
  color: #2c5242;
}

.weather-thunder {
  background: linear-gradient(135deg, #b0a4e0, #8174b0);
  color: #fff;
}

.weather-default {
  background: linear-gradient(135deg, #f0f2f5, #e6ebf5);
  color: var(--el-text-color-primary);
}

.weather-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weather-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.weather-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 8px;
}

/* 和风天气图标样式 */
.weather-icon i {
  font-size: 48px;
  line-height: 1;
  color: inherit;
}

.weather-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.temperature {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.weather-text {
  font-size: 0.9rem;
}

.weather-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  opacity: 0.9;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}

.location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.update-time {
  font-size: 0.75rem;
  opacity: 0.8;
}

.weather-skeleton {
  padding: 16px 0;
}

.refresh-btn {
  padding: 2px;
}

/* 适配深色模式 */
:deep(.el-card.is-dark) .weather-container {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-card.is-dark) .weather-default {
  background: linear-gradient(135deg, #2c2c2c, #383838);
  color: #e0e0e0;
}

:deep(.dark) .weather-icon {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 确保图标在不同背景上有良好的可见性 */
.weather-sunny .weather-icon i,
.weather-default .weather-icon i {
  color: #664500;
}

.weather-rainy .weather-icon i,
.weather-thunder .weather-icon i {
  color: #fff;
}

.weather-cloudy .weather-icon i,
.weather-foggy .weather-icon i {
  color: #333;
}

.weather-snowy .weather-icon i {
  color: #344f6e;
}

.weather-windy .weather-icon i {
  color: #2c5242;
}
</style>
