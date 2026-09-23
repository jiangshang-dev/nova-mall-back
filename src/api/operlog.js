import request from '@/utils/request'

export function pageOperLogs(params) {
  return request.get('/system/operlog/page', { params })
}
