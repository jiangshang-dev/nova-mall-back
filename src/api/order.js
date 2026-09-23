import request from '@/utils/request'

export function pageOrders(params) {
  return request.get('/order/admin/page', { params })
}

export function shipOrder(orderNo) {
  return request.post(`/order/admin/${orderNo}/ship`)
}

export function verifyCodOrder(orderNo) {
  return request.post(`/order/admin/${orderNo}/verify-cod`)
}
