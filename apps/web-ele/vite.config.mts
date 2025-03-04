import { defineConfig } from '@vben/vite-config';

import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            // target: 'http://localhost:5320/api',
            // target: 'http://localhost:8881/basic-api/v1',
            // target: 'http://192.168.100.13:1005/basic/v1',
            // target: 'http://192.168.100.14:21005/basic/v1',
            target: 'https://dragon.com/basic/v1',
            // target: 'http://38.46.221.213:21005/basic/v1',
            ws: true,
            secure: false,
          },
        },
      },
    },
  };
});
