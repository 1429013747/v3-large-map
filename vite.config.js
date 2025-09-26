import { fileURLToPath, URL } from 'node:url'
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv } from 'vite'
import viteCompression from 'vite-plugin-compression'
import svgLoader from 'vite-svg-loader'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  // eslint-disable-next-line node/prefer-global/process
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // 部署时的基础路径，默认是 '/'
    base: env.VITE_PUBLIC_PATH || './',
    server: {
      // host: true, // 监听所有地址，包括局域网和公网地址
      host: 'localhost', // 监听localhost地址
      proxy: {
        '/api': {
          target: 'http://192.168.113.174:6018',
          changeOrigin: true
          // rewrite: path => path.replace(/^\/api/, '/ccgf')
        }
      }
    },
    plugins: [
      VueRouter({
        routesFolder: 'src/views',
        dts: true
      }),
      vue(),
      svgLoader(),
      // 配置自动导入组件
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false, // 关闭自动导入样式
            resolveIcons: true // 自动导入图标
          })
        ],
        dts: true, // 生成组件类型
        dirs: ['src/components', 'src/layouts'], // 指定组件目录
        types: [{
          from: 'vue-router', // 生成路由类型
          names: ['RouterLink', 'RouterView'] // 生成路由类型
        }]
      }),
      AutoImport({
        imports: [
          'vue',
          VueRouterAutoImports,
          'pinia',
          '@vueuse/core'
        ],
        dts: false, // 生成组件类型
        dirs: ['src/composables', 'src/stores'], // 指定组合式函数目录
        vueTemplate: true
      }),
      // gzip 压缩
      mode === 'production' && viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz'
      }),
      legacy({
        // targets: ['ie >= 11']
        targets: ['defaults', 'not IE 11']

      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': fileURLToPath(new URL('./src/assets', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
          @use "@/styles/variables.scss" as *;
          @use "@/styles/measure.scss" as *;
          @use "@/styles/ship-context-menu.scss" as *;
          @use "@/styles/layer-control.scss" as *;
          @use "@/styles/ship-popup.scss" as *;
          @use "@/styles/bottom-statistics.scss" as *;
          @use "@/styles/popup-common.scss" as *;
          @use "@/styles/marker-popup.scss" as *;
          @use "@/styles/global.scss" as *;
          `
        }
      }
    },
    build: {
      // 指定输出目录
      outDir: 'dist',
      // 启用 CSS 代码分割
      cssCodeSplit: true,
      // 禁用源码映射
      sourcemap: false,
      // 自定义底层的 Rollup 打包配置
      rollupOptions: {
        output: {
          // 分包策略
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'antd-vendor': ['ant-design-vue'],
            'utils-vendor': ['axios', '@vueuse/core']
          },
          // 用于从入口点创建的块的打包输出格式[name]表示文件名,[hash]表示该文件内容hash值
          chunkFileNames: 'assets/js/[name]-[hash].js',
          // 用于输出静态资源的命名，[ext]表示文件扩展名
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },
      // 设置最终构建的浏览器兼容目标
      target: 'es2015',
      // 设置为 false 可以禁用最小化混淆
      minify: 'terser',
      // 启用/禁用 brotli 压缩大小报告
      brotliSize: false,
      // chunk 大小警告的限制（以 kbs 为单位）
      chunkSizeWarningLimit: 2000,
      // terser 压缩配置
      terserOptions: {
        compress: {
          // 生产环境时移除 console
          drop_console: true,
          drop_debugger: true
        }
      }
    },
  }
})
