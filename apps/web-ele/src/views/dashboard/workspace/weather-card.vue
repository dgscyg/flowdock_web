<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

import { AnalysisChartCard } from '@vben/common-ui';

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
const error = ref('');

const location = ref<Location>({
  lat: '',
  lon: '',
  city: '',
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

async function fetchWeatherData() {
  try {
    loading.value = true;
    error.value = '';

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
    } else {
      error.value = '获取天气数据失败';
    }
  } catch (error_) {
    error.value = '网络请求失败';
    console.error(error_);
  } finally {
    loading.value = false;
  }
}

let timer: null | ReturnType<typeof setInterval> = null;
timer = setInterval(fetchWeatherData, 30 * 60 * 1000);

onMounted(() => {
  fetchWeatherData();
  // 每30分钟更新一次天气数据
  timer = setInterval(fetchWeatherData, 30 * 60 * 1000);
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<template>
  <AnalysisChartCard title="实时天气">
    <div class="weather-container">
      <template v-if="!error">
        <div class="weather-info">
          <div class="weather-main">
            <span class="temperature">{{ weatherData.temp }}</span>
            <span class="weather-text">{{ weatherData.text }}</span>
          </div>

          <div class="weather-details">
            <div class="city">{{ weatherData.city }}</div>

            <div class="update-time text-xs text-gray-500">
              更新时间：{{ weatherData.lastUpdate }}
            </div>
          </div>
        </div>
      </template>
      <div v-else class="error-message">{{ error }}</div>

      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    </div>
  </AnalysisChartCard>
</template>

<style scoped>
.weather-container {
  position: relative;
  min-height: 60px;
}

.weather-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.weather-main {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.temperature {
  font-size: 1.5rem;
  font-weight: 600;
}

.weather-text {
  font-size: 1rem;
  color: var(--text-color-secondary);
}

.weather-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.city {
  font-size: 0.875rem;
  font-weight: 500;
}

.error-message {
  padding: 1rem;
  color: var(--error-color);
  text-align: center;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 70%);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--primary-color);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
