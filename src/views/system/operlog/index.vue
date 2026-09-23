<template>
  <PageWrapper title="操作日志" dense contentBackground>
    <a-space style="margin-bottom: 16px">
      <a-input v-model:value="query.title" placeholder="模块标题" allow-clear style="width: 180px" />
      <a-input v-model:value="query.operName" placeholder="操作人" allow-clear style="width: 180px" />
      <a-button type="primary" @click="load">查询</a-button>
    </a-space>
    <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange" />
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { pageOperLogs } from '@/api/operlog'

const loading = ref(false)
const list = ref([])
const query = reactive({ title: '', operName: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const columns = [
  { title: '模块', dataIndex: 'title', width: 120 },
  { title: '操作人', dataIndex: 'operName', width: 100 },
  { title: 'URL', dataIndex: 'operUrl' },
  { title: 'IP', dataIndex: 'operIp', width: 120 },
  { title: '耗时(ms)', dataIndex: 'costTime', width: 100 },
  { title: '状态', dataIndex: 'status', width: 80, customRender: ({ text }) => (text === 1 ? '成功' : '失败') },
]

async function load() {
  loading.value = true
  try {
    const res = await pageOperLogs({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      title: query.title,
      operName: query.operName,
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
