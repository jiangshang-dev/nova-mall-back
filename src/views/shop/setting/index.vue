<template>
  <PageWrapper title="店铺设置" content="单商家店铺基本信息（一期本地草稿，二期持久化到配置表）">
    <a-form :model="form" layout="vertical" style="max-width: 560px">
      <a-form-item label="店铺名称">
        <a-input v-model:value="form.name" />
      </a-form-item>
      <a-form-item label="客服电话">
        <a-input v-model:value="form.phone" />
      </a-form-item>
      <a-form-item label="店铺简介">
        <a-textarea v-model:value="form.intro" :rows="4" />
      </a-form-item>
      <a-form-item label="退货地址">
        <a-input v-model:value="form.address" />
      </a-form-item>
      <a-button type="primary" preIcon="ant-design:save-outlined" @click="onSave">保存</a-button>
    </a-form>
  </PageWrapper>
</template>

<script setup>
import { reactive } from 'vue'
import { message } from 'ant-design-vue'

const KEY = 'nova-shop-setting'
const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
const form = reactive(
  saved || {
    name: 'Nova 自营旗舰店',
    phone: '400-000-0000',
    intro: 'Nova Mall 单商家自营商城，正品保障。',
    address: '广东省深圳市南山区科技园',
  }
)

function onSave() {
  localStorage.setItem(KEY, JSON.stringify({ ...form }))
  message.success('已保存到本地（二期写入系统配置）')
}
</script>
