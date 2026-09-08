import request from './request'

// 创建分享链接
export function createShare(interviewId, data) {
  return request.post(`/interviews/${interviewId}/share`, data)
}

// 获取分享记录列表
export function getShareList(interviewId) {
  return request.get(`/interviews/${interviewId}/shares`)
}

// 撤销分享
export function deleteShare(token) {
  return request.delete(`/shares/${token}`)
}

// 切换公开状态
export function toggleSharePublic(token) {
  return request.put(`/shares/${token}/public`)
}

// 访问分享页（公开，无需登录）
export function getShareDetail(token) {
  return request.get(`/share/${token}`)
}
