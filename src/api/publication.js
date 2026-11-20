import request from './request'

// 发布一场已完成面试的公开面经
export function publishExperience(interviewId, body) {
  return request.post(`/interviews/${interviewId}/publication`, body)
}

export function getPublicationCandidates(interviewId) {
  return request.get(`/interviews/${interviewId}/publication/candidates`)
}

// 获取当前面试的发布状态
export function getPublication(interviewId) {
  return request.get(`/interviews/${interviewId}/publication`, { skipErrorMessage: true })
}

// 修改公开面经总结
export function updatePublication(experienceId, body) {
  return request.put(`/me/experiences/${experienceId}`, body)
}

// 主动撤回公开面经
export function deletePublication(experienceId) {
  return request.delete(`/me/experiences/${experienceId}`)
}

export function getMyExperiences(params) { return request.get('/me/experiences', { params }) }
export function getExperienceEditor(id) { return request.get(`/me/experiences/${id}`) }
export function getExperienceFavorites(params) { return request.get('/me/experience-favorites', { params }) }
