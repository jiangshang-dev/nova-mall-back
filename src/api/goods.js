import request from '@/utils/request'

export function pageGoods(params) {
  return request.get('/goods/admin/page', { params })
}

export function addGoods(data) {
  return request.post('/goods/admin', data)
}

export function updateGoods(data) {
  return request.put('/goods/admin', data)
}

export function removeGoods(id) {
  return request.delete(`/goods/admin/${id}`)
}

export function listCategories() {
  return request.get('/goods/admin/category/list')
}

export function treeCategories() {
  return request.get('/goods/admin/category/tree')
}

export function saveCategory(data) {
  if (data.id) return request.put('/goods/admin/category', data)
  return request.post('/goods/admin/category', data)
}

export function removeCategory(id) {
  return request.delete(`/goods/admin/category/${id}`)
}
