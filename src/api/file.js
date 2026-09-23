import request from '@/utils/request'

/**
 * 上传文件，返回可访问 URL（字符串）
 */
export function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  return request.post('/file/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
}
