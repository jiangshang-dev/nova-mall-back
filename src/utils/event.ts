export function addResizeListener(element, fn) {
  if (!element) return
  const observer = new ResizeObserver(fn)
  observer.observe(element)
  element.__resizeObserver = observer
}

export function removeResizeListener(element) {
  if (!element || !element.__resizeObserver) return
  element.__resizeObserver.disconnect()
  element.__resizeObserver = null
}
