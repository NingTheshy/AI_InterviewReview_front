import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken, removeToken } from '@/utils/auth'
import router from '@/router'

NProgress.configure({ showSpinner: false })

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 30000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    NProgress.start()
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    NProgress.done()
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    NProgress.done()
    const res = response.data

    // 统一响应格式: { code, message, data }
    if (res.code !== 200) {
      // 401: 未登录或 token 过期
      if (res.code === 401) {
        ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          removeToken()
          router.push('/login')
        })
      } else if (!response.config.skipErrorMessage) {
        ElMessage.error(res.message || '请求失败')
      }

      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  error => {
    NProgress.done()

    if (error.config?.skipErrorMessage) {
      return Promise.reject(error)
    }
    if (error.response) {
      const { status, data } = error.response
      const message = data?.message || error.message || '请求失败'
      switch (status) {
        case 401:
          ElMessage.error(message || '未授权，请登录')
          removeToken()
          router.push('/login')
          break
        case 403:
          ElMessage.error(message || '拒绝访问')
          break
        case 404:
          ElMessage.error(message || '请求地址不存在')
          break
        case 500:
          ElMessage.error(message || '服务器内部错误')
          break
        default:
          ElMessage.error(message)
      }
    } else {
      ElMessage.error('网络连接异常')
    }

    return Promise.reject(error)
  }
)

export default service
