<template>
  <PageWrapper title="经营概览" content="单商家自营店铺数据看板（一期骨架，部分指标后续接订单/会员统计接口）">
    <a-row :gutter="16">
      <a-col :xs="12" :md="6" v-for="card in cards" :key="card.title">
        <a-card class="stat-card">
          <div class="stat-label">{{ card.title }}</div>
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-sub">{{ card.sub }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :md="16">
        <a-card title="快捷入口">
          <a-space wrap>
            <a-button type="primary" preIcon="ant-design:plus-outlined" @click="$router.push('/goods/list')">发布商品</a-button>
            <a-button preIcon="ant-design:shopping-outlined" @click="$router.push('/order/list')">处理订单</a-button>
            <a-button preIcon="ant-design:team-outlined" @click="$router.push('/member/list')">会员列表</a-button>
            <a-button preIcon="ant-design:gift-outlined" @click="$router.push('/marketing/coupon')">营销活动</a-button>
            <a-button preIcon="ant-design:shop-outlined" @click="$router.push('/shop/setting')">店铺设置</a-button>
          </a-space>
        </a-card>
      </a-col>
      <a-col :md="8">
        <a-card title="当前账号">
          <p>姓名：{{ userStore.userRealName || '-' }}</p>
          <p>账号：{{ userStore.userName }}</p>
          <p>角色：{{ (userStore.roles || []).join(', ') || '-' }}</p>
        </a-card>
      </a-col>
    </a-row>
  </PageWrapper>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { useUserStore } from '@/store/user'
import { pageGoods, listCategories } from '@/api/goods'
import { pageUsers } from '@/api/user'

const userStore = useUserStore()
const cards = reactive([
  { title: '在售商品', value: '-', sub: '上架中的 SKU' },
  { title: '商品分类', value: '-', sub: '店铺类目数' },
  { title: '待处理订单', value: '0', sub: '二期接订单中心' },
  { title: '会员数', value: '-', sub: 'C 端注册用户' },
])

onMounted(async () => {
  try {
    const [goodsRes, cateRes, userRes] = await Promise.all([
      pageGoods({ pageNum: 1, pageSize: 1, status: 1 }),
      listCategories(),
      pageUsers({ pageNum: 1, pageSize: 1 }),
    ])
    cards[0].value = goodsRes.data?.total ?? 0
    cards[1].value = (cateRes.data || []).length
    cards[3].value = userRes.data?.total ?? 0
  } catch (_) {
    /* ignore */
  }
})
</script>

<style scoped>
.stat-card :deep(.ant-card-body) {
  padding: 18px 20px;
}
.stat-label {
  color: #8c8c8c;
  font-size: 13px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin: 6px 0;
  color: #1677ff;
}
.stat-sub {
  color: #bfbfbf;
  font-size: 12px;
}
</style>
