import request from './request'

// 创建面试（音频 + 已解析简历 + JD）
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

// 取消处理中的面试
export function cancelInterview(id) {
  return request.post(`/interviews/${id}/cancel`)
}

// 对已完成面试重新执行问答识别和评分（不重复 ASR）
export function reanalyzeInterview(id) {
  return request.post(`/interviews/${id}/reanalyze`)
}

// 修改面试标题
export function updateInterviewTitle(id, title) {
  return request.put(`/interviews/${id}/title`, { title })
}

// 获取七天内可恢复的面试
export function getInterviewRecycleBin() {
  return request.get('/interviews/recycle-bin')
}

// 恢复已删除面试
export function restoreInterview(id) {
  return request.post(`/interviews/${id}/restore`)
}

// 校正说话人角色并重新分析
export function updateSpeakerRoles(id, mappings) {
  return request.put(`/interviews/${id}/speaker-roles`, { mappings })
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
