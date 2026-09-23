<template>
  <div class="cs-widget">
    <button class="cs-fab" type="button" @click="toggle">
      <span>客服</span>
    </button>

    <div v-if="open" class="cs-panel">
      <div class="cs-head">
        <strong>在线客服</strong>
        <button type="button" class="cs-close" @click="open = false">×</button>
      </div>
      <div v-if="!token" class="cs-login">
        <a-button type="link" @click="$router.push('/login')">请先登录后再咨询</a-button>
      </div>
      <template v-else>
        <div ref="listRef" class="cs-list">
          <div v-for="m in messages" :key="m.id || m.timestamp + m.content" class="cs-msg" :class="m.fromRole">
            <div class="meta">{{ m.fromUserName || roleLabel(m.fromRole) }}</div>
            <div class="bubble">{{ m.content }}</div>
          </div>
        </div>
        <div class="cs-input">
          <a-input
            v-model:value="text"
            placeholder="输入问题，Enter 发送"
            :disabled="!sessionNo || sending"
            @pressEnter="send"
          />
          <a-button type="primary" class="jd-btn" :loading="sending" @click="send">发送</a-button>
        </div>
        <div class="cs-status">{{ statusText }}</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { openCsSession } from '@/api/cs'

const open = ref(false)
const token = ref(localStorage.getItem('Access-Token') || '')
const sessionNo = ref('')
const messages = ref([])
const text = ref('')
const sending = ref(false)
const statusText = ref('未连接')
const listRef = ref(null)
let socket = null
let pingTimer = null

function roleLabel(role) {
  if (role === 'agent') return '客服'
  if (role === 'system') return '系统'
  return '我'
}

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  // 默认走当前站点（Vite 已代理 /ws → 8082），也可设 VITE_WS_BASE
  const base = import.meta.env.VITE_WS_BASE || `${proto}://${location.host}`
  const t = encodeURIComponent(localStorage.getItem('Access-Token') || '')
  return `${base}/ws/cs?Access-Token=${t}&role=member`
}

function scrollBottom() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
  })
}

function pushMsg(m) {
  messages.value.push({
    id: m.messageId,
    content: m.content,
    fromRole: m.fromRole || 'system',
    fromUserName: m.fromUserName,
    timestamp: m.timestamp || Date.now(),
  })
  scrollBottom()
}

function connect() {
  token.value = localStorage.getItem('Access-Token') || ''
  if (!token.value) return
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return

  statusText.value = '连接中...'
  socket = new WebSocket(wsUrl())
  socket.onopen = () => {
    statusText.value = '已连接'
    pingTimer = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25000)
  }
  socket.onmessage = (ev) => {
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (msg.type === 'hello') {
      sessionNo.value = msg.sessionId || ''
      statusText.value = msg.content || '已连接'
      const history = msg.data?.history || []
      messages.value = history.map((h) => ({
        id: h.id,
        content: h.content,
        fromRole: h.fromRole,
        fromUserName: h.fromUserName,
        timestamp: h.createTime,
      }))
      scrollBottom()
    } else if (msg.type === 'chat' || msg.type === 'system') {
      pushMsg(msg)
    } else if (msg.type === 'assign') {
      statusText.value = '客服已接入'
      pushMsg({ content: msg.content || '客服已接入', fromRole: 'system' })
    } else if (msg.type === 'close') {
      statusText.value = '会话已结束'
      pushMsg({ content: '会话已结束', fromRole: 'system' })
    } else if (msg.type === 'error') {
      message.warning(msg.content || '客服通道异常')
    }
  }
  socket.onclose = () => {
    statusText.value = '已断开'
    clearInterval(pingTimer)
  }
  socket.onerror = () => {
    statusText.value = '连接失败'
  }
}

function disconnect() {
  clearInterval(pingTimer)
  if (socket) {
    try {
      socket.close()
    } catch (_) {}
    socket = null
  }
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    token.value = localStorage.getItem('Access-Token') || ''
    if (!token.value) return
    try {
      const res = await openCsSession()
      sessionNo.value = res.data?.sessionNo || ''
    } catch (_) {
      /* ws hello 也会带会话 */
    }
    connect()
  }
}

function send() {
  if (!text.value.trim() || !socket || socket.readyState !== WebSocket.OPEN) return
  sending.value = true
  try {
    socket.send(
      JSON.stringify({
        type: 'chat',
        sessionId: sessionNo.value,
        content: text.value.trim(),
      })
    )
    text.value = ''
  } finally {
    sending.value = false
  }
}

watch(open, (v) => {
  if (!v) disconnect()
})

onBeforeUnmount(disconnect)
</script>

<style scoped>
.cs-fab {
  position: fixed;
  right: 24px;
  bottom: 88px;
  z-index: 1000;
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  background: #e1251b;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(225, 37, 27, 0.35);
}
.cs-panel {
  position: fixed;
  right: 24px;
  bottom: 152px;
  z-index: 1000;
  width: 340px;
  max-width: calc(100vw - 32px);
  height: 460px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cs-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #e1251b;
  color: #fff;
}
.cs-close {
  border: none;
  background: transparent;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
}
.cs-login {
  flex: 1;
  display: grid;
  place-items: center;
}
.cs-list {
  flex: 1;
  overflow: auto;
  padding: 12px;
  background: #f7f7f7;
}
.cs-msg {
  margin-bottom: 10px;
}
.cs-msg .meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
}
.cs-msg .bubble {
  display: inline-block;
  max-width: 85%;
  padding: 8px 10px;
  border-radius: 6px;
  background: #fff;
  line-height: 1.5;
  word-break: break-word;
}
.cs-msg.member {
  text-align: right;
}
.cs-msg.member .bubble {
  background: #ffe7e5;
  color: #333;
}
.cs-msg.system .bubble {
  background: transparent;
  color: #999;
  font-size: 12px;
}
.cs-input {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #f0f0f0;
}
.cs-status {
  font-size: 12px;
  color: #999;
  padding: 0 12px 8px;
}
.jd-btn {
  background: #e1251b !important;
  border-color: #e1251b !important;
}
</style>
