import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'

// 自定义插件：在 Vite 模块转换管道之前直接提供 /vad/ 下的静态资源，
// 避免 Vite 将 .mjs 文件当作 ESM 模块进行转换导致 ONNX Runtime 加载失败。
function serveVadAssets() {
  return {
    name: 'serve-vad-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/vad/')) return next()

        // 去掉 Vite 添加的 ?import 等查询参数，还原真实文件路径
        const cleanUrl = url.split('?')[0]
        const filePath = path.join(__dirname, 'public', cleanUrl)

        if (!fs.existsSync(filePath)) return next()

        const ext = path.extname(filePath)
        const contentTypes = {
          '.mjs': 'application/javascript',
          '.js': 'application/javascript',
          '.wasm': 'application/wasm',
          '.onnx': 'application/octet-stream',
        }
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    serveVadAssets(),
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  build: {
    outDir: path.resolve(__dirname, '../backend/static/frontend'), // 打包到 Django static
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
