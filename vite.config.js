import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { jeecgVirtualModules } from './build/vite/jeecgVirtualModules.js'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_PORT) || 3100
  const proxyTarget = env.VITE_PROXY_URL || 'http://localhost:8082'
  const apiPrefix = env.VITE_GLOB_API_URL || '/api'

  return {
    plugins: [vue(), jeecgVirtualModules()],
    resolve: {
      alias: [
        { find: '/@', replacement: srcPath },
        { find: '@', replacement: srcPath },
      ],
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            namespace: 'nova',
            'component-background': '#ffffff',
          },
          additionalData: `
            @namespace: nova;
            @component-background: #ffffff;
            @iconify-bg-color: #5551;
            @page-footer-z-index: 99;
            @border-color-base: #f0f0f0;
          `,
        },
      },
    },
    server: {
      port,
      proxy: {
        // 将 VITE_GLOB_API_URL 前缀代理到 VITE_PROXY_URL
        [apiPrefix]: {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
