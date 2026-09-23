/**
 * 读取 Vite 环境变量（接口等相关配置来自 .env / .env.development / .env.production）
 */
export function getAppEnvConfig() {
  const {
    VITE_APP_TITLE,
    VITE_GLOB_API_URL,
    VITE_PROXY_URL,
    VITE_PORT,
    VITE_BASE_URL,
  } = import.meta.env

  return {
    title: VITE_APP_TITLE || 'Nova Mall',
    apiUrl: VITE_GLOB_API_URL || '/api',
    proxyUrl: VITE_PROXY_URL || '',
    port: Number(VITE_PORT) || 3100,
    baseUrl: VITE_BASE_URL || '/',
  }
}

export const useGlobSetting = () => getAppEnvConfig()
