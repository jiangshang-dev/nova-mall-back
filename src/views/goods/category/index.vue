<template>
  <PageWrapper title="商品分类" content="支持无限级树形分类，可增删改查" dense contentBackground>
    <a-space style="margin-bottom: 16px">
      <a-button type="primary" preIcon="ant-design:plus-outlined" @click="openEdit()">新增顶级分类</a-button>
      <a-button preIcon="ant-design:reload-outlined" @click="load">刷新</a-button>
      <a-button @click="expandAll">展开全部</a-button>
      <a-button @click="collapseAll">收起全部</a-button>
    </a-space>

    <a-table
      :columns="columns"
      :data-source="tree"
      :loading="loading"
      row-key="id"
      :pagination="false"
      :expanded-row-keys="expandedKeys"
      children-column-name="children"
      @expand="onExpand"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'green' : 'default'">
            {{ record.status === 1 ? '启用' : '停用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openEdit(null, record.id)">添加子级</a-button>
          <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button type="link" size="small" danger @click="onRemove(record)">删除</a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="visible"
      :title="form.id ? '编辑分类' : form.parentId ? '新增子分类' : '新增顶级分类'"
      :confirm-loading="saving"
      destroy-on-close
      @ok="onSave"
    >
      <a-form layout="vertical">
        <a-form-item label="上级分类">
          <a-tree-select
            v-model:value="form.parentId"
            :tree-data="parentTreeOptions"
            allow-clear
            tree-default-expand-all
            placeholder="不选则为顶级分类"
            style="width: 100%"
            :field-names="{ label: 'title', value: 'value', children: 'children' }"
          />
        </a-form-item>
        <a-form-item label="分类名称" required>
          <a-input v-model:value="form.name" maxlength="64" placeholder="请输入分类名称" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" placeholder="越小越靠前" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model:value="form.status">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">停用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </PageWrapper>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { removeCategory, saveCategory, treeCategories } from '@/api/goods'

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const tree = ref([])
const expandedKeys = ref([])
const form = reactive({
  id: undefined,
  parentId: 0,
  name: '',
  sort: 0,
  status: 1,
})

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 220 },
]

function collectKeys(nodes, acc = []) {
  ;(nodes || []).forEach((n) => {
    acc.push(n.id)
    if (n.children?.length) collectKeys(n.children, acc)
  })
  return acc
}

function toTreeSelect(nodes, disableId) {
  return (nodes || []).map((n) => ({
    title: n.name,
    value: n.id,
    disabled: disableId != null && n.id === disableId,
    children: n.children?.length ? toTreeSelect(n.children, disableId) : undefined,
  }))
}

const parentTreeOptions = computed(() => [
  { title: '顶级分类', value: 0 },
  ...toTreeSelect(tree.value, form.id),
])

function onExpand(expanded, record) {
  const key = record.id
  if (expanded) {
    if (!expandedKeys.value.includes(key)) expandedKeys.value = [...expandedKeys.value, key]
  } else {
    expandedKeys.value = expandedKeys.value.filter((k) => k !== key)
  }
}

function expandAll() {
  expandedKeys.value = collectKeys(tree.value)
}

function collapseAll() {
  expandedKeys.value = []
}

async function load() {
  loading.value = true
  try {
    const res = await treeCategories()
    tree.value = res.data || []
    if (!expandedKeys.value.length) {
      expandedKeys.value = (tree.value || []).map((n) => n.id)
    }
  } finally {
    loading.value = false
  }
}

function openEdit(record, parentId) {
  if (record) {
    Object.assign(form, {
      id: record.id,
      parentId: record.parentId ?? 0,
      name: record.name,
      sort: record.sort ?? 0,
      status: record.status ?? 1,
    })
  } else {
    Object.assign(form, {
      id: undefined,
      parentId: parentId ?? 0,
      name: '',
      sort: 0,
      status: 1,
    })
  }
  visible.value = true
}

async function onSave() {
  if (!form.name?.trim()) return message.warning('请填写分类名称')
  saving.value = true
  try {
    await saveCategory({
      id: form.id,
      parentId: form.parentId ?? 0,
      name: form.name.trim(),
      sort: form.sort ?? 0,
      status: form.status ?? 1,
    })
    message.success('保存成功')
    visible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

function onRemove(record) {
  Modal.confirm({
    title: '删除分类',
    content: `确定删除「${record.name}」？若有子分类或商品将无法删除。`,
    onOk: async () => {
      await removeCategory(record.id)
      message.success('已删除')
      await load()
    },
  })
}

onMounted(load)
</script>
