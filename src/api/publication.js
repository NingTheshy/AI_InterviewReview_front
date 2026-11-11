import request from './request'

// 发布一场已完成面试的公开面经
export function publishExperience(interviewId, summaryMarkdown) {
  return request.post(`/interviews/${interviewId}/publication`, { summaryMarkdown })
}

// 获取当前面试的发布状态
export function getPublication(interviewId) {
  return request.get(`/interviews/${interviewId}/publication`, { skipErrorMessage: true })
}

// 修改公开面经总结
export function updatePublication(interviewId, summaryMarkdown) {
  return request.put(`/interviews/${interviewId}/publication`, { summaryMarkdown })
}

// 主动撤回公开面经
export function withdrawPublication(interviewId) {
  return request.delete(`/interviews/${interviewId}/publication`)
}
