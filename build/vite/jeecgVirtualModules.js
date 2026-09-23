/**
 * Vite 插件：Jeecg 虚拟模块桩（未装 vite-plugin-svg-icons 时使用）
 */
export function jeecgVirtualModules() {
  const VIRTUAL_SVG_NAMES = 'virtual:svg-icons-names'
  const RESOLVED_SVG_NAMES = '\0' + VIRTUAL_SVG_NAMES

  return {
    name: 'nova-jeecg-virtual-modules',
    resolveId(id) {
      if (id === VIRTUAL_SVG_NAMES) return RESOLVED_SVG_NAMES
    },
    load(id) {
      if (id === RESOLVED_SVG_NAMES) {
        return 'export default []'
      }
    },
  }
}
