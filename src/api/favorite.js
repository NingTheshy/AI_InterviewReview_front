import request from './request'

// 收藏题目
export function addFavorite(data) {
  return request.post('/favorites', data)
}

// 取消收藏
export function removeFavorite(id) {
  return request.delete(`/favorites/${id}`)
}

// 获取收藏列表
export function getFavoriteList(params) {
  return request.get('/favorites', { params })
}
