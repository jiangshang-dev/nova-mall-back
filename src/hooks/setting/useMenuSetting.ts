import { computed, ref } from 'vue'

export function useMenuSetting() {
  const getCalcContentWidth = computed(() => '100%')
  const getCollapsed = ref(false)
  return {
    getCalcContentWidth,
    getCollapsed,
  }
}
