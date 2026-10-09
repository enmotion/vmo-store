import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VmoStore, defaultStorageMethodProxy } from '../index'
import type { DataProps, StoreParams } from '../index'
import { enCrypto, deCrypto } from '../use.lib/crypto-key'
import { encodeValue, decodeValue } from '../use.lib/value-codec'

const namespace = 'VMO-STORE:NORMAL:0'
const props: DataProps = {
  name: { type: String, default: 'fallback' },
  count: { type: Number, storge: 'sessionStorage', default: 0 },
  object: { type: Object, default: () => ({}) },
  fn: { type: Function, default: () => () => 'default' }
}
const create = (config: Partial<StoreParams> = {}) => new VmoStore({ dataProps: props, ...config })
const seed = (value: unknown, type: 'localStorage' | 'sessionStorage' = 'localStorage') => {
  defaultStorageMethodProxy.setItem(namespace, JSON.stringify(value), type)
}

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

describe('persistence and isolation regressions', () => {
  it('persists default storage, survives reload and keeps namespaces independent', () => {
    const store = create()
    expect(store.getNameSpace()).toBe(namespace)
    store.setData('name', 'Alice')
    store.setData('count', 42)
    const other = create({ prefix: 'OTHER', namespace: 'app', version: '2' })
    other.setData('name', 'Bob')
    expect(create().getData('name')).toBe('Alice')
    expect(create().getData('count')).toBe(42)
    expect(create({ prefix: 'OTHER', namespace: 'app', version: 2 }).getData('name')).toBe('Bob')
    expect(store.getCryptoKey()).toBeUndefined()
  })

  it('does not write on construction and keeps valid storage when another is malformed', () => {
    seed({ name: { v: 'saved', t: Date.now() } })
    sessionStorage.setItem(namespace, 'broken')
    const before = localStorage.getItem(namespace)
    const store = create()
    expect(store.getData('name')).toBe('saved')
    expect(store.getData('count')).toBe(0)
    expect(localStorage.getItem(namespace)).toBe(before)
    expect(sessionStorage.getItem(namespace)).toBe('broken')
  })

  it.each([null, 1, 'text', [], true])('ignores invalid root payload %j', value => {
    seed(value)
    expect(create().getData('name')).toBe('fallback')
  })

  it('isolates malformed fields and refuses executable legacy payloads', () => {
    seed({
      name: { v: 'saved', t: Date.now() },
      object: { v: { type: 'unknown' }, t: Date.now(), format: 1 },
      fn: { v: '(() => { globalThis.pwned = true; return () => 1 })()', t: Date.now(), k: true }
    })
    const store = create()
    expect(store.getData('name')).toBe('saved')
    expect(store.getData('object')).toEqual({})
    expect(store.getData('fn')()).toBe('default')
    expect('pwned' in globalThis).toBe(false)
  })

  it.each([null, {}, { t: 'wrong', v: 'bad' }, { t: Date.now(), v: 123 }, { t: Date.now(), v: 'bad', format: 2 }])('rejects invalid entries %j', entry => {
    seed({ name: entry })
    expect(create().getData('name')).toBe('fallback')
  })

  it('keeps functions in memory with their closures, never evaluates or persists them', async () => {
    const store = create()
    const captured = 'closure'
    store.setData('fn', async () => captured)
    expect(await store.getData('fn')()).toBe(captured)
    expect(JSON.parse(localStorage.getItem(namespace)!)).not.toHaveProperty('fn')
    expect(create().getData('fn')()).toBe('default')
    store.setData('fn', () => captured)
    expect(store.getData('fn')()).toBe(captured)
  })

  it('clears only its namespace and clears matching memory without resurrecting values', () => {
    const store = create()
    store.setData('name', 'Alice'); store.setData('count', 1)
    localStorage.setItem('foreign', 'keep'); sessionStorage.setItem('foreign', 'keep')
    store.clear('localStorage')
    expect(store.getData('name')).toBe('fallback')
    expect(store.getData('count')).toBe(1)
    expect(localStorage.getItem(namespace)).toBeNull()
    store.setData('object', { fresh: true })
    expect(JSON.parse(localStorage.getItem(namespace)!)).not.toHaveProperty('name')
    store.clear()
    expect(store.getData('count')).toBe(0)
    expect(localStorage.getItem('foreign')).toBe('keep')
    expect(sessionStorage.getItem('foreign')).toBe('keep')
  })

  it('scopes old-version cleanup without interpreting namespace regex characters', () => {
    const config = { prefix: 'A.+', namespace: 'B[*]', version: 2, dataProps: props }
    const current = 'A.+:B[*]:2'
    const old = 'A.+:B[*]:1'
    for (const backend of [localStorage, sessionStorage]) {
      for (const key of [current, old, 'A.+:different:1', 'A.+:invalid', 'Ax:B[*]:1', 'foreign']) backend.setItem(key, 'keep')
    }
    const store = new VmoStore({ ...config, cacheInitCleanupMode: 'self' })
    expect(localStorage.getItem(old)).toBeNull()
    expect(sessionStorage.getItem(old)).toBeNull()
    expect(localStorage.getItem(current)).toBe('keep')
    expect(localStorage.getItem('A.+:different:1')).toBe('keep')
    store.clearUnusedCache('all')
    expect(localStorage.getItem('A.+:different:1')).toBeNull()
    for (const key of [current, 'A.+:invalid', 'Ax:B[*]:1', 'foreign']) expect(localStorage.getItem(key)).toBe('keep')
  })

  it('handles symbol reads and rejects undeclared writes without warning', () => {
    const store = create()
    const warn = vi.spyOn(console, 'warn')
    expect(store.$store[Symbol.iterator as any]).toBeUndefined()
    expect(store.getData('missing')).toBeUndefined()
    expect(() => { store.$store[Symbol('key') as any] = 'bad' }).toThrow('has not been declared')
    expect(() => store.setData('missing', 'bad')).toThrow('has not been declared')
    expect(warn).not.toHaveBeenCalled()
    expect(() => Object.defineProperty(store.$store, 'name', { value: 'bad' })).toThrow('Use setData')
    store.setData('name', 'Alice')
    delete store.$store.name
    expect(create().getData('name')).toBe('fallback')
    expect(Reflect.deleteProperty(store.$store, Symbol('key'))).toBe(true)
    expect(Reflect.deleteProperty(store.$store, 'missing')).toBe(true)
  })

  it('allows special property names without prototype pollution', () => {
    const dataProps = Object.fromEntries(['__proto__', 'constructor', 'toString'].map(key => [key, { type: String }]))
    const store = create({ dataProps })
    for (const key of Object.keys(dataProps)) store.setData(key, 'safe')
    const reload = create({ dataProps })
    for (const key of Object.keys(dataProps)) expect(reload.getData(key)).toBe('safe')
    expect(Object.getPrototypeOf(store.getProps())).toBe(Object.prototype)
  })
})

