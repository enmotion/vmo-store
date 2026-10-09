import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 1980
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    coverage: {
      include: ['index.ts', 'use.lib/**/*.ts'],
      provider: 'v8',
      reportsDirectory: './test/reports/unit/coverage',
      reporter: ['text', 'html', 'json', 'json-summary', 'clover'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100, perFile: true }
    }
  },
  build: {
    // Vite 模块打包模式 配置
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'vmo-store',
      fileName: 'vmo-store'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src'), // 用于开发的 src 文件夹
      '@type': resolve(__dirname, 'types'), // ts 描述文件夹
      '@comps': resolve(__dirname, 'components'), // 组件模块文件夹
      '@lib': resolve(__dirname, 'use.lib') // 文件模块文件夹
    }
  }
})
