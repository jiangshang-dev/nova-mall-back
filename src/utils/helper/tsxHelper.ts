export function getSlot(slots, slot = 'default', data) {
  if (!slots || !Reflect.has(slots, slot)) return null
  if (typeof slots[slot] !== 'function') {
    console.error(`${slot} is not a function!`)
    return null
  }
  const slotFn = slots[slot]
  if (!slotFn) return null
  return data ? slotFn(data) : slotFn()
}

export function extendSlots(slots, excludeKeys = []) {
  const result = {}
  Object.keys(slots).forEach((key) => {
    if (!excludeKeys.includes(key)) {
      result[key] = (data) => getSlot(slots, key, data)
    }
  })
  return result
}
