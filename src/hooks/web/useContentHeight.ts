import { ref, unref, computed } from 'vue'

/**
 * 简化版内容高度计算（Jeecg useContentHeight 兼容）
 */
export function useContentHeight(_isFull, _wrapRef, _bottomOffsetRefs, _contentRefs, _upwardSpace) {
  const contentHeight = ref(document.documentElement.clientHeight - 180)
  const redoHeight = () => {
    contentHeight.value = document.documentElement.clientHeight - 180
  }
  const setCompensation = () => {}
  return {
    redoHeight,
    setCompensation,
    contentHeight: computed(() => unref(contentHeight)),
  }
}
