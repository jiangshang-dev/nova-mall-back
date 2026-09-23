<template>
  <div class="vod-upload-panel">
    <a-form layout="vertical">
      <a-form-item label="视频标题" required>
        <a-input v-model:value="title" :disabled="uploading" placeholder="请输入视频标题" allow-clear />
      </a-form-item>

      <a-form-item label="视频文件" required>
        <div
          class="upload-dropzone"
          :class="{ 'is-dragover': dragOver, 'has-file': !!selectedFile, 'is-uploading': uploading }"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="onDrop"
        >
          <template v-if="!selectedFile">
            <Icon icon="ant-design:cloud-upload-outlined" :size="42" color="#ff7f32" />
            <p class="drop-title">拖拽视频到此处，或点击选择文件</p>
            <p class="drop-tip">支持 MP4、MOV、AVI 等格式，最大 1GB</p>
            <a-upload :before-upload="selectFile" :show-upload-list="false" accept="video/*" :disabled="uploading">
              <a-button type="primary" ghost>选择视频</a-button>
            </a-upload>
          </template>

          <template v-else>
            <div class="file-card">
              <div class="file-icon">
                <Icon icon="ant-design:video-camera-outlined" :size="28" />
              </div>
              <div class="file-meta">
                <div class="file-name" :title="selectedFile.name">{{ selectedFile.name }}</div>
                <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
              </div>
              <a-button v-if="!uploading" type="text" danger @click="clearFile">
                <Icon icon="ant-design:delete-outlined" />
              </a-button>
            </div>
          </template>
        </div>
      </a-form-item>
    </a-form>

    <div v-if="selectedFile" class="upload-actions">
      <a-space>
        <a-button type="primary" :loading="uploading" :disabled="!selectedFile || uploading" @click="startUpload">
          {{ uploading ? '上传中...' : '开始上传' }}
        </a-button>
        <a-button :disabled="!uploading" @click="cancelUpload">取消上传</a-button>
      </a-space>
    </div>

    <div v-if="stage !== 'idle' || uploadResult" class="progress-panel">
      <div class="progress-header">
        <span class="progress-title">上传进度</span>
        <span class="progress-stage">{{ stageText }}</span>
      </div>

      <a-progress
        :percent="Math.round(displayProgress)"
        :status="progressStatus"
        :stroke-color="{ from: '#ffb347', to: '#ff7f32' }"
        :show-info="true"
        stroke-linecap="round"
      />

      <div class="progress-message">{{ uploadMessage }}</div>

      <div v-if="stage === 'uploading'" class="progress-stats">
        <div class="stat-item">
          <span class="label">已上传</span>
          <span class="value">{{ formatFileSize(loadedSize) }} / {{ formatFileSize(totalSize) }}</span>
        </div>
        <div class="stat-item">
          <span class="label">速度</span>
          <span class="value">{{ uploadSpeed }}</span>
        </div>
        <div class="stat-item">
          <span class="label">剩余时间</span>
          <span class="value">{{ timeRemaining }}</span>
        </div>
      </div>

      <a-alert
        v-if="uploadResult"
        class="result-alert"
        :type="uploadResult.success ? 'success' : 'error'"
        :message="uploadResult.message"
        show-icon
      >
        <template v-if="uploadResult.success && uploadResult.videoId" #description>
          视频 ID：{{ uploadResult.videoId }}
        </template>
      </a-alert>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { formatFileSize } from './format';
  import { useVodUpload } from './useVodUpload';
  import type { VodUploadSuccessPayload } from './types';

  const props = withDefaults(
    defineProps<{
      defaultTitle?: string;
    }>(),
    {
      defaultTitle: '',
    },
  );

  const emit = defineEmits<{
    (e: 'success', payload: VodUploadSuccessPayload): void;
  }>();

  const dragOver = ref(false);

  const {
    title,
    selectedFile,
    uploading,
    stage,
    displayProgress,
    uploadMessage,
    uploadSpeed,
    timeRemaining,
    uploadResult,
    loadedSize,
    totalSize,
    selectFile,
    clearFile,
    startUpload,
    cancelUpload,
  } = useVodUpload((payload) => emit('success', payload));

  if (props.defaultTitle) {
    title.value = props.defaultTitle;
  }

  const stageText = computed(() => {
    switch (stage.value) {
      case 'auth':
        return '获取凭证';
      case 'ready':
        return '初始化';
      case 'uploading':
        return '传输中';
      case 'success':
        return '已完成';
      case 'error':
        return '失败';
      case 'cancelled':
        return '已取消';
      default:
        return '待上传';
    }
  });

  const progressStatus = computed(() => {
    if (stage.value === 'error' || stage.value === 'cancelled') return 'exception';
    if (stage.value === 'success') return 'success';
    return 'active';
  });

  function onDrop(event: DragEvent) {
    dragOver.value = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) selectFile(file);
  }
</script>

<style scoped lang="less">
  .vod-upload-panel {
    padding: 4px 0;
  }

  .upload-dropzone {
    border: 1.5px dashed #d9d9d9;
    border-radius: 12px;
    padding: 28px 20px;
    text-align: center;
    background: #fafafa;
    transition: all 0.25s ease;

    &.is-dragover,
    &:hover {
      border-color: #ff7f32;
      background: #fff7f0;
    }

    &.has-file {
      padding: 16px;
      text-align: left;
    }

    &.is-uploading {
      opacity: 0.95;
    }
  }

  .drop-title {
    margin: 12px 0 4px;
    font-size: 15px;
    color: #333;
    font-weight: 500;
  }

  .drop-tip {
    margin: 0 0 16px;
    font-size: 13px;
    color: #999;
  }

  .file-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .file-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: linear-gradient(135deg, #ffb347, #ff7f32);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .file-meta {
    flex: 1;
    min-width: 0;
  }

  .file-name {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-size {
    margin-top: 4px;
    font-size: 12px;
    color: #888;
  }

  .upload-actions {
    margin-top: 8px;
  }

  .progress-panel {
    margin-top: 20px;
    padding: 16px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #f0f0f0;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .progress-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .progress-stage {
    font-size: 12px;
    color: #ff7f32;
    background: #fff0e6;
    padding: 2px 10px;
    border-radius: 999px;
  }

  .progress-message {
    margin-top: 10px;
    font-size: 13px;
    color: #666;
  }

  .progress-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px dashed #eee;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 12px;
      color: #999;
    }

    .value {
      font-size: 13px;
      color: #333;
      font-weight: 500;
    }
  }

  .result-alert {
    margin-top: 14px;
  }
</style>
