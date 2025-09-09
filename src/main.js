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

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)
app.use(Antd)
app.use(pinia)
app.use(router)

app.mount('#app')
