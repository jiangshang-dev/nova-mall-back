<template>
  <PageWrapper title="店铺设置" content="配送城市、运费与基本信息" dense contentBackground>
    <a-tabs v-model:activeKey="tab">
      <a-tab-pane key="freight" tab="配送运费">
        <a-space style="margin-bottom: 16px" align="center">
          <span>同城配送城市（不送外地）：</span>
          <a-input v-model:value="serviceCity" style="width: 180px" placeholder="如：北京市" />
          <a-button type="primary" :loading="citySaving" @click="onSaveCity">保存城市</a-button>
        </a-space>
        <a-alert
          type="info"
          show-icon
          style="margin-bottom: 16px"
          message="买家结算时可选择：同城一小时达 / 隔天达 / 三天内送达。运费可设为 0 表示免运费；满额阈值可留空表示不包邮。"
        />
        <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" :pagination="false">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'freight'">
              <a-input-number v-model:value="record.freight" :min="0" :precision="2" style="width: 120px" />
            </template>
            <template v-else-if="column.key === 'freeThreshold'">
              <a-input-number
                v-model:value="record.freeThreshold"
                :min="0"
                :precision="2"
                style="width: 120px"
                placeholder="不包邮"
              />
            </template>
            <template v-else-if="column.key === 'enabled'">
              <a-switch
                :checked="record.enabled === 1"
                checked-children="启用"
                un-checked-children="停用"
                @change="(v) => (record.enabled = v ? 1 : 0)"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" :loading="record._saving" @click="onSaveRow(record)">保存</a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="basic" tab="基本信息">
        <a-form :model="form" layout="vertical" style="max-width: 560px">
          <a-form-item label="店铺名称">
            <a-input v-model:value="form.name" />
          </a-form-item>
          <a-form-item label="客服电话">
            <a-input v-model:value="form.phone" />
          </a-form-item>
          <a-form-item label="店铺简介">
            <a-textarea v-model:value="form.intro" :rows="4" />
          </a-form-item>
          <a-form-item label="退货地址">
            <a-input v-model:value="form.address" />
          </a-form-item>
          <a-button type="primary" preIcon="ant-design:save-outlined" @click="onSaveBasic">保存</a-button>
        </a-form>
      </a-tab-pane>
    </a-tabs>
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getServiceCity, listFreightAdmin, saveFreight, setServiceCity } from '@/api/freight'

const tab = ref('freight')
const loading = ref(false)
const citySaving = ref(false)
const serviceCity = ref('北京市')
const list = ref([])
const KEY = 'nova-shop-setting'
const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
const form = reactive(
  saved || {
    name: 'Nova 自营旗舰店',
    phone: '400-000-0000',
    intro: 'Nova Mall 单商家自营商城，正品保障。',
    address: '广东省深圳市南山区科技园',
  }
)

const columns = [
  { title: '配送方式', dataIndex: 'deliveryName', width: 160 },
  { title: '编码', dataIndex: 'deliveryType', width: 120 },
  { title: '运费(元)', key: 'freight', width: 140 },
  { title: '满额免运费', key: 'freeThreshold', width: 140 },
  { title: '状态', key: 'enabled', width: 100 },
  { title: '操作', key: 'action', width: 100 },
]

async function loadFreight() {
  loading.value = true
  try {
    const [cityRes, listRes] = await Promise.all([getServiceCity(), listFreightAdmin()])
    serviceCity.value = cityRes.data || '北京市'
    list.value = (listRes.data || []).map((r) => ({ ...r, _saving: false }))
  } finally {
    loading.value = false
  }
}

async function onSaveCity() {
  if (!serviceCity.value?.trim()) return message.warning('请填写配送城市')
  citySaving.value = true
  try {
    await setServiceCity(serviceCity.value.trim())
    message.success('配送城市已保存')
  } finally {
    citySaving.value = false
  }
}

async function onSaveRow(record) {
  record._saving = true
  try {
    await saveFreight({
      deliveryType: record.deliveryType,
      deliveryName: record.deliveryName,
      freight: record.freight,
      freeThreshold: record.freeThreshold,
      enabled: record.enabled,
      sort: record.sort,
      remark: record.remark,
    })
    message.success('运费已保存')
    await loadFreight()
  } finally {
    record._saving = false
  }
}

function onSaveBasic() {
  localStorage.setItem(KEY, JSON.stringify({ ...form }))
  message.success('基本信息已保存到本地')
}

onMounted(loadFreight)
</script>
