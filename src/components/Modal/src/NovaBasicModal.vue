<template>
  <a-modal
    v-bind="$attrs"
    :open="open"
    :title="title"
    :width="width"
    :confirm-loading="confirmLoading"
    :destroy-on-close="destroyOnClose"
    :mask-closable="maskClosable"
    :ok-text="okText"
    :cancel-text="cancelText"
    :ok-type="okType"
    :footer="footer"
    @update:open="onUpdateOpen"
    @ok="onOk"
    @cancel="onCancel"
  >
    <slot></slot>
  </a-modal>
</template>

<script>
export default {
  name: 'BasicModal',
  inheritAttrs: false,
}
</script>

<script setup>
/**
 * Nova 统一弹框
 * 默认按钮：确定 / 取消；支持 v-model:open
 */
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: [String, Number], default: 520 },
  confirmLoading: { type: Boolean, default: false },
  destroyOnClose: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: true },
  okText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  okType: { type: String, default: 'primary' },
  footer: { default: undefined },
})

const emit = defineEmits(['update:open', 'ok', 'cancel'])

function onUpdateOpen(v) {
  emit('update:open', v)
}
function onOk(e) {
  emit('ok', e)
}
function onCancel(e) {
  emit('update:open', false)
  emit('cancel', e)
}
</script>
