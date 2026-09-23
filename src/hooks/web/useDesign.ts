export function useDesign(scope) {
  const values = {
    prefixCls: `nova-${scope}`,
    prefixVar: 'nova',
  }
  return values
}
