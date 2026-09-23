import request from '@/utils/request'

export function menuTree() {
  return request.get('/system/menu/tree')
}

export function addMenu(data) {
  return request.post('/system/menu', data)
}

export function updateMenu(data) {
  return request.put('/system/menu', data)
}

export function removeMenu(id) {
  return request.delete(`/system/menu/${id}`)
}
