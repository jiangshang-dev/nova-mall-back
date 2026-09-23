import request from '@/utils/request'

export function login(data) {
  return request.post('/auth/login', { ...data, clientType: 'admin' })
}

export function logout() {
  return request.post('/auth/logout')
}

export function getInfo() {
  return request.get('/auth/info')
}
