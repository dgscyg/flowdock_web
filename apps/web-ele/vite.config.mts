import { defineConfig } from '@vben/vite-config';
import ElementPlus from 'unplugin-element-plus/vite';
import { defineConfig as defineViteConfig } from 'vite';

export default defineConfig(async () => {
  const viteConfig = defineViteConfig({
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
            target: 'https://dragon.com',
            // target: 'http://38.46.221.213:21005/basic/v1',
          ws: true,
          secure: false,
        },
      },
    },
    // AWS SDK v3 支持配置
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
      include: ['@aws-sdk/client-s3', '@aws-sdk/lib-storage']
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    resolve: {
      alias: {
        util: 'util/',
      },
    },
    define: {
      'process.env': {},
      'process.browser': true,
      'process.version': '"v16.0.0"',
      'process.platform': '"browser"'
    },
  });

  return {
    application: {},
    vite: viteConfig,
  };
});
