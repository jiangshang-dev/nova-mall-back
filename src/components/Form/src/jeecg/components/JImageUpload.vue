<template>
  <div class="j-image-upload">
    <a-upload
      list-type="picture-card"
      accept="image/*"
      :file-list="fileList"
      :max-count="fileMax"
      :disabled="disabled"
      :custom-request="customRequest"
      :before-upload="beforeUpload"
      @preview="handlePreview"
      @remove="handleRemove"
    >
      <div v-if="fileList.length < fileMax">
        <plus-outlined />
        <div class="ant-upload-text">{{ text }}</div>
      </div>
    </a-upload>
    <BasicModal v-model:open="previewVisible" title="预览" :footer="null" :width="previewWidth">
      <img alt="preview" style="width: 100%" :src="previewImage" />
    </BasicModal>
  </div>
</template>

<script>
export default { name: 'JImageUpload' }
</script>

<script setup>
import { computed, ref, watch } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { BasicModal } from '/@/components/Modal'
import { uploadFile } from '/@/api/file'

const props = defineProps({
  value: { type: [String, Array], default: '' },
  text: { type: String, default: '上传' },
  disabled: { type: Boolean, default: false },
  fileMax: { type: Number, default: 1 },
  previewWidth: { type: Number, default: 520 },
  maxSizeMb: { type: Number, default: 5 },
})

const emit = defineEmits(['update:value', 'change'])

const fileList = ref([])
const previewVisible = ref(false)
const previewImage = ref('')

const valueStr = computed(() => {
  if (Array.isArray(props.value)) return props.value.filter(Boolean).join(',')
  return props.value || ''
})

watch(
  () => props.value,
  (val) => {
    const urls = Array.isArray(val)
      ? val.filter(Boolean)
      : String(val || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
    fileList.value = urls.map((url, idx) => ({
      uid: `${idx}-${url}`,
      name: url.substring(url.lastIndexOf('/') + 1) || `image-${idx}`,
      status: 'done',
      url,
    }))
  },
  { immediate: true }
)

function emitValue() {
  const urls = fileList.value.filter((f) => f.status === 'done' && f.url).map((f) => f.url)
  const next = props.fileMax === 1 ? urls[0] || '' : urls
  emit('update:value', next)
  emit('change', next)
}

function beforeUpload(file) {
  const isImg = String(file.type || '').startsWith('image/')
  if (!isImg) {
    message.error('只能上传图片文件')
    return false
  }
  const limit = props.maxSizeMb * 1024 * 1024
  if (file.size > limit) {
    message.error(`图片不能超过 ${props.maxSizeMb}MB`)
    return false
  }
  return true
}

async function customRequest(options) {
  const { file, onSuccess, onError, onProgress } = options
  const uid = file.uid
  fileList.value = [
    ...fileList.value.filter((f) => f.uid !== uid),
    { uid, name: file.name, status: 'uploading', percent: 0 },
  ]
  try {
    onProgress?.({ percent: 30 })
    const res = await uploadFile(file)
    const url = res.data
    if (!url) throw new Error('上传失败：未返回地址')
    fileList.value = fileList.value.map((f) =>
      f.uid === uid ? { uid, name: file.name, status: 'done', url } : f
    )
    // 单图模式只保留最新
    if (props.fileMax === 1) {
      fileList.value = fileList.value.filter((f) => f.uid === uid)
    }
    onSuccess?.(res, file)
    emitValue()
  } catch (e) {
    fileList.value = fileList.value.filter((f) => f.uid !== uid)
    onError?.(e)
    message.error(e?.message || '上传失败')
  }
}

function handleRemove(file) {
  fileList.value = fileList.value.filter((f) => f.uid !== file.uid)
  emitValue()
  return true
}

function handlePreview(file) {
  previewImage.value = file.url || file.thumbUrl || ''
  previewVisible.value = true
}
</script>

<style scoped>
.j-image-upload :deep(.ant-upload-select-picture-card) {
  width: 104px;
  height: 104px;
}
.ant-upload-text {
  margin-top: 6px;
  font-size: 12px;
}
</style>
