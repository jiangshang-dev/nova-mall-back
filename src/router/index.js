import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { syncPermCache } from '@/directives/auth'

const Layout = () => import('@/layouts/BasicLayout.vue')

export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'Root',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页' },
      },
    ],
  },
]

const viewModules = import.meta.glob('../views/**/index.vue')

/**
 * 解析后端 component 字段到本地页面，如 system/user/index
 */
function resolveComponent(component) {
  if (!component || component === 'Layout') {
    return () => import('@/views/dashboard/index.vue')
  }
  const withVue = `../views/${component}.vue`
  if (viewModules[withVue]) {
    return viewModules[withVue]
  }
  return () => import('@/views/dashboard/index.vue')
}

/**
 * 将后端菜单转为 Vue Router 子路由（扁平 type=2）
 */
export function buildMenusRoutes(menus = []) {
  const list = Array.isArray(menus) ? menus : []
  return list
    .filter((item) => item.type === 2 && item.path && item.component)
    .map((item) => ({
      path: String(item.path).replace(/^\//, ''),
      name: item.perms || item.path,
      component: resolveComponent(item.component),
      meta: { title: item.name, perms: item.perms },
    }))
}

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
})

let dynamicAdded = false
const dynamicRouteNames = []

export function resetDynamicRoutes() {
  dynamicRouteNames.splice(0).forEach((name) => {
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  })
  dynamicAdded = false
}

/**
 * 按权限菜单动态注册业务路由
 */
export async function setupDynamicRoutes(menus) {
  if (dynamicAdded) {
    return
  }
  const children = buildMenusRoutes(menus)
  children.forEach((r) => {
    router.addRoute('Root', r)
    dynamicRouteNames.push(r.name)
  })
  dynamicAdded = true
}

router.beforeEach(async (to, from, next) => {
  const store = useUserStore()
  if (to.meta.public) {
    next()
    return
  }
  if (!store.token) {
    next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    return
  }
  if (!store.userName) {
    try {
      const data = await store.fetchInfo()
      syncPermCache(data.permissions, data.roles)
      await setupDynamicRoutes(data.menus)
      next({ ...to, replace: true })
    } catch (e) {
      store.clear()
      resetDynamicRoutes()
      next('/login')
    }
    return
  }
  next()
})

export default router
