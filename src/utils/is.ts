export function is(val, type) {
  return Object.prototype.toString.call(val) === `[object ${type}]`
}

export function isString(val) {
  return is(val, 'String')
}

export function isNumber(val) {
  return is(val, 'Number')
}

export function isFunction(val) {
  return typeof val === 'function'
}

export function isArray(val) {
  return Array.isArray(val)
}

export function isObject(val) {
  return val !== null && is(val, 'Object')
}

export function isEmpty(val) {
  if (val == null) return true
  if (isArray(val) || isString(val)) return val.length === 0
  if (isObject(val)) return Object.keys(val).length === 0
  return false
}

export function isUrl(path) {
  return /^(https?:)?\/\//.test(path)
}

export const isClient = typeof window !== 'undefined'
