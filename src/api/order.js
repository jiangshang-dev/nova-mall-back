import request from '@/utils/request'

export function pageOrders(params) {
  return request.get('/order/admin/page', { params })
}
