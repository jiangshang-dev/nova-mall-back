import { getCurrentInstance, reactive, shallowRef, watchEffect } from 'vue'

const DEFAULT_EXCLUDE_KEYS = ['class', 'style']
const LISTENER_PREFIX = /^on[A-Z]/

export function entries(obj) {
  return Object.keys(obj || {}).map((key) => [key, obj[key]])
}

export function useAttrs(params = {}) {
  const instance = getCurrentInstance()
  if (!instance) return {}

  const { excludeListeners = false, excludeKeys = [], excludeDefaultKeys = true } = params
  const attrs = shallowRef({})
  const allExcludeKeys = reactive([
    ...(excludeKeys || []),
    ...(excludeDefaultKeys ? DEFAULT_EXCLUDE_KEYS : []),
  ])

  instance.attrs = reactive(instance.attrs)

  watchEffect(() => {
    const res = entries(instance.attrs).reduce((prev, [key, val]) => {
      if (allExcludeKeys.includes(key) || (excludeListeners && LISTENER_PREFIX.test(key))) {
        return prev
      }
      prev[key] = val
      return prev
    }, {})
    attrs.value = res
  })

  return attrs
}
