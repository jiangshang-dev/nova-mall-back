import request from '@/utils/request'

export function listFreightAdmin() {
  return request.get('/freight/admin/list')
}

export function saveFreight(data) {
  return request.post('/freight/admin/save', data)
}

export function getServiceCity() {
  return request.get('/freight/admin/service-city')
}

export function setServiceCity(city) {
  return request.put('/freight/admin/service-city', { city })
}
