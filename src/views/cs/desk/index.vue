<template>
  <PageWrapper title="客服工作台" content="接待排队会员，实时在线沟通" dense contentBackground>
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="排队中" size="small" :loading="loading">
          <a-empty v-if="!waiting.length" description="暂无排队" />
          <div v-for="s in waiting" :key="s.id" class="queue-item">
            <div>
              <strong>{{ s.memberName }}</strong>
              <div class="sub">IP {{ s.clientIp || '-' }}</div>
              <div class="sub">{{ s.sessionNo }}</div>
              <div class="sub">{{ s.lastMsg }}</div>
            </div>
            <a-button type="primary" size="small" @click="onAssign(s)">接入</a-button>
          </div>
        </a-card>
        <a-card title="我的会话" size="small" style="margin-top: 12px" :loading="loading">
          <a-empty v-if="!mine.length" description="暂无接待中会话" />
          <div
            v-for="s in mine"
            :key="s.id"
            class="queue-item"
            :class="{ active: current?.sessionNo === s.sessionNo }"
            @click="selectSession(s)"
          >
            <div>
              <strong>{{ s.memberName }}</strong>
              <div class="sub">IP {{ s.clientIp || '-' }}</div>
              <div class="sub">{{ s.lastMsg }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="16">
        <a-card size="small">
          <template #title>
            <span v-if="current">与 {{ current.memberName }} 对话</span>
            <span v-else>请选择会话</span>
            <span v-if="current" class="ip-tag">IP {{ current.clientIp || '-' }}</span>
          </template>
          <div class="ws-tip">{{ statusText }}</div>
          <div ref="listRef" class="chat-list">
            <div v-for="m in messages" :key="m.id || m.timestamp + m.content" class="msg" :class="m.fromRole">
              <div class="meta">{{ m.fromUserName || m.fromRole }}</div>
              <div class="bubble">{{ m.content }}</div>
            </div>
          </div>
          <div class="chat-input">
            <a-textarea v-model:value="text" :rows="3" :disabled="!current" placeholder="输入回复内容" />
            <a-button type="primary" style="margin-top: 8px" :disabled="!current" @click="send">发送</a-button>
            <a-button style="margin-top: 8px; margin-left: 8px" :disabled="!current" @click="onClose">结束会话</a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </PageWrapper>
</template>

<script setup>
import { nextTick, onMounted, onBeforeUnmount, ref } from 'vue'
import { message } from 'ant-design-vue'
import { csAssign, csMessages, csMine, csWaiting } from '@/api/cs'

const loading = ref(false)
const waiting = ref([])
const mine = ref([])
const current = ref(null)
const messages = ref([])
const text = ref('')
const statusText = ref('未连接')
const listRef = ref(null)
let socket = null
let pingTimer = null

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const base = import.meta.env.VITE_WS_BASE || `${proto}://${location.hostname}:8082`
  const t = encodeURIComponent(localStorage.getItem('Access-Token') || '')
  return `${base}/ws/cs?Access-Token=${t}&role=agent`
}

function scrollBottom() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
  })
}

async function refreshLists() {
  loading.value = true
  try {
    const [w, m] = await Promise.all([csWaiting(), csMine()])
    waiting.value = w.data || []
    mine.value = m.data || []
  } finally {
    loading.value = false
  }
}

async function selectSession(s) {
  current.value = s
  const res = await csMessages(s.sessionNo, 200)
  messages.value = (res.data || []).map((h) => ({
    id: h.id,
    content: h.content,
    fromRole: h.fromRole,
    fromUserName: h.fromUserName,
    timestamp: h.createTime,
  }))
  scrollBottom()
}

async function onAssign(s) {
  await csAssign(s.sessionNo)
  message.success('已接入')
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'assign', sessionId: s.sessionNo }))
  }
  await refreshLists()
  const hit = (mine.value || []).find((x) => x.sessionNo === s.sessionNo) || s
  await selectSession(hit)
}

function send() {
  if (!current.value || !text.value.trim() || socket?.readyState !== WebSocket.OPEN) return
  socket.send(
    JSON.stringify({
      type: 'chat',
      sessionId: current.value.sessionNo,
      content: text.value.trim(),
    })
  )
  text.value = ''
}

function onClose() {
  if (!current.value || socket?.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify({ type: 'close', sessionId: current.value.sessionNo }))
  current.value = null
  messages.value = []
  refreshLists()
}

function connect() {
  if (!localStorage.getItem('Access-Token')) return
  socket = new WebSocket(wsUrl())
  socket.onopen = () => {
    statusText.value = '客服通道已连接'
    pingTimer = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }))
    }, 25000)
  }
  socket.onmessage = async (ev) => {
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (msg.type === 'hello') {
      waiting.value = msg.data?.waiting || waiting.value
      mine.value = msg.data?.mine || mine.value
    } else if (msg.type === 'queue') {
      await refreshLists()
    } else if (msg.type === 'chat' || msg.type === 'system') {
      if (current.value && msg.sessionId === current.value.sessionNo) {
        messages.value.push({
          id: msg.messageId,
          content: msg.content,
          fromRole: msg.fromRole,
          fromUserName: msg.fromUserName,
          timestamp: msg.timestamp,
        })
        scrollBottom()
      }
      refreshLists()
    } else if (msg.type === 'assign' || msg.type === 'close') {
      await refreshLists()
    } else if (msg.type === 'error') {
      message.warning(msg.content || '通道异常')
    }
  }
  socket.onclose = () => {
    statusText.value = '已断开，可刷新重连'
    clearInterval(pingTimer)
  }
}

onMounted(async () => {
  await refreshLists()
  connect()
})

onBeforeUnmount(() => {
  clearInterval(pingTimer)
  socket?.close()
})
</script>

<style scoped>
.queue-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 8px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}
.queue-item.active {
  background: #fff1f0;
}
.sub {
  color: #999;
  font-size: 12px;
}
.ip-tag {
  margin-left: 12px;
  font-size: 12px;
  font-weight: 400;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}
.ws-tip {
  color: #999;
  font-size: 12px;
  margin-bottom: 8px;
}
.chat-list {
  height: 420px;
  overflow: auto;
  background: #fafafa;
  padding: 12px;
  border-radius: 4px;
}
.msg {
  margin-bottom: 10px;
}
.msg .meta {
  font-size: 12px;
  color: #999;
}
.msg .bubble {
  display: inline-block;
  padding: 8px 10px;
  background: #fff;
  border-radius: 6px;
  max-width: 80%;
}
.msg.agent {
  text-align: right;
}
.msg.agent .bubble {
  background: #e6f4ff;
}
</style>
