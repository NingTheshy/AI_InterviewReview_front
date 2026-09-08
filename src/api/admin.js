import request from './request'

// ========== 用户管理 ==========
export function getUserList(params) {
  return request.get('/admin/users', { params })
}

export function getUserDetail(id) {
  return request.get(`/admin/users/${id}`)
}

export function updateUserStatus(id, data) {
  return request.put(`/admin/users/${id}/status`, data)
}

export function updateUserRole(id, data) {
  return request.put(`/admin/users/${id}/role`, data)
}

// ========== 统计 ==========
export function getStatsOverview() {
  return request.get('/admin/stats/overview')
}

// ========== 面试管理 ==========
export function getAdminInterviewList(params) {
  return request.get('/admin/interviews', { params })
}

// ========== 经验管理 ==========
export function getAdminExperienceList(params) {
  return request.get('/admin/experiences', { params })
}

export function setExperienceStatus(token, data) {
  return request.put(`/admin/experiences/${token}/status`, data)
}

// ========== 评论管理 ==========
export function getAdminCommentList(params) {
  return request.get('/admin/comments', { params })
}

export function deleteAdminComment(id) {
  return request.delete(`/admin/comments/${id}`)
}
