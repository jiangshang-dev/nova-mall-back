import { onBeforeUnmount, ref } from 'vue';
import { useMessage } from '/@/hooks/web/useMessage';
import { getUploadAuth, refreshUploadAuth } from '/@/views/system/vod/vod.api';
import AliyunVodUpload from '@/utils/aliyunVodUpload.js';
import { formatDuration, formatSpeed } from './format';
import type { VodUploadResult, VodUploadStage, VodUploadSuccessPayload } from './types';

interface SpeedSample {
  time: number;
  loaded: number;
}

const AUTH_WEIGHT = 8;
const MAX_FILE_SIZE = 1024 * 1024 * 1024;

export function useVodUpload(onSuccess?: (payload: VodUploadSuccessPayload) => void) {
  const { createMessage } = useMessage();

  const title = ref('');
  const selectedFile = ref<File | null>(null);
  const uploading = ref(false);
  const stage = ref<VodUploadStage>('idle');
  const uploadProgress = ref(0);
  const displayProgress = ref(0);
  const uploadMessage = ref('');
  const uploadSpeed = ref('--');
  const timeRemaining = ref('--');
  const uploadResult = ref<VodUploadResult | null>(null);
  const loadedSize = ref(0);
  const totalSize = ref(0);

  let vodUpload: any = null;
  let rafId = 0;
  let authTickTimer = 0;
  let speedSamples: SpeedSample[] = [];

  function animateProgress(target: number) {
    cancelAnimationFrame(rafId);
    const step = () => {
      const diff = target - displayProgress.value;
      if (Math.abs(diff) < 0.3) {
        displayProgress.value = target;
        return;
      }
      displayProgress.value += diff * 0.18;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  function setProgress(target: number, message?: string) {
    uploadProgress.value = Math.max(0, Math.min(100, target));
    animateProgress(uploadProgress.value);
    if (message) uploadMessage.value = message;
  }

  function stopAuthProgressTick() {
    if (authTickTimer) {
      clearInterval(authTickTimer);
      authTickTimer = 0;
    }
  }

  function startAuthProgressTick(maxTarget: number) {
    stopAuthProgressTick();
    authTickTimer = window.setInterval(() => {
      if (stage.value !== 'auth' && stage.value !== 'ready') {
        stopAuthProgressTick();
        return;
      }
      if (displayProgress.value < maxTarget - 0.5) {
        setProgress(Math.min(displayProgress.value + 0.35, maxTarget - 0.5));
      }
    }, 180);
  }

  function resetSpeedTracker() {
    speedSamples = [];
    uploadSpeed.value = '--';
    timeRemaining.value = '--';
  }

  function updateSpeed(currentLoaded: number, currentTotal: number) {
    const now = Date.now();
    speedSamples.push({ time: now, loaded: currentLoaded });
    while (speedSamples.length > 1 && now - speedSamples[0].time > 3000) {
      speedSamples.shift();
    }
    if (speedSamples.length < 2) return;

    const first = speedSamples[0];
    const last = speedSamples[speedSamples.length - 1];
    const elapsed = (last.time - first.time) / 1000;
    if (elapsed < 0.8) return;

    const speed = Math.max(0, (last.loaded - first.loaded) / elapsed);
    uploadSpeed.value = formatSpeed(speed);

    const remainBytes = Math.max(0, currentTotal - currentLoaded);
    if (speed > 1024) {
      timeRemaining.value = formatDuration(remainBytes / speed);
    }
  }

  async function waitSdkReady(maxRetry = 20) {
    for (let i = 0; i < maxRetry; i++) {
      if (AliyunVodUpload.isSdkAvailable()) return true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  }

  function selectFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      createMessage.error('文件大小不能超过 1GB');
      return false;
    }
    selectedFile.value = file;
    if (!title.value) {
      title.value = file.name.replace(/\.[^/.]+$/, '');
    }
    stage.value = 'idle';
    uploadResult.value = null;
    setProgress(0, '已选择文件，点击开始上传');
    resetSpeedTracker();
    loadedSize.value = 0;
    totalSize.value = file.size;
    return false;
  }

  function clearFile() {
    if (uploading.value) return;
    selectedFile.value = null;
    stage.value = 'idle';
    uploadResult.value = null;
    setProgress(0);
    resetSpeedTracker();
  }

  async function startUpload() {
    if (!selectedFile.value) {
      createMessage.error('请选择要上传的视频文件');
      return;
    }
    if (!title.value.trim()) {
      createMessage.error('请输入视频标题');
      return;
    }

    try {
      const sdkReady = await waitSdkReady();
      if (!sdkReady) {
        throw new Error('阿里云上传 SDK 未加载，请刷新页面后重试');
      }

      uploading.value = true;
      stage.value = 'auth';
      uploadResult.value = null;
      resetSpeedTracker();
      loadedSize.value = 0;
      totalSize.value = selectedFile.value.size;
      setProgress(2, '正在获取上传凭证...');
      startAuthProgressTick(AUTH_WEIGHT);

      const authRes = await getUploadAuth({
        title: title.value.trim(),
        fileName: selectedFile.value.name,
        fileSize: selectedFile.value.size,
      });

      if (!authRes?.success || !authRes?.result?.uploadAuth || !authRes?.result?.uploadAddress) {
        throw new Error(authRes?.message || '服务器返回的上传凭证不完整');
      }

      const uploadInfo = authRes.result;
      setProgress(AUTH_WEIGHT, '凭证获取成功，正在初始化上传...');
      stage.value = 'ready';
      startAuthProgressTick(AUTH_WEIGHT + 4);

      const file = selectedFile.value;
      vodUpload = new AliyunVodUpload({
        userId: 'heima',
        partSize: file.size > 100 * 1024 * 1024 ? 2 * 1048576 : 1048576,
        parallel: file.size > 500 * 1024 * 1024 ? 2 : 3,
      });

      await vodUpload.initUploader(uploadInfo, file, {
        onUploadStarted: () => {
          stopAuthProgressTick();
          stage.value = 'uploading';
          setProgress(Math.max(displayProgress.value, AUTH_WEIGHT + 2), '开始上传视频数据...');
        },
        onUploadProgress: (_uploadInfo: any, total: number, loaded: number) => {
          const safeTotal = total > 0 ? total : file.size;
          const safeLoaded = Math.max(0, Math.min(loaded, safeTotal));
          loadedSize.value = safeLoaded;
          totalSize.value = safeTotal;

          const uploadPercent = safeTotal > 0 ? (safeLoaded / safeTotal) * (100 - AUTH_WEIGHT) + AUTH_WEIGHT : AUTH_WEIGHT;
          setProgress(Math.min(uploadPercent, 99.5), `正在上传... ${Math.floor(uploadPercent)}%`);
          updateSpeed(safeLoaded, safeTotal);
        },
        onUploadSucceed: (info: any) => {
          stopAuthProgressTick();
          stage.value = 'success';
          setProgress(100, '上传完成');
          uploadResult.value = {
            success: true,
            message: '视频上传成功',
            videoId: info.videoId,
            title: title.value.trim(),
          };
          onSuccess?.({ videoId: info.videoId, title: title.value.trim() });
          finishUploadLater();
        },
        onUploadFailed: (_info: any, _code: string, message: string) => {
          stopAuthProgressTick();
          stage.value = 'error';
          uploadResult.value = { success: false, message: `上传失败：${message}` };
          setProgress(displayProgress.value, uploadResult.value.message);
          uploading.value = false;
        },
        onUploadEnd: () => {
          stopAuthProgressTick();
          if (stage.value !== 'success') {
            uploading.value = false;
          }
        },
        onUploadTokenExpired: async (info: any) => {
          try {
            setProgress(displayProgress.value, '上传凭证已过期，正在刷新...');
            const refreshRes = await refreshUploadAuth(info.videoId);
            if (refreshRes?.success && refreshRes?.result?.uploadAuth) {
              vodUpload?.resumeUploadWithAuth(refreshRes.result.uploadAuth);
              setProgress(displayProgress.value, '凭证刷新成功，继续上传...');
            } else {
              throw new Error(refreshRes?.message || '刷新上传凭证失败');
            }
          } catch (error: any) {
            stage.value = 'error';
            uploadResult.value = { success: false, message: error?.message || '刷新上传凭证失败' };
            uploading.value = false;
          }
        },
      });

      vodUpload.startUpload();
    } catch (error: any) {
      stopAuthProgressTick();
      stage.value = 'error';
      uploadResult.value = { success: false, message: error?.message || '上传失败' };
      setProgress(displayProgress.value, uploadResult.value.message);
      uploading.value = false;
    }
  }

  function finishUploadLater() {
    window.setTimeout(() => {
      uploading.value = false;
    }, 1200);
  }

  function cancelUpload() {
    stopAuthProgressTick();
    vodUpload?.stopUpload();
    stage.value = 'cancelled';
    uploadResult.value = { success: false, message: '上传已取消' };
    setProgress(displayProgress.value, '上传已取消');
    uploading.value = false;
  }

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    stopAuthProgressTick();
    vodUpload?.stopUpload();
  });

  return {
    title,
    selectedFile,
    uploading,
    stage,
    uploadProgress,
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
  };
}
