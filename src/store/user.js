import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, getInfo } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('Access-Token') || '',
    userName: '',
    userRealName: '',
    roles: [],
    permissions: [],
    menus: [],
  }),
  actions: {
    async login(form) {
      const res = await loginApi(form)
      this.token = res.data.token
      localStorage.setItem('Access-Token', this.token)
      await this.fetchInfo()
    },
    async fetchInfo() {
      const res = await getInfo()
      const data = res.data || {}
      this.userName = data.userName
      this.userRealName = data.userRealName
      this.roles = data.roles || []
      this.permissions = data.permissions || []
      this.menus = data.menus || []
      return data
    },
    async logout() {
      try {
        await logoutApi()
      } catch (e) {
        // ignore
      }
      this.clear()
    },
    clear() {
      this.token = ''
      this.userName = ''
      this.userRealName = ''
      this.roles = []
      this.permissions = []
      this.menus = []
      localStorage.removeItem('Access-Token')
    },
    hasPerm(perm) {
      if (!perm) return true
      if (this.roles.includes('SUPER_ADMIN')) return true
      return this.permissions.includes(perm)
    },
  },
})
