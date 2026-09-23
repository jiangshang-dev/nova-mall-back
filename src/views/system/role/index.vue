<template>
  <PageWrapper title="角色管理" dense contentBackground>
    <a-space style="margin-bottom: 16px">
      <a-input v-model:value="query.roleName" placeholder="角色名" allow-clear style="width: 180px" />
      <a-button type="primary" @click="load">查询</a-button>
      <a-button v-auth="'system:role:add'" type="primary" @click="openEdit()">新增</a-button>
    </a-space>
    <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a v-auth="'system:role:edit'" @click="openEdit(record)">编辑</a>
            <a-popconfirm title="确认删除？" @confirm="onRemove(record.id)">
              <a v-auth="'system:role:remove'" style="color:#ff4d4f">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <BasicModal v-model:open="visible" :title="form.role.id ? '编辑角色' : '新增角色'" width="640px" @ok="onSave" destroy-on-close>
      <a-form layout="vertical">
        <a-form-item label="角色编码" required>
          <a-input v-model:value="form.role.roleCode" :disabled="!!form.role.id" />
        </a-form-item>
        <a-form-item label="角色名称" required>
          <a-input v-model:value="form.role.roleName" />
        </a-form-item>
        <a-form-item label="菜单权限">
          <a-tree
            v-model:checkedKeys="form.permissionIds"
            checkable
            :tree-data="menuTreeData"
            :field-names="{ title: 'name', key: 'id', children: 'children' }"
          />
        </a-form-item>
      </a-form>
    </BasicModal>
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { pageRoles, addRole, updateRole, removeRole, getRolePermissions } from '@/api/role'
import { menuTree } from '@/api/menu'

const loading = ref(false)
const list = ref([])
const visible = ref(false)
const menuTreeData = ref([])
const query = reactive({ roleName: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const form = reactive({ role: {}, permissionIds: [] })
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '编码', dataIndex: 'roleCode' },
  { title: '名称', dataIndex: 'roleName' },
  { title: '操作', key: 'action', width: 160 },
]

async function load() {
  loading.value = true
  try {
    const res = await pageRoles({ pageNum: pagination.current, pageSize: pagination.pageSize, roleName: query.roleName })
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

async function openEdit(record) {
  form.role = record ? { ...record } : { status: 1, sort: 0 }
  form.permissionIds = []
  if (record?.id) {
    const res = await getRolePermissions(record.id)
    form.permissionIds = res.data || []
  }
  visible.value = true
}

async function onSave() {
  const payload = { role: form.role, permissionIds: form.permissionIds }
  if (form.role.id) await updateRole(payload)
  else await addRole(payload)
  message.success('保存成功')
  visible.value = false
  load()
}

async function onRemove(id) {
  await removeRole(id)
  message.success('已删除')
  load()
}

onMounted(async () => {
  const res = await menuTree()
  menuTreeData.value = res.data || []
  load()
})
</script>
