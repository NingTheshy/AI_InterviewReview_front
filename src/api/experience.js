import request from './request'

// 获取经验广场列表
export function getExperienceList(params) {
  return request.get('/experiences', { params })
}

// 获取经验详情
export function getExperienceDetail(token) {
  return request.get(`/experiences/${token}`)
}

// 获取经验评论列表
export function getExperienceComments(token, params) {
  return request.get(`/experiences/${token}/comments`, { params })
}

// 发表评论
export function addComment(token, data) {
  return request.post(`/experiences/${token}/comments`, data)
}

// 删除评论
export function deleteComment(id) {
  return request.delete(`/comments/${id}`)
}
