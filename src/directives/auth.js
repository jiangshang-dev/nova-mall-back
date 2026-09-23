export function setupAuthDirective(app) {
  app.directive('auth', {
    mounted(el, binding) {
      const store = window.__userStore
      const perm = binding.value
      if (!perm) return
      // 延迟到 pinia 可用时由组件侧检查；此处读 localStorage 权限缓存
      const raw = localStorage.getItem('nova-perms')
      const perms = raw ? JSON.parse(raw) : []
      const roles = JSON.parse(localStorage.getItem('nova-roles') || '[]')
      if (roles.includes('SUPER_ADMIN')) return
      if (!perms.includes(perm)) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    },
  })
}

export function syncPermCache(permissions, roles) {
  localStorage.setItem('nova-perms', JSON.stringify(permissions || []))
  localStorage.setItem('nova-roles', JSON.stringify(roles || []))
}
