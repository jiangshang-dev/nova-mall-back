<template>
  <PageWrapper title="商品管理" dense contentBackground>
    <a-space style="margin-bottom: 16px">
      <a-input v-model:value="query.name" placeholder="商品名" allow-clear style="width: 180px" />
      <a-button type="primary" preIcon="ant-design:search-outlined" @click="load">查询</a-button>
      <a-button v-auth="'goods:add'" type="primary" preIcon="ant-design:plus-outlined" @click="openEdit()">新增</a-button>
    </a-space>
    <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'cover'">
          <img v-if="record.cover" :src="record.cover" alt="" style="width:48px;height:48px;object-fit:cover" />
        </template>
        <template v-else-if="column.key === 'category'">
          {{ categoryName(record.categoryId) }}
        </template>
        <template v-else-if="column.key === 'price'">
          <div class="price-cell">
            <span class="sale">¥{{ formatPrice(record.price) }}</span>
            <span v-if="record.originalPrice" class="origin">¥{{ formatPrice(record.originalPrice) }}</span>
          </div>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a v-auth="'goods:edit'" @click="openEdit(record)">编辑</a>
            <a-popconfirm title="确认删除？" @confirm="onRemove(record.id)">
              <a v-auth="'goods:remove'" style="color:#ff4d4f">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <BasicModal
      v-model:open="visible"
      :title="form.id ? '编辑商品' : '新增商品'"
      :confirm-loading="saving"
      destroy-on-close
      @ok="onSave"
    >
      <a-form layout="vertical">
        <a-form-item label="名称" required><a-input v-model:value="form.name" /></a-form-item>
        <a-form-item label="副标题"><a-input v-model:value="form.subTitle" /></a-form-item>
        <a-form-item label="分类">
          <a-tree-select
            v-model:value="form.categoryId"
            :tree-data="categoryTreeOptions"
            allow-clear
            tree-default-expand-all
            placeholder="选择分类（可挂任意层级）"
            style="width: 100%"
            :field-names="{ label: 'title', value: 'value', children: 'children' }"
          />
        </a-form-item>
        <a-form-item label="封面">
          <JImageUpload v-model:value="form.cover" :file-max="1" text="上传封面" />
        </a-form-item>
        <a-form-item label="优惠价" required>
          <a-input-number v-model:value="form.price" :min="0" :precision="2" style="width:100%" />
        </a-form-item>
        <a-form-item label="原价">
          <a-input-number v-model:value="form.originalPrice" :min="0" :precision="2" style="width:100%" placeholder="前台划线显示" />
        </a-form-item>
        <a-form-item label="商品详情">
          <a-textarea v-model:value="form.detail" :rows="6" placeholder="支持简单 HTML，如 &lt;p&gt;介绍&lt;/p&gt;" />
        </a-form-item>
        <a-form-item label="库存"><a-input-number v-model:value="form.stock" :min="0" style="width:100%" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="form.status" :options="[{value:1,label:'上架'},{value:0,label:'下架'}]" />
        </a-form-item>
      </a-form>
    </BasicModal>
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { pageGoods, addGoods, updateGoods, removeGoods, listCategories, treeCategories } from '@/api/goods'

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const visible = ref(false)
const categoryTreeOptions = ref([])
const categoryMap = ref({})
const query = reactive({ name: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const form = ref({})
const columns = [
  { title: 'ID', dataIndex: 'id', width: 70 },
  { title: '封面', key: 'cover', width: 80 },
  { title: '名称', dataIndex: 'name' },
  { title: '分类', key: 'category', width: 140 },
  { title: '价格', key: 'price', width: 140 },
  { title: '库存', dataIndex: 'stock', width: 80 },
  { title: '操作', key: 'action', width: 160 },
]

function formatPrice(p) {
  return Number(p || 0).toFixed(2)
}

function categoryName(id) {
  return categoryMap.value[id] || '-'
}

function flattenCats(nodes, map = {}) {
  ;(nodes || []).forEach((n) => {
    map[n.id] = n.name
    if (n.children?.length) flattenCats(n.children, map)
  })
  return map
}

function toTreeSelect(nodes) {
  return (nodes || []).map((n) => ({
    title: n.name,
    value: n.id,
    children: n.children?.length ? toTreeSelect(n.children) : undefined,
  }))
}

async function load() {
  loading.value = true
  try {
    const res = await pageGoods({ pageNum: pagination.current, pageSize: pagination.pageSize, name: query.name })
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

function openEdit(record) {
  form.value = record
    ? { ...record }
    : { status: 1, price: 0, originalPrice: undefined, stock: 0, cover: '', detail: '' }
  visible.value = true
}

async function onSave() {
  if (!form.value.name) {
    message.warning('请填写商品名称')
    return
  }
  saving.value = true
  try {
    if (form.value.id) await updateGoods(form.value)
    else await addGoods(form.value)
    message.success('保存成功')
    visible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function onRemove(id) {
  await removeGoods(id)
  message.success('已删除')
  load()
}

onMounted(async () => {
  const [flatRes, treeRes] = await Promise.all([listCategories(), treeCategories()])
  categoryMap.value = Object.fromEntries((flatRes.data || []).map((c) => [c.id, c.name]))
  // 若扁平列表不全，用树再补一遍
  categoryMap.value = { ...categoryMap.value, ...flattenCats(treeRes.data || []) }
  categoryTreeOptions.value = toTreeSelect(treeRes.data || [])
  load()
})
</script>

<style scoped>
.price-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.sale {
  color: #e1251b;
  font-weight: 600;
}
.origin {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
}
</style>
