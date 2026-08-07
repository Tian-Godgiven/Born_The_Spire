import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path"
import vueDevTools from 'vite-plugin-vue-devtools'

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  base: process.env.GITHUB_ACTIONS ? '/Born_The_Spire/' : '/',
  plugins: [vue(),vueDevTools(),],
  build: {
    target: 'esnext',
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
      // 代码目录通过 sshfs 挂载时，inotify 收不到任何文件事件，HMR 会彻底失效
      // （表现为改了代码页面毫无反应，必须重启 dev server）。轮询是唯一可行的方式
      usePolling: true,
      interval: 300,
    },
  },
  resolve: {
        // 配置路径别名
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@scss': path.resolve(__dirname, './src/ui/styles'),
        },
    },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
}));
