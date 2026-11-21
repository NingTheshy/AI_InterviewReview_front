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

export function getAdminInterviewDetail(id) {
  return request.get(`/admin/interviews/${id}`)
}

export function cancelAdminInterview(id) {
  return request.post(`/admin/interviews/${id}/cancel`)
}

export function retryAdminInterview(id) {
  return request.post(`/admin/interviews/${id}/retry`)
}

export function editAdminInterview(id, data) {
  return request.put(`/admin/interviews/${id}`, data)
}

export function deleteAdminInterview(id) {
  return request.delete(`/admin/interviews/${id}`)
}

export function restoreAdminInterview(id) {
  return request.post(`/admin/interviews/${id}/restore`)
}

// ========== 经验管理 ==========
export function getAdminExperienceList(params) {
  return request.get('/admin/experiences', { params })
}

export function getAdminExperienceDetail(id) {
  return request.get(`/admin/experiences/${id}`)
}

export function setExperienceStatus(id, data) {
  return request.put(`/admin/experiences/${id}/status`, data)
}

// ========== 评论管理 ==========
export function getAdminCommentList(params) {
  return request.get('/admin/comments', { params })
}

export function getAdminCommentDetail(id) {
  return request.get(`/admin/comments/${id}`)
}

export function deleteAdminComment(id) {
  return request.delete(`/admin/comments/${id}`)
}

// ========== 审计日志 ==========
export function getAuditLogList(params) {
  return request.get('/admin/audit-logs', { params })
}
