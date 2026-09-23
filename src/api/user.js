import request from '@/utils/request'

export function pageUsers(params) {
  return request.get('/system/user/page', { params })
}

export function addUser(data) {
  return request.post('/system/user', data)
}

export function updateUser(data) {
  return request.put('/system/user', data)
}

export function removeUser(id) {
  return request.delete(`/system/user/${id}`)
}

export function resetPassword(id, password) {
  return request.put(`/system/user/${id}/reset-password`, null, { params: { password } })
}
