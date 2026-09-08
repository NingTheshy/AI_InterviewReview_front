import request from './request'

// 上传面试（音频+简历+JD）
export function uploadInterview(data) {
  return request.post('/interviews/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 获取面试列表
export function getInterviewList(params) {
  return request.get('/interviews', { params })
}

// 获取面试详情
export function getInterviewDetail(id) {
  return request.get(`/interviews/${id}`)
}

// 删除面试
export function deleteInterview(id) {
  return request.delete(`/interviews/${id}`)
}

// 获取处理进度
export function getInterviewStatus(id) {
  return request.get(`/interviews/${id}/status`)
}

// 重试失败面试
export function retryInterview(id) {
  return request.post(`/interviews/${id}/retry`)
}

// 获取面试笔记
export function getInterviewNote(id) {
  return request.get(`/interviews/${id}/note`)
}

// 保存面试笔记
export function saveInterviewNote(id, data) {
  return request.put(`/interviews/${id}/note`, data)
}

// 获取题目笔记
export function getQuestionNote(interviewId, questionId) {
  return request.get(`/interviews/${interviewId}/questions/${questionId}/note`)
}

// 保存题目笔记
export function saveQuestionNote(interviewId, questionId, data) {
  return request.put(`/interviews/${interviewId}/questions/${questionId}/note`, data)
}
