<template>
  <div class="vod-player" :class="{ compact: compact }">
    <div
      ref="containerRef"
      class="vod-player__screen"
      @mousemove="onMouseMove"
      @mouseleave="scheduleHideControls"
    >
      <video
        ref="videoRef"
        class="vod-player__video"
        :src="videoSrc"
        :poster="poster"
        preload="metadata"
        playsinline
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @progress="onProgress"
        @waiting="isLoading = true"
        @canplay="isLoading = false"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @click="togglePlayPause"
      />

      <div v-show="isLoading" class="vod-player__loading">
        <a-spin />
      </div>

      <div v-show="!isPlaying && !isLoading" class="vod-player__center-play" @click.stop="togglePlayPause">
        <Icon icon="ant-design:play-circle-filled" :size="72" color="#ffffff" />
      </div>

      <div v-show="showControls" class="vod-player__controls" @click.stop>
        <div class="vod-player__controls-bottom">
          <button class="ctrl-btn" type="button" @click="togglePlayPause">
            <Icon :icon="isPlaying ? 'ant-design:pause-outlined' : 'ant-design:caret-right-filled'" :size="18" />
          </button>

          <div class="time-text">{{ formatTime(currentTime) }}</div>

          <div class="progress-wrap" @click="onProgressClick">
            <div class="progress-track">
              <div class="progress-buffer" :style="{ width: bufferedPercent + '%' }"></div>
              <div class="progress-played" :style="{ width: progressPercent + '%' }"></div>
              <div class="progress-thumb" :style="{ left: progressPercent + '%' }"></div>
            </div>
          </div>

          <div class="time-text">{{ formatTime(duration) }}</div>

          <div class="volume-wrap" @mouseenter="showVolume = true" @mouseleave="showVolume = false">
            <button class="ctrl-btn" type="button" @click="toggleMute">
              <Icon :icon="volumeIcon" :size="18" />
            </button>
            <div v-show="showVolume" class="volume-slider" @click="onVolumeClick">
              <div class="volume-track">
                <div class="volume-fill" :style="{ height: volumePercent + '%' }"></div>
              </div>
            </div>
          </div>

          <button class="ctrl-btn" type="button" @click="toggleFullscreen">
            <Icon icon="ant-design:fullscreen-outlined" :size="18" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showMeta" class="vod-player__meta">
      <div class="meta-title">{{ videoTitle }}</div>
      <div class="meta-sub">
        <span v-if="viewCount != null">{{ formatNumber(viewCount) }} 次观看</span>
        <span v-if="publishDate">{{ publishDate }}</span>
      </div>
      <div v-if="videoDescription" class="meta-desc">{{ videoDescription }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { formatTime } from './format';

  const props = withDefaults(
    defineProps<{
      videoSrc: string;
      poster?: string;
      videoTitle?: string;
      viewCount?: number;
      publishDate?: string;
      videoDescription?: string;
      compact?: boolean;
      showMeta?: boolean;
    }>(),
    {
      poster: '',
      videoTitle: '视频播放',
      viewCount: 0,
      publishDate: '',
      videoDescription: '',
      compact: false,
      showMeta: true,
    },
  );

  const videoRef = ref<HTMLVideoElement | null>(null);
  const containerRef = ref<HTMLDivElement | null>(null);

  const isPlaying = ref(false);
  const isLoading = ref(false);
  const showControls = ref(true);
  const showVolume = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const bufferedPercent = ref(0);
  const progressPercent = ref(0);
  const volumePercent = ref(100);
  const isMuted = ref(false);

  let hideTimer: number | null = null;

  const volumeIcon = computed(() => {
    if (isMuted.value || volumePercent.value === 0) return 'ant-design:audio-muted-outlined';
    if (volumePercent.value < 40) return 'ant-design:sound-outlined';
    return 'ant-design:sound-filled';
  });

  function formatNumber(num: number) {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    return `${num}`;
  }

  function togglePlayPause() {
    const video = videoRef.value;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  function toggleMute() {
    const video = videoRef.value;
    if (!video) return;
    video.muted = !video.muted;
    isMuted.value = video.muted;
  }

  function toggleFullscreen() {
    const container = containerRef.value;
    if (!container) return;
    if (!document.fullscreenElement) container.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function onLoadedMetadata() {
    const video = videoRef.value;
    if (!video) return;
    duration.value = video.duration || 0;
    volumePercent.value = (video.volume || 0) * 100;
  }

  function onTimeUpdate() {
    const video = videoRef.value;
    if (!video || !duration.value) return;
    currentTime.value = video.currentTime;
    progressPercent.value = (video.currentTime / duration.value) * 100;
  }

  function onProgress() {
    const video = videoRef.value;
    if (!video || !duration.value || !video.buffered.length) return;
    bufferedPercent.value = (video.buffered.end(video.buffered.length - 1) / duration.value) * 100;
  }

  function onPlay() {
    isPlaying.value = true;
    scheduleHideControls();
  }

  function onPause() {
    isPlaying.value = false;
    showControls.value = true;
    clearHideTimer();
  }

  function onEnded() {
    isPlaying.value = false;
    showControls.value = true;
  }

  function onProgressClick(event: MouseEvent) {
    const video = videoRef.value;
    if (!video || !duration.value) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration.value;
  }

  function onVolumeClick(event: MouseEvent) {
    const video = videoRef.value;
    if (!video) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    video.volume = ratio;
    video.muted = ratio === 0;
    isMuted.value = video.muted;
    volumePercent.value = ratio * 100;
  }

  function onMouseMove() {
    showControls.value = true;
    if (isPlaying.value) scheduleHideControls();
  }

  function scheduleHideControls() {
    clearHideTimer();
    hideTimer = window.setTimeout(() => {
      if (isPlaying.value) showControls.value = false;
    }, 2800);
  }

  function clearHideTimer() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', () => {});
  });

  onUnmounted(() => {
    clearHideTimer();
  });
</script>

<style scoped lang="less">
  .vod-player {
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    border-radius: 14px;
    overflow: hidden;
    background: #000;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  }

  .vod-player__screen {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
  }

  .vod-player__video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  .vod-player__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
  }

  .vod-player__center-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.18);
    cursor: pointer;
  }

  .vod-player__controls {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 28px 14px 12px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.72), transparent);
  }

  .vod-player__controls-bottom {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ctrl-btn {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.22);
    }
  }

  .time-text {
    min-width: 44px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.88);
    font-variant-numeric: tabular-nums;
  }

  .progress-wrap {
    flex: 1;
    height: 18px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .progress-track {
    position: relative;
    width: 100%;
    height: 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    overflow: visible;
  }

  .progress-buffer,
  .progress-played {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 999px;
  }

  .progress-buffer {
    background: rgba(255, 255, 255, 0.35);
  }

  .progress-played {
    background: linear-gradient(90deg, #ffb347, #ff7f32);
  }

  .progress-thumb {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    margin-left: -6px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(255, 127, 50, 0.35);
  }

  .volume-wrap {
    position: relative;
  }

  .volume-slider {
    position: absolute;
    bottom: 42px;
    left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: 96px;
    padding: 10px 0;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.78);
  }

  .volume-track {
    position: relative;
    width: 4px;
    height: 100%;
    margin: 0 auto;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
  }

  .volume-fill {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    border-radius: 999px;
    background: linear-gradient(to top, #ffb347, #ff7f32);
  }

  .vod-player__meta {
    padding: 16px 18px 18px;
    background: #fff;
  }

  .meta-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f1f1f;
  }

  .meta-sub {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    font-size: 13px;
    color: #999;
  }

  .meta-desc {
    margin-top: 10px;
    font-size: 14px;
    line-height: 1.6;
    color: #666;
  }

  .vod-player.compact {
    max-width: 100%;
    box-shadow: none;

    .vod-player__meta {
      display: none;
    }
  }
</style>
