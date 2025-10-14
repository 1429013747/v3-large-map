// import Plot from '@jiamt/ol-plot-vue'
// 导入Ant Design Vue
import Antd from 'ant-design-vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// 导入所有样式，这样就不需要每个组件单独导入样式了
import 'ant-design-vue/dist/reset.css'
// 导入 OpenLayers 样式
import 'ol/ol.css'
// 导入自定义指令
import { vLoading, loading } from './directives'
// 导入 loading 样式
import './directives/loading.css'

import Vue3TreeOrg from "vue3-tree-org";
import "vue3-tree-org/lib/vue3-tree-org.css";

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)
app.use(Antd)
app.use(pinia)
app.use(router)
app.use(Vue3TreeOrg)

// 注册全局指令
app.directive('loading', vLoading)

// 将 loading 方法挂载到全局属性
app.config.globalProperties.$loading = loading

app.mount('#app')