describe('failure consistency and declarations', () => {
  it('preserves memory and persistence on capacity failures, including zero capacity', () => {
    const store = create({ capacity: { localStorage: 180 } })
    store.setData('name', 'old')
    const before = localStorage.getItem(namespace)
    expect(() => store.setData('name', 'x'.repeat(200))).toThrow('overflows')
    expect(store.getData('name')).toBe('old')
    expect(localStorage.getItem(namespace)).toBe(before)
    expect(create().getData('name')).toBe('old')
    const zero = create({ capacity: { localStorage: 0 } })
    expect(() => zero.setData('name', 'new')).toThrow('limit of [0 byte]')
    expect(zero.getData('name')).toBe('old')
  })

  it('preserves memory on adapter write/remove failures and propagates read failures', () => {
    const adapter = { ...defaultStorageMethodProxy }
    const store = create({ storage: adapter })
    store.setData('name', 'old')
    adapter.setItem = () => { throw new Error('quota') }
    expect(() => store.setData('name', 'new')).toThrow('quota')
    expect(() => store.clearData('name')).toThrow('quota')
    expect(() => store.removeProp('name')).toThrow('quota')
    expect(store.getData('name')).toBe('old')
    expect(store.getProps('name')).toBeDefined()
    adapter.removeItem = () => { throw new Error('blocked') }
    expect(() => store.clear()).toThrow('blocked')
    expect(store.getData('name')).toBe('old')
    adapter.getItem = () => { throw new Error('denied') }
    expect(() => create({ storage: adapter })).toThrow('denied')
  })

  it.each([-1, 1.5, 'bad', NaN, Infinity, '1tail', Number.MAX_SAFE_INTEGER + 1])('rejects invalid version %s', version => {
    expect(() => create({ version })).toThrow('Version')
  })
  it.each([-1, NaN, Infinity])('rejects invalid capacity %s', localStorage => {
    expect(() => create({ capacity: { localStorage } })).toThrow('Capacity')
  })

  it('copies configuration and introspection results, including union type arrays', () => {
    const dataProps: DataProps = { name: { type: [String, Number], default: 'old' } }
    const capacity = { localStorage: 500 }
    const store = create({ dataProps, capacity })
    dataProps.name.default = 'new'
    ;(dataProps.name.type as any[]).push(Object)
    capacity.localStorage = 0
    const snapshot = store.getProps() as DataProps
    snapshot.name.default = 'changed'
    ;(snapshot.name.type as any[]).push(Boolean)
    expect(store.getData('name')).toBe('old')
    expect(() => store.setData('name', {})).toThrow('expects a type')
    expect(() => store.setData('name', true)).toThrow('expects a type')
    store.setData('name', 1)
    expect(store.getData('name')).toBe(1)
    expect(store.getCapacity().localStorage.limit).toBe(500)
  })

  it('updates declarations atomically and requires clearing before changing backend', () => {
    const store = create()
    store.setData('name', 'saved')
    expect(() => store.updateProp({ name: { type: String, storge: 'sessionStorage' } })).toThrow('Clear')
    expect(store.getData('name')).toBe('saved')
    expect(() => store.updateProp({ fresh: { type: String }, bad: { type: String, expireTime: 'bad' as any } })).toThrow('Invalid expiration')
    expect(store.getProps('fresh')).toBeUndefined()
    store.clearData('name')
    store.updateProp({ name: { type: Number, storge: 'sessionStorage' } })
    store.setData('name', 42)
    expect(store.getData('name')).toBe(42)
    expect(create({ dataProps: { name: { type: Number, storge: 'sessionStorage' } } }).getData('name')).toBe(42)
  })

  it('falls back after a declared type changes and validates removals before changing data', () => {
    const store = create()
    store.setData('name', 'old')
    store.updateProp({ name: { type: Number, default: 10 } })
    expect(store.getData('name')).toBe(10)
    store.setData('count', 5)
    expect(() => store.clearData(['count', 'missing'])).toThrow('Unknown')
    expect(store.getData('count')).toBe(5)
    store.removeProp(['name', 'count'])
    expect(store.getProps('name')).toBeUndefined()
    expect(store.getProps('count')).toBeUndefined()
    expect(store.getData('count')).toBeUndefined()
    store.clearData([])
    const reload = create()
    expect(reload.getData('name')).toBe('fallback')
    expect(reload.getData('count')).toBe(0)
  })

  it.each([null, undefined, 123, true, [], {}])('rejects wrong types without altering a value: %j', value => {
    const store = create()
    store.setData('name', 'old')
    expect(() => store.setData('name', value)).toThrow('expects a type')
    expect(store.getData('name')).toBe('old')
  })

  it('reports zero usage for absent storage and uses UTF-8 bytes for configured limits', () => {
    const store = create()
    expect(store.getCapacity()).toEqual({ localStorage: { used: 0, limit: 'none' }, sessionStorage: { used: 0, limit: 'none' } })
    store.setData('name', '中文')
    const payload = localStorage.getItem(namespace)!
    expect(store.getCapacity().localStorage.used).toBe(new Blob([payload]).size)
    expect(store.getCapacity().localStorage.used).toBeGreaterThan(payload.length)
  })
})

