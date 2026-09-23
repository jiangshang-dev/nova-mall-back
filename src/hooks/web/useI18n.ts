export function useI18n(namespace) {
  const t = (key, ..._args) => {
    if (!key) return ''
    if (!namespace) return key
    return key.startsWith(namespace) ? key : `${namespace}.${key}`
  }
  return { t }
}
