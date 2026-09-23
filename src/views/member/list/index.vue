<template>
  <PageWrapper title="会员列表" content="C 端商城会员（与后台管理员共用用户表，按角色区分）" dense contentBackground>
    <a-space style="margin-bottom: 16px">
      <a-input v-model:value="query.userName" placeholder="用户名" allow-clear style="width: 180px" />
      <a-button type="primary" preIcon="ant-design:search-outlined" @click="load">查询</a-button>
    </a-space>
    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      row-key="id"
      :pagination="pagination"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'green' : 'red'">{{ record.status === 1 ? '正常' : '禁用' }}</a-tag>
        </template>
      </template>
    </a-table>
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { pageUsers } from '@/api/user'

const loading = ref(false)
const list = ref([])
const query = reactive({ userName: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '用户名', dataIndex: 'userName' },
  { title: '姓名', dataIndex: 'userRealName' },
  { title: '手机', dataIndex: 'phone' },
  { title: '邮箱', dataIndex: 'email' },
  { title: '状态', key: 'status', width: 90 },
]

async function load() {
  loading.value = true
  try {
    const res = await pageUsers({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      userName: query.userName,
    })
    list.value = res.data.result || []
    pagination.total = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function onTableChange(p) {
  pagination.current = p.current
  pagination.pageSize = p.pageSize
  load()
}

onMounted(load)
</script>
