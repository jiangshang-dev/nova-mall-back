<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Nova Mall</h1>
      <p class="sub">管理后台</p>
      <a-form :model="form" @finish="onSubmit" layout="vertical">
        <a-form-item name="username" label="账号" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model:value="form.username" size="large" placeholder="admin" />
        </a-form-item>
        <a-form-item name="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="form.password" size="large" placeholder="admin123" />
        </a-form-item>
        <a-button type="primary" html-type="submit" size="large" block :loading="loading">登录</a-button>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/store/user'
import { syncPermCache } from '@/directives/auth'
import { setupDynamicRoutes, resetDynamicRoutes } from '@/router'

const form = reactive({ username: 'admin', password: 'admin123' })
const loading = ref(false)
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

async function onSubmit() {
  loading.value = true
  try {
    resetDynamicRoutes()
    await userStore.login(form)
    syncPermCache(userStore.permissions, userStore.roles)
    await setupDynamicRoutes(userStore.menus)
    message.success('登录成功')
    router.replace(route.query.redirect || '/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 20%, rgba(22,119,255,.18), transparent 40%),
    radial-gradient(circle at 80% 0%, rgba(82,196,26,.12), transparent 35%),
    linear-gradient(160deg, #0f1c2e 0%, #1c3a5f 50%, #0b1524 100%);
}
.login-card {
  width: 400px;
  padding: 36px 32px;
  background: rgba(255,255,255,.96);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
}
.login-card h1 {
  margin: 0;
  font-size: 32px;
  letter-spacing: 1px;
  color: #0f1c2e;
}
.sub {
  margin: 4px 0 24px;
  color: #8c8c8c;
}
</style>
