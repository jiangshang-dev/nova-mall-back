<template>
  <PageWrapper title="商品评价" content="前台用户评价管理，可显示或隐藏" dense contentBackground>
    <a-space style="margin-bottom: 16px">
      <a-input-number v-model:value="query.goodsId" placeholder="商品ID" :min="1" style="width: 140px" />
      <a-select v-model:value="query.status" allow-clear placeholder="状态" style="width: 120px"
        :options="[{ value: 1, label: '显示' }, { value: 0, label: '隐藏' }]"
      />
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
        <template v-if="column.key === 'star'">
          <a-rate :value="record.star" disabled style="font-size: 12px" />
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'green' : 'default'">{{ record.status === 1 ? '显示' : '隐藏' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" @click="onToggle(record)">
            {{ record.status === 1 ? '隐藏' : '显示' }}
          </a-button>
        </template>
      </template>
    </a-table>
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { pageComments, updateCommentStatus } from '@/api/comment'

const loading = ref(false)
const list = ref([])
const query = reactive({ goodsId: undefined, status: undefined })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const columns = [
  { title: 'ID', dataIndex: 'id', width: 70 },
  { title: '商品ID', dataIndex: 'goodsId', width: 90 },
  { title: '用户', dataIndex: 'userName', width: 120 },
  { title: '星级', key: 'star', width: 140 },
  { title: '内容', dataIndex: 'content', ellipsis: true },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 90 },
]

async function load() {
  loading.value = true
  try {
    const res = await pageComments({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      goodsId: query.goodsId,
      status: query.status,
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

async function onToggle(record) {
  const next = record.status === 1 ? 0 : 1
  await updateCommentStatus(record.id, next)
  message.success(next === 1 ? '已显示' : '已隐藏')
  load()
}

onMounted(load)
</script>
