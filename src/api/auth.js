import request from './request'

// 发送邮箱验证码
export function sendCode(data) {
  return request.post('/auth/send-code', data)
}

// 用户注册
export function register(data) {
  return request.post('/auth/register', data)
}

// 用户登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 用户登出
export function logout() {
  return request.post('/auth/logout')
}

// 获取当前用户信息
export function getProfile() {
  return request.get('/auth/profile')
}

// 更新用户信息
export function updateProfile(data) {
  return request.put('/auth/profile', data)
}

// 上传当前用户头像；请求由浏览器自动设置 multipart 边界。
export function uploadAvatar(file) {
  const data = new FormData()
  data.append('file', file)
  return request.post('/auth/profile/avatar', data)
}

// 修改密码
export function changePassword(data) {
  return request.put('/auth/password', data)
}
