<template>
  <PageWrapper title="用户管理" dense contentBackground>
    <a-space style="margin-bottom: 16px">
      <a-input v-model:value="query.userName" placeholder="用户名" allow-clear style="width: 180px" />
      <a-button type="primary" preIcon="ant-design:search-outlined" @click="load">查询</a-button>
      <a-button v-auth="'system:user:add'" type="primary" preIcon="ant-design:plus-outlined" @click="openEdit()">新增</a-button>
    </a-space>
    <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" :pagination="pagination" @change="onTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'green' : 'red'">{{ record.status === 1 ? '启用' : '禁用' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a v-auth="'system:user:edit'" @click="openEdit(record)">编辑</a>
            <a v-auth="'system:user:edit'" @click="onReset(record)">重置密码</a>
            <a-popconfirm title="确认删除？" @confirm="onRemove(record.id)">
              <a v-auth="'system:user:remove'" style="color:#ff4d4f">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <BasicModal v-model:open="visible" :title="form.user.id ? '编辑用户' : '新增用户'" @ok="onSave" destroy-on-close>
      <a-form layout="vertical">
        <a-form-item label="用户名" required>
          <a-input v-model:value="form.user.userName" :disabled="!!form.user.id" />
        </a-form-item>
        <a-form-item v-if="!form.user.id" label="密码">
          <a-input-password v-model:value="form.user.password" placeholder="默认 admin123" />
        </a-form-item>
        <a-form-item label="姓名">
          <a-input v-model:value="form.user.userRealName" />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="form.roleIds" mode="multiple" :options="roleOptions" style="width:100%" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="form.user.status" :options="[{value:1,label:'启用'},{value:0,label:'禁用'}]" />
        </a-form-item>
      </a-form>
    </BasicModal>
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { pageUsers, addUser, updateUser, removeUser, resetPassword } from '@/api/user'
import { listRoles } from '@/api/role'

const loading = ref(false)
const list = ref([])
const visible = ref(false)
const roleOptions = ref([])
const query = reactive({ userName: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const form = reactive({ user: {}, roleIds: [] })

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '用户名', dataIndex: 'userName' },
  { title: '姓名', dataIndex: 'userRealName' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'action', width: 220 },
]

async function load() {
  loading.value = true
  try {
    const res = await pageUsers({ pageNum: pagination.current, pageSize: pagination.pageSize, userName: query.userName })
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
  form.user = record ? { ...record } : { status: 1, userFlag: 2 }
  form.roleIds = []
  visible.value = true
}

async function onSave() {
  const payload = { user: form.user, roleIds: form.roleIds }
  if (form.user.id) await updateUser(payload)
  else await addUser(payload)
  message.success('保存成功')
  visible.value = false
  load()
}

async function onRemove(id) {
  await removeUser(id)
  message.success('已删除')
  load()
}

async function onReset(record) {
  await resetPassword(record.id, 'admin123')
  message.success('密码已重置为 admin123')
}

onMounted(async () => {
  const res = await listRoles()
  roleOptions.value = (res.data || []).map((r) => ({ value: r.id, label: r.roleName }))
  load()
})
</script>
