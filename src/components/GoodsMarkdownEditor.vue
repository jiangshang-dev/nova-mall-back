<template>
  <div class="goods-md-editor">
    <div ref="hostRef" class="vditor-host"></div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
  height: { type: Number, default: 420 },
})
const emit = defineEmits(['update:modelValue'])

const hostRef = ref(null)
let editor = null
let syncing = false

function looksLikeHtml(text) {
  return typeof text === 'string' && /^\s*</.test(text.trim())
}

function toMarkdown(text) {
  if (!text) return ''
  if (!looksLikeHtml(text)) return text
  try {
    if (editor?.vditor?.lute?.HTML2Md) {
      return editor.vditor.lute.HTML2Md(text)
    }
  } catch (_) {
    /* ignore */
  }
  return text
}

function emitHtml() {
  if (!editor || syncing) return
  syncing = true
  try {
    // 存 HTML，前台 v-html 可直接展示；编辑态用 Markdown
    const html = editor.getHTML()
    emit('update:modelValue', html || '')
  } finally {
    nextTick(() => {
      syncing = false
    })
  }
}

function init() {
  if (!hostRef.value || editor) return
  editor = new Vditor(hostRef.value, {
    height: props.height,
    mode: 'ir',
    placeholder: '支持 Markdown 编写商品详情，可插入标题、列表、图片、表格等…',
    cache: { enable: false },
    toolbar: [
      'emoji',
      'headings',
      'bold',
      'italic',
      'strike',
      '|',
      'list',
      'ordered-list',
      'check',
      '|',
      'quote',
      'line',
      'code',
      'inline-code',
      '|',
      'link',
      'table',
      '|',
      'undo',
      'redo',
      '|',
      'edit-mode',
      'fullscreen',
      'preview',
    ],
    preview: {
      hljs: { style: 'github' },
    },
    after: () => {
      const md = toMarkdown(props.modelValue)
      if (md) editor.setValue(md)
    },
    input: () => emitHtml(),
    blur: () => emitHtml(),
  })
}

watch(
  () => props.modelValue,
  (v) => {
    if (!editor || syncing) return
    const currentHtml = editor.getHTML() || ''
    if ((v || '') === currentHtml) return
    syncing = true
    try {
      editor.setValue(toMarkdown(v || ''))
    } finally {
      nextTick(() => {
        syncing = false
      })
    }
  }
)

onMounted(() => nextTick(init))
onBeforeUnmount(() => {
  editor?.destroy()
  editor = null
})
</script>

<style scoped>
.goods-md-editor {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}
.vditor-host {
  min-height: 420px;
}
.goods-md-editor :deep(.vditor) {
  border: none;
}
.goods-md-editor :deep(.vditor-toolbar) {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}
</style>
