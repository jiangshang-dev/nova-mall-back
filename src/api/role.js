import request from '@/utils/request'

export function pageRoles(params) {
  return request.get('/system/role/page', { params })
}

export function listRoles() {
  return request.get('/system/role/list')
}

export function getRolePermissions(id) {
  return request.get(`/system/role/${id}/permissions`)
}

export function addRole(data) {
  return request.post('/system/role', data)
}

export function updateRole(data) {
  return request.put('/system/role', data)
}

export function removeRole(id) {
  return request.delete(`/system/role/${id}`)
}
