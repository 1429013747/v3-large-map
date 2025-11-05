import router from '@/router'
import { message, Modal, notification } from 'ant-design-vue'
import axios from 'axios'

// 加载指示器
let loadingInstance = null

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_API,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在请求发送之前做一些处理
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (config.loading) {
      // 使用message.loading替代vant的showLoadingToast
      loadingInstance = message.loading('加载中...', 0)
    }

    if (config.responseType === 'blob') {
      // 检查response.data是否为Blob且类型为application/json
      if (config.data instanceof Blob && config.data.type === 'application/json') {
        // 解析Blob内容获取错误信息
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const data = JSON.parse(reader.result)
              message.error(data.message || '请求出错')
              reject(data)
            } catch (e) {
              message.error('请求出错')
              reject(e)
            }
          }
          reader.onerror = () => {
            message.error('请求出错')
            reject(new Error('解析错误'))
          }
          reader.readAsText(config.data)
        })
      }
      return config
    }
    return config
  },
  (error) => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 关闭加载指示器
    if (loadingInstance) {
      loadingInstance()
      loadingInstance = null
    }

    const res = response.data

    if (res.code !== 200) {
      // 使用message.error替代vant的showToast
      message.error(res.message || '请求失败')

      // 401: 未登录或token过期
      if (res.code === 401 || res.code === 1011008 || res.code === 1011006) {
        localStorage.removeItem('token')
        localStorage.clear()
        router.push('/login')
      }

      return Promise.reject(res)
    }

    return res
  },
  (error) => {
    // 关闭加载指示器
    if (loadingInstance) {
      loadingInstance()
      loadingInstance = null
    }

    console.error('响应错误：', error)

    // 使用notification替代vant的showToast
    notification.error({
      message: '请求错误',
      description: error.message || '网络错误'
    })

    return Promise.reject(error)
  }
)

export default service
export { service as request }
