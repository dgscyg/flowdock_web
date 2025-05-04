import { defineConfig } from '@vben/vite-config';
import ElementPlus from 'unplugin-element-plus/vite';
import { defineConfig as defineViteConfig } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

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
            // target: 'https://dragon.com',
            target: 'https://flowdock.anobodys.com',
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
        plugins: [
          NodeGlobalsPolyfillPlugin({
            process: true,
          }),
          NodeModulesPolyfillPlugin()
        ]
      },
      include: [
        '@aws-sdk/client-s3', 
        '@aws-sdk/lib-storage', 
        '@aws-sdk/s3-request-presigner'
      ]
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        external: [],
        output: {
          manualChunks: {
            'aws-sdk': [
              '@aws-sdk/client-s3',
              '@aws-sdk/lib-storage',
              '@aws-sdk/s3-request-presigner'
            ]
          }
        }
      }
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
