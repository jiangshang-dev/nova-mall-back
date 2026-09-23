export type VodUploadStage = 'idle' | 'auth' | 'ready' | 'uploading' | 'success' | 'error' | 'cancelled';

export interface VodUploadResult {
  success: boolean;
  message: string;
  videoId?: string;
  title?: string;
}

export interface VodUploadSuccessPayload {
  videoId: string;
  title: string;
}
