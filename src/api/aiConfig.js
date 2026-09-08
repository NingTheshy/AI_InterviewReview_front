import request from './request'

// 获取 AI 配置列表
export function getAiConfigList(params) {
  return request.get('/ai-configs', { params })
}

// 获取 AI 配置详情
export function getAiConfigDetail(id) {
  return request.get(`/ai-configs/${id}`)
}

// 创建 AI 配置
export function createAiConfig(data) {
  return request.post('/ai-configs', data)
}

// 更新 AI 配置
export function updateAiConfig(id, data) {
  return request.put(`/ai-configs/${id}`, data)
}

// 删除 AI 配置
export function deleteAiConfig(id) {
  return request.delete(`/ai-configs/${id}`)
}

// 设为默认配置
export function setDefaultAiConfig(id) {
  return request.put(`/ai-configs/${id}/default`)
}
