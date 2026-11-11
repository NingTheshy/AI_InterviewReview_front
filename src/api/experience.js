import request from './request'

// 获取经验广场列表
export function getExperienceList(params) {
  return request.get('/experiences', { params })
}

// 获取经验详情
export function getExperienceDetail(id) {
  return request.get(`/experiences/${id}`)
}

// 获取经验评论列表
export function getExperienceComments(id, params) {
  return request.get(`/experiences/${id}/comments`, { params })
}

// 发表评论
export function addComment(id, data) {
  return request.post(`/experiences/${id}/comments`, data)
}

// 删除评论
export function deleteComment(id) {
  return request.delete(`/comments/${id}`)
}
