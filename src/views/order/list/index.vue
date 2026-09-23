<template>
  <PageWrapper title="订单列表" content="商城订单（待支付 / 已支付 / 已取消）" dense contentBackground>
    <a-space style="margin-bottom: 16px">
      <a-input v-model:value="query.orderNo" placeholder="订单号" allow-clear style="width: 220px" />
      <a-select
        v-model:value="query.status"
        allow-clear
        placeholder="状态"
        style="width: 140px"
        :options="statusOptions"
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
        <template v-if="column.key === 'amount'">
          <span class="amt">¥{{ formatPrice(record.totalAmount) }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">{{ record.statusText }}</a-tag>
        </template>
        <template v-else-if="column.key === 'payType'">
          {{ record.payTypeText || '-' }}
        </template>
        <template v-else-if="column.key === 'receiver'">
          <div>{{ record.receiverName }} {{ record.receiverPhone }}</div>
          <div class="sub">{{ record.receiverAddress }}</div>
        </template>
        <template v-else-if="column.key === 'time'">
          {{ formatTime(record.createTime) }}
        </template>
        <template v-else-if="column.key === 'goods'">
          <div v-for="it in record.items || []" :key="it.id" class="g">
            {{ it.goodsName }} × {{ it.quantity }}
          </div>
        </template>
      </template>
    </a-table>
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { pageOrders } from '@/api/order'

const loading = ref(false)
const list = ref([])
const query = reactive({ orderNo: '', status: undefined })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const statusOptions = [
  { value: 0, label: '待支付' },
  { value: 1, label: '已支付' },
  { value: 2, label: '已取消' },
  { value: 3, label: '已发货' },
  { value: 4, label: '已完成' },
]
const columns = [
  { title: '订单号', dataIndex: 'orderNo', width: 200 },
  { title: '商品', key: 'goods' },
  { title: '收货人', key: 'receiver', width: 220 },
  { title: '金额', key: 'amount', width: 100 },
  { title: '支付方式', key: 'payType', width: 100 },
  { title: '状态', key: 'status', width: 90 },
  { title: '下单时间', key: 'time', width: 170 },
]

function formatPrice(p) {
  return Number(p || 0).toFixed(2)
}
function formatTime(ts) {
  if (!ts) return '-'
  const d = new Date(Number(ts))
  if (Number.isNaN(d.getTime())) return '-'
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function statusColor(s) {
  if (s === 0) return 'orange'
  if (s === 1) return 'green'
  if (s === 2) return 'default'
  return 'blue'
}

async function load() {
  loading.value = true
  try {
    const res = await pageOrders({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      orderNo: query.orderNo || undefined,
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

onMounted(load)
</script>

<style scoped>
.amt {
  color: #e1251b;
  font-weight: 600;
}
.sub {
  color: #999;
  font-size: 12px;
}
.g {
  font-size: 13px;
  line-height: 1.5;
}
</style>
