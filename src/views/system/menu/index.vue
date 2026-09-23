<template>
  <PageWrapper title="菜单管理" dense contentBackground>
    <a-space style="margin-bottom: 16px">
      <a-button v-auth="'system:menu:add'" type="primary" @click="openEdit()">新增</a-button>
      <a-button @click="load">刷新</a-button>
    </a-space>
    <a-table :columns="columns" :data-source="tree" :loading="loading" row-key="id" default-expand-all-rows :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          {{ {1:'目录',2:'菜单',3:'按钮'}[record.type] }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a v-auth="'system:menu:edit'" @click="openEdit(record)">编辑</a>
            <a-popconfirm title="确认删除？" @confirm="onRemove(record.id)">
              <a v-auth="'system:menu:remove'" style="color:#ff4d4f">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <BasicModal v-model:open="visible" :title="form.id ? '编辑菜单' : '新增菜单'" @ok="onSave" destroy-on-close>
      <a-form layout="vertical">
        <a-form-item label="上级ID"><a-input-number v-model:value="form.parentId" style="width:100%" /></a-form-item>
        <a-form-item label="名称" required><a-input v-model:value="form.name" /></a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="form.type" :options="[{value:1,label:'目录'},{value:2,label:'菜单'},{value:3,label:'按钮'}]" />
        </a-form-item>
        <a-form-item label="路由"><a-input v-model:value="form.path" /></a-form-item>
        <a-form-item label="组件"><a-input v-model:value="form.component" placeholder="system/user/index" /></a-form-item>
        <a-form-item label="权限标识"><a-input v-model:value="form.perms" /></a-form-item>
        <a-form-item label="图标"><a-input v-model:value="form.icon" /></a-form-item>
        <a-form-item label="排序"><a-input-number v-model:value="form.sort" style="width:100%" /></a-form-item>
      </a-form>
    </BasicModal>
  </PageWrapper>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { menuTree, addMenu, updateMenu, removeMenu } from '@/api/menu'

const loading = ref(false)
const tree = ref([])
const visible = ref(false)
const form = ref({})
const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '类型', key: 'type', width: 90 },
  { title: '路径', dataIndex: 'path' },
  { title: '权限', dataIndex: 'perms' },
  { title: '操作', key: 'action', width: 160 },
]

async function load() {
  loading.value = true
  try {
    const res = await menuTree()
    tree.value = res.data || []
  } finally {
    loading.value = false
  }
}

function openEdit(record) {
  form.value = record ? { ...record } : { parentId: 0, type: 2, sort: 0, visible: 1, status: 1 }
  visible.value = true
}

async function onSave() {
  if (form.value.id) await updateMenu(form.value)
  else await addMenu(form.value)
  message.success('保存成功')
  visible.value = false
  load()
}

async function onRemove(id) {
  await removeMenu(id)
  message.success('已删除')
  load()
}

onMounted(load)
</script>
