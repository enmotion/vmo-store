// Every value has an explicit tag, so user objects cannot collide with codec metadata.
export type EncodedValue = { type: string; value: any }

export function encodeValue(value: any, ancestors = new Set<object>()): EncodedValue {
  if (value === null || ['string', 'boolean', 'number'].includes(typeof value)) {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('Non-finite numbers cannot be persisted.')
    return { type: 'json', value }
  }
  if (typeof value !== 'object') throw new TypeError('Only serializable values can be persisted.')
  if (ancestors.has(value)) throw new TypeError('Circular values cannot be persisted.')
  ancestors.add(value)
  let result: EncodedValue
  if (value instanceof Date) {
    result = { type: 'date', value: value.toISOString() }
  } else if (value instanceof RegExp) {
    result = { type: 'regexp', value: [value.source, value.flags] }
  } else if (value instanceof Map) {
    result = { type: 'map', value: Array.from(value, ([key, item]) => [encodeValue(key, ancestors), encodeValue(item, ancestors)]) }
  } else if (value instanceof Set) {
    result = { type: 'set', value: Array.from(value, item => encodeValue(item, ancestors)) }
  } else if (Array.isArray(value)) {
    result = { type: 'array', value: Array.from(value, item => encodeValue(item, ancestors)) }
  } else {
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new TypeError('Custom class instances cannot be persisted.')
    }
    result = { type: 'object', value: Object.entries(value).map(([key, item]) => [key, encodeValue(item, ancestors)]) }
  }
  ancestors.delete(value)
  return result
}

function array(value: any): any[] {
  if (!Array.isArray(value)) throw new TypeError('Invalid cached collection.')
  return value
}

function pair(value: any): [any, any] {
  if (array(value).length !== 2) throw new TypeError('Invalid cached pair.')
  return value
}

export function decodeValue(encoded: EncodedValue): any {
  if (encoded === null || typeof encoded !== 'object') throw new TypeError('Invalid cached value.')
  const value = encoded.value
  switch (encoded.type) {
    case 'json':
      if (encodeValue(value).type !== 'json') throw new TypeError('Invalid cached primitive.')
      return value
    case 'date': {
      if (typeof value !== 'string') throw new TypeError('Invalid cached date.')
      const date = new Date(value)
      if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid cached date.')
      return date
    }
    case 'regexp': {
      const [source, flags] = pair(value)
      if (typeof source !== 'string' || typeof flags !== 'string') throw new TypeError('Invalid cached regular expression.')
      return new RegExp(source, flags)
    }
    case 'map': return new Map(array(value).map(item => {
      const [key, value] = pair(item)
      return [decodeValue(key), decodeValue(value)]
    }))
    case 'set': return new Set(array(value).map(decodeValue))
    case 'array': return array(value).map(decodeValue)
    case 'object': return Object.fromEntries(array(value).map(item => {
      const [key, value] = pair(item)
      if (typeof key !== 'string') throw new TypeError('Invalid cached object key.')
      return [key, decodeValue(value)]
    }))
    default: throw new TypeError('Unknown cached value type.')
  }
}
