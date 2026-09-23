<template>
  <a-layout class="layout-root">
    <a-layout-sider v-model:collapsed="collapsed" collapsible theme="dark" width="220">
      <div class="logo">
        <Icon icon="ant-design:shop-outlined" :size="20" style="margin-right:8px" />
        <span v-if="!collapsed">自营后台</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        :items="menuItems"
        @click="onMenuClick"
      />
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <div class="header-right">
          <span class="user-name">{{ userStore.userRealName || userStore.userName }}</span>
          <a-button type="link" @click="handleLogout">退出</a-button>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { resetDynamicRoutes } from '@/router'
import {
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  FileSearchOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  ShopOutlined,
} from '@ant-design/icons-vue'
import { h } from 'vue'

const collapsed = ref(false)
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const selectedKeys = ref([route.path])

watch(() => route.path, (p) => {
  selectedKeys.value = [p]
})

const iconMap = {
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  FileSearchOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  ShopOutlined,
}

function toMenuItems(menus) {
  const list = menus || []
  const roots = list.filter((m) => !m.parentId || m.parentId === 0)
  const childrenOf = (pid) => list.filter((m) => m.parentId === pid && m.type !== 3 && m.visible !== 0)
  const mapNode = (m) => {
    const kids = childrenOf(m.id).map(mapNode)
    const IconComp = iconMap[m.icon]
    return {
      key: m.path || String(m.id),
      label: m.name,
      icon: IconComp ? () => h(IconComp) : undefined,
      children: kids.length ? kids : undefined,
    }
  }
  const items = [
      {
        key: '/dashboard',
        label: '经营概览',
        icon: () => h(DashboardOutlined),
      },
    ...roots.filter((m) => m.type === 1 || m.type === 2).map(mapNode),
  ]
  return items
}

const menuItems = computed(() => toMenuItems(userStore.menus))

function onMenuClick({ key }) {
  if (key && key.startsWith('/')) {
    router.push(key)
  }
}

async function handleLogout() {
  await userStore.logout()
  resetDynamicRoutes()
  router.replace('/login')
}
</script>

<style scoped>
.layout-root { min-height: 100vh; }
.logo {
  height: 48px;
  margin: 12px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 1px;
  background: linear-gradient(120deg, #1677ff 0%, #69b1ff 100%);
  border-radius: 8px;
}
.header {
  background: #fff;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.header-right { display: flex; align-items: center; gap: 8px; }
.user-name { color: #333; }
.content {
  margin: 16px;
  padding: 16px;
  background: #fff;
  min-height: 280px;
  border-radius: 8px;
}
</style>
