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
      :title="form.id ? '编辑商品' : '发布商品'"
      :confirm-loading="saving"
      :width="980"
      :mask-closable="false"
      destroy-on-close
      ok-text="保存"
      wrap-class-name="goods-edit-modal"
      @ok="onSave"
    >
      <div class="goods-edit">
        <section class="block">
          <div class="block-title">
            <span class="bar"></span>
            基础信息
          </div>
          <a-row :gutter="20">
            <a-col :span="16">
              <a-form layout="vertical" class="compact-form">
                <a-form-item label="商品名称" required>
                  <a-input v-model:value="form.name" maxlength="64" placeholder="请输入商品名称，建议 30 字以内" show-count />
                </a-form-item>
                <a-form-item label="副标题 / 卖点">
                  <a-input v-model:value="form.subTitle" maxlength="80" placeholder="一句话卖点，展示在价格上方" show-count />
                </a-form-item>
                <a-form-item label="商品分类">
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
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="上架状态">
                      <a-radio-group v-model:value="form.status" button-style="solid">
                        <a-radio-button :value="1">上架</a-radio-button>
                        <a-radio-button :value="0">下架</a-radio-button>
                      </a-radio-group>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="库存">
                      <a-input-number v-model:value="form.stock" :min="0" style="width: 100%" placeholder="可售库存" />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-col>
            <a-col :span="8">
              <div class="cover-panel">
                <div class="cover-label">商品主图</div>
                <JImageUpload v-model:value="form.cover" :file-max="1" text="上传主图" />
                <div class="cover-tip">建议 800×800，JPG/PNG</div>
              </div>
            </a-col>
          </a-row>
        </section>

        <section class="block">
          <div class="block-title">
            <span class="bar"></span>
            价格信息
          </div>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="优惠价（售价）" required>
                <a-input-number
                  v-model:value="form.price"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  addon-before="¥"
                  placeholder="0.00"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="原价（划线价）">
                <a-input-number
                  v-model:value="form.originalPrice"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  addon-before="¥"
                  placeholder="前台划线显示"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <div class="price-preview" v-if="form.price != null">
                <div class="pv-label">前台预览</div>
                <div class="pv-sale">¥{{ formatPrice(form.price) }}</div>
                <div
                  v-if="form.originalPrice && Number(form.originalPrice) > Number(form.price)"
                  class="pv-origin"
                >
                  ¥{{ formatPrice(form.originalPrice) }}
                </div>
              </div>
            </a-col>
          </a-row>
        </section>

        <section class="block detail-block">
          <div class="block-title">
            <span class="bar"></span>
            图文详情
            <span class="hint">支持 Markdown 富文本，建议写清规格参数、包装清单、售后说明</span>
          </div>
          <GoodsMarkdownEditor v-if="visible" v-model="form.detail" :height="460" />
        </section>
      </div>
    </BasicModal>
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { pageGoods, addGoods, updateGoods, removeGoods, listCategories, treeCategories } from '@/api/goods'
import GoodsMarkdownEditor from '@/components/GoodsMarkdownEditor.vue'

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
  if (form.value.price == null || form.value.price === '') {
    message.warning('请填写优惠价')
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

.goods-edit {
  max-height: min(78vh, 820px);
  overflow: auto;
  padding-right: 4px;
}
.block {
  margin-bottom: 18px;
  padding: 16px 18px 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}
.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
}
.block-title .bar {
  width: 3px;
  height: 14px;
  background: #e1251b;
  border-radius: 2px;
}
.block-title .hint {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: #999;
}
.compact-form :deep(.ant-form-item) {
  margin-bottom: 14px;
}
.cover-panel {
  background: #fff;
  border: 1px dashed #e5e5e5;
  border-radius: 6px;
  padding: 14px 12px 16px;
  text-align: center;
  min-height: 220px;
}
.cover-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
  text-align: left;
}
.cover-tip {
  margin-top: 10px;
  color: #bbb;
  font-size: 12px;
}
.price-preview {
  height: 74px;
  margin-top: 30px;
  padding: 10px 14px;
  background: #fff1f0;
  border-radius: 4px;
}
.pv-label {
  font-size: 12px;
  color: #999;
}
.pv-sale {
  color: #e1251b;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.pv-origin {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
}
.detail-block {
  background: #fff;
}
</style>

<style>
.goods-edit-modal .ant-modal-body {
  padding-top: 12px;
  padding-bottom: 8px;
}
</style>