describe('expiration boundaries', () => {
  it.each([[1000, 1000], [-1000, 1000], ['1s', 1000], ['1m', 60000], ['1h', 3600000], ['1d', 86400000]])('expires relative duration %s at its boundary', (expireTime, milliseconds) => {
    vi.useFakeTimers(); vi.setSystemTime(100000)
    const store = create({ dataProps: { name: { type: String, default: 'expired', expireTime: expireTime as any } } })
    store.setData('name', 'saved')
    vi.setSystemTime(100000 + Number(milliseconds) - 1)
    expect(store.getData('name')).toBe('saved')
    expect(create({ dataProps: { name: { type: String, default: 'expired', expireTime: expireTime as any } } }).getData('name')).toBe('saved')
    vi.setSystemTime(100000 + Number(milliseconds))
    expect(create({ dataProps: { name: { type: String, default: 'expired', expireTime: expireTime as any } } }).getData('name')).toBe('expired')
    expect(store.getData('name')).toBe('expired')
    expect(JSON.parse(localStorage.getItem(namespace)!)).not.toHaveProperty('name')
  })

  it.each(['2030-01-01', '2030-01-01 12:30:00'])('expires at fixed date %s', expireTime => {
    vi.useFakeTimers()
    const deadline = new Date(expireTime.replace(' ', 'T')).getTime()
    vi.setSystemTime(deadline - 1)
    const store = create({ dataProps: { name: { type: String, default: 'expired', expireTime: expireTime as any } } })
    store.setData('name', 'saved')
    expect(store.getData('name')).toBe('saved')
    vi.setSystemTime(deadline)
    expect(store.getData('name')).toBe('expired')
  })

  it.each(['1o', '2030-99-99', Infinity, NaN, null, true])('rejects invalid expiry %j', expireTime => {
    expect(() => create({ dataProps: { name: { type: String, expireTime: expireTime as any } } })).toThrow('Invalid expiration')
  })

  it('does not expire unconfigured values and prunes other expired fields during writes', () => {
    vi.useFakeTimers(); vi.setSystemTime(100000)
    const config = { dataProps: { name: { type: String }, short: { type: String, expireTime: 0 } } } as StoreParams
    const store = create(config)
    store.setData('short', 'immediately expired')
    expect(store.getData('short')).toBeUndefined()
    store.setData('name', 'saved')
    vi.setSystemTime(100000 + 1000 * 86400 * 365)
    expect(store.getData('name')).toBe('saved')
    expect(create(config).getData('name')).toBe('saved')
  })
})

