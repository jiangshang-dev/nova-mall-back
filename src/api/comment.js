import request from '@/utils/request'

export function pageComments(params) {
  return request.get('/goods/admin/comments/page', { params })
}

export function updateCommentStatus(id, status) {
  return request.put(`/goods/admin/comments/${id}/status`, null, { params: { status } })
}
