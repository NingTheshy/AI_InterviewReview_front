import request from './request'

// 上传简历并创建异步解析任务
export function uploadResume(file) {
  const data = new FormData()
  data.append('file', file)
  return request.post('/resumes', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 获取当前用户未隐藏的简历版本
export function getResumeList() {
  return request.get('/resumes')
}

// 获取简历解析状态
export function getResumeDetail(id) {
  return request.get(`/resumes/${id}`)
}

// 重试失败的简历解析
export function retryResume(id) {
  return request.post(`/resumes/${id}/retry`)
}

// 从简历库隐藏简历
export function deleteResume(id) {
  return request.delete(`/resumes/${id}`)
}