describe('value serialization', () => {
  it('round-trips complex and nested values without tag collisions or aliasing', () => {
    const config: StoreParams = { dataProps: { value: { type: [Object, Array, Date, RegExp, Map, Set] } } }
    const values = [
      new Date('2024-01-02T03:04:05Z'), /hello/giu,
      new Map<any, any>([[{ id: 1 }, new Set([1, 2])]]), new Set(['a', 'b']),
      [null, true, 42, '中文😀', new Date('2024-01-01')],
      { type: 'date', value: 'user data', nested: { date: new Date('2024-01-01'), map: new Map([['a', /x/i]]) } }
    ]
    for (const value of values) {
      const store = create(config)
      store.setData('value', value)
      const reloaded = create(config).getData('value')
      expect(reloaded).toEqual(value)
      expect(reloaded).not.toBe(value)
    }
    expect(decodeValue(encodeValue(Object.assign(Object.create(null), { safe: 1 })))).toEqual({ safe: 1 })
    const shared = { a: 1 }
    expect(decodeValue(encodeValue([shared, shared]))).toEqual([shared, shared])
  })

  it.each([undefined, () => 1, Symbol('x'), 1n, Infinity, NaN, new Date('invalid')])('rejects unsupported serialization: %s', value => {
    expect(() => encodeValue(value)).toThrow()
  })

  it('rejects cycles/custom instances/nested functions and leaves the stored value intact', () => {
    const store = create()
    store.setData('object', { old: true })
    const circular: any = {}; circular.self = circular
    expect(() => store.setData('object', circular)).toThrow('Circular')
    expect(() => store.setData('object', { fn: () => 1 })).toThrow('serializable')
    class Custom { value = 1 }
    expect(() => encodeValue(new Custom())).toThrow('Custom class')
    expect(store.getData('object')).toEqual({ old: true })
    expect(create().getData('object')).toEqual({ old: true })
  })

  it('rejects unknown codec tags and tolerates invalid encoded fields on load', () => {
    expect(() => decodeValue({ type: 'unknown', value: null })).toThrow('Unknown')
    seed({ object: { format: 1, t: Date.now(), v: { type: 'map', value: null } }, name: { v: 'saved', t: Date.now() } })
    expect(create().getData('object')).toEqual({})
    expect(create().getData('name')).toBe('saved')
  })
})

describe('legacy obfuscation and storage adapter', () => {
  it('round-trips obfuscated unicode values and reloads obfuscated cache', () => {
    const key = 'secret'
    expect(deCrypto(enCrypto('中文😀', key), key)).toBe('中文😀')
    expect(deCrypto(enCrypto('', key), key)).toBe('')
    const store = create({ cryptoKey: key })
    store.setData('name', '秘密')
    expect(localStorage.getItem(namespace)).not.toContain('秘密')
    expect(create({ cryptoKey: key }).getData('name')).toBe('秘密')
    expect(create({ cryptoKey: 'wrong' }).getData('name')).toBe('fallback')
    expect(store.getCryptoKey()).toBe(key)
  })

  it('uses localStorage when raw adapter storage type is omitted', () => {
    defaultStorageMethodProxy.setItem('key', 'value')
    expect(defaultStorageMethodProxy.getItem('key')).toBe('value')
    defaultStorageMethodProxy.removeItem('key')
    expect(defaultStorageMethodProxy.getItem('key')).toBeNull()
    localStorage.setItem('a', '1'); sessionStorage.setItem('b', '2')
    expect(defaultStorageMethodProxy.getKeys('localStorage')).toEqual(['a'])
    expect(defaultStorageMethodProxy.getKeys('sessionStorage')).toEqual(['b'])
    expect(defaultStorageMethodProxy.getKeys()).toEqual(['a', 'b'])
  })
})

describe('malformed codec payloads', () => {
  it.each([
    null, 'invalid',
    { type: 'json', value: {} }, { type: 'json', value: undefined },
    { type: 'date', value: 1 }, { type: 'date', value: 'invalid' },
    { type: 'regexp', value: null }, { type: 'regexp', value: ['x'] },
    { type: 'regexp', value: [1, 'i'] }, { type: 'regexp', value: ['x', 1] },
    { type: 'regexp', value: ['x', 'bad'] },
    { type: 'map', value: [null] }, { type: 'map', value: [[]] },
    { type: 'set', value: null }, { type: 'array', value: null },
    { type: 'object', value: [[1, { type: 'json', value: 1 }]] }
  ])('rejects malformed payload %j', payload => {
    expect(() => decodeValue(payload as any)).toThrow()
  })

  it('does not let invalid dates poison future writes', () => {
    seed({ date: { format: 1, t: Date.now(), v: { type: 'date', value: 'invalid' } } })
    const store = create({ dataProps: { date: { type: Date }, name: { type: String } } })
    expect(store.getData('date')).toBeUndefined()
    store.setData('name', 'saved')
    expect(create().getData('name')).toBe('saved')
  })
})

describe('obfuscation format compatibility', () => {
  it('supports unicode keys and arbitrary UTF-16 strings', () => {
    for (const text of ['中文😀', '\ud800', '\udfff', '', '\u0000']) {
      expect(deCrypto(enCrypto(text, '中文🔑'), '中文🔑')).toBe(text)
    }
    const store = create({ cryptoKey: '中文🔑' })
    store.setData('name', 'emoji😀')
    expect(create({ cryptoKey: '中文🔑' }).getData('name')).toBe('emoji😀')
  })

  it('reads legacy obfuscated caches without evaluating function strings', () => {
    const text = JSON.stringify({ name: { v: 'legacy', t: Date.now() }, fn: { v: '() => "unsafe"', t: Date.now(), k: true } })
    const key = 'secret'
    const xor = Array.from(text, (char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join('')
    localStorage.setItem(namespace, btoa(unescape(encodeURIComponent(xor))).split('').reverse().join(''))
    const store = create({ cryptoKey: key })
    expect(store.getData('name')).toBe('legacy')
    expect(store.getData('fn')()).toBe('default')
    store.setData('name', 'new')
    expect(localStorage.getItem(namespace)).toMatch(/^v1:/)
    expect(create({ cryptoKey: key }).getData('name')).toBe('new')
  })

  it('rejects empty keys and incomplete payloads', () => {
    expect(() => enCrypto('x', '')).toThrow('must not be empty')
    expect(() => deCrypto('x', '')).toThrow('must not be empty')
    expect(() => deCrypto('v1:' + btoa('x'), 'key')).toThrow('Invalid obfuscated')
    expect(() => deCrypto('v1:not base64!', 'key')).toThrow()
  })
})
