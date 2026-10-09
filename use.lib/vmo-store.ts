import type { DataProps, BasicType, StoreParams, ExpireTime, StorageMethodProxy, CacheData, Capacity } from '../types/index.js'
import { enCrypto, deCrypto } from './crypto-key.js'
import { defaultStorageMethodProxy } from './default-storage.js'
import { encodeValue, decodeValue } from './value-codec.js'

type StorageType = 'localStorage' | 'sessionStorage'
const storageTypes: StorageType[] = ['localStorage', 'sessionStorage']
const hasOwn = (object: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(object, key)

/** A synchronous, namespace-scoped browser cache. Functions are memory-only. */
export class VmoStore<T extends Record<string, any> = Record<string, any>> {
  private _cryptoKey: string | undefined
  private _namespace: `${string}:${string}:${number}`
  private _prefix: string
  private _props: DataProps = {}
  private _data: CacheData<T> = Object.create(null)
  private _storage: StorageMethodProxy
  private _capacity: Capacity
  public readonly $store: Partial<T>

  constructor(config: StoreParams) {
    this._cryptoKey = config.cryptoKey
    this._prefix = config.prefix ?? 'VMO-STORE'
    const version = Number(config.version ?? 0)
    if (!Number.isSafeInteger(version) || version < 0) throw new TypeError('Version must be a non-negative safe integer.')
    this._namespace = `${this._prefix}:${config.namespace ?? 'NORMAL'}:${version}`
    this._storage = config.storage ?? defaultStorageMethodProxy
    this._capacity = { ...config.capacity }
    for (const limit of Object.values(this._capacity)) {
      if (!Number.isFinite(limit) || limit < 0) throw new TypeError('Capacity must be a non-negative finite number.')
    }
    this.updateProp(config.dataProps)
    this._load()
    this.$store = new Proxy(this._data, {
      get: (_target, prop) => this._get(prop),
      set: (_target, prop, value) => {
        if (typeof prop !== 'string' || !hasOwn(this._props, prop)) {
          throw new Error(`VmoStore: Current assignment [${String(prop)}] has not been declared.`)
        }
        if (!this._matches(value, this._props[prop].type)) {
          throw new TypeError(`VmoStore: Property [${prop}] expects a type of [${this._types(this._props[prop].type).map(type => type.name)}], but the actual obtained type is ${value?.constructor?.name}.`)
        }
        const entry = { v: value, t: Date.now() }
        const candidate = Object.assign(Object.create(null), this._data, { [prop]: entry })
        this._persist(this._storageType(prop), candidate)
        Object.defineProperty(this._data, prop, { value: entry, configurable: true, enumerable: true, writable: true })
        return true
      },
      deleteProperty: (_target, prop) => {
        if (typeof prop === 'string' && hasOwn(this._props, prop)) this.clearData(prop)
        return true
      },
      defineProperty: () => { throw new TypeError('Use setData or assignment to update the store.') }
    }) as Partial<T>
    if (config.cacheInitCleanupMode) this.clearUnusedCache(config.cacheInitCleanupMode)
  }

  private _types(type: BasicType | BasicType[]): BasicType[] {
    return Array.isArray(type) ? type : [type]
  }

  private _matches(value: any, type: BasicType | BasicType[]) {
    return this._types(type).some(expected => expected === Function ? typeof value === 'function' : value?.constructor === expected)
  }

  private _storageType(prop: string): StorageType {
    return this._props[prop].storge ?? 'localStorage'
  }

  private _expiry(time: ExpireTime | undefined, writtenAt: number): number {
    if (time === undefined) return Infinity
    if (typeof time === 'number' && Number.isFinite(time)) return writtenAt + Math.abs(time)
    if (typeof time === 'string') {
      const duration = /^(\d+(?:\.\d+)?)(s|m|h|d)$/.exec(time)
      if (duration) {
        const units: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
        return writtenAt + Number(duration[1]) * units[duration[2]]
      }
      if (/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}:\d{2})?$/.test(time)) {
        const timestamp = new Date(time.replace(' ', 'T')).getTime()
        if (Number.isFinite(timestamp)) return timestamp
      }
    }
    throw new TypeError('Invalid expiration time; use milliseconds, a duration with s/m/h/d, or YYYY-MM-DD HH:mm:ss.')
  }

  private _load() {
    for (const type of storageTypes) {
      // Backend access errors must remain visible; malformed payloads are isolated.
      const raw = this._storage.getItem(this._namespace, type)
      if (raw === null) continue
      let cache: Record<string, any>
      try {
        cache = JSON.parse(this._cryptoKey ? deCrypto(raw, this._cryptoKey) : raw)
        if (cache === null || typeof cache !== 'object' || Array.isArray(cache)) continue
      } catch {
        continue
      }
      for (const prop of Object.keys(this._props)) {
        if (this._storageType(prop) !== type || !hasOwn(cache, prop)) continue
        const entry = cache[prop]
        try {
          if (!entry || !Number.isFinite(entry.t) || entry.k || (entry.format !== undefined && entry.format !== 1)) continue
          const value = entry.format === 1 ? decodeValue(entry.v) : entry.v
          if (!this._matches(value, this._props[prop].type) || Date.now() >= this._expiry(this._props[prop].expireTime, entry.t)) continue
          Object.defineProperty(this._data, prop, { value: { v: value, t: entry.t }, configurable: true, enumerable: true, writable: true })
        } catch {
          // A malformed field must not discard other valid fields.
          continue
        }
      }
    }
  }

  private _persist(type: StorageType, data: CacheData<T>) {
    const cache: Record<string, any> = Object.create(null)
    for (const prop of Object.keys(this._props)) {
      const entry = data[prop]
      if (this._storageType(prop) !== type || !entry || typeof entry.v === 'function' || Date.now() >= this._expiry(this._props[prop].expireTime, entry.t)) continue
      cache[prop] = { v: encodeValue(entry.v), t: entry.t, format: 1 }
    }
    const json = JSON.stringify(cache)
    const payload = this._cryptoKey ? enCrypto(json, this._cryptoKey) : json
    const size = new Blob([payload]).size
    const limit = this._capacity[type]
    if (limit !== undefined && size > limit) {
      throw new Error(`The storage capacity of memory [${type}] overflows, with a limit of [${limit} byte], and a storage capacity of [${size} byte], resulting in an overflow of [${size - limit} byte].`)
    }
    this._storage.setItem(this._namespace, payload, type)
  }

  private _get(prop: PropertyKey): any {
    if (typeof prop !== 'string' || !hasOwn(this._props, prop)) return undefined
    const definition = this._props[prop]
    const entry = this._data[prop]
    if (entry) {
      if (Date.now() < this._expiry(definition.expireTime, entry.t) && this._matches(entry.v, definition.type)) return entry.v
      this.clearData(prop)
    }
    return typeof definition.default === 'function' ? definition.default() : definition.default
  }

  /** all: other namespaces under this prefix; self: other versions of this namespace. */
  public clearUnusedCache(type: 'all' | 'self') {
    const prefix = type === 'all' ? `${this._prefix}:` : this._namespace.slice(0, this._namespace.lastIndexOf(':') + 1)
    for (const key of this._storage.getKeys()) {
      if (key === this._namespace || !key.startsWith(prefix) || !/^\d+$/.test(key.slice(key.lastIndexOf(':') + 1))) continue
      for (const storageType of storageTypes) this._storage.removeItem(key, storageType)
    }
  }

  /** Clear only this instance's namespace, including its in-memory values. */
  public clear(type?: StorageType) {
    for (const storageType of type ? [type] : storageTypes) {
      this._storage.removeItem(this._namespace, storageType)
      for (const prop of Object.keys(this._data)) {
        if (this._storageType(prop) === storageType) delete this._data[prop]
      }
    }
  }

  public getData<K extends keyof T>(prop: K): T[K] | undefined { return this.$store[prop] }
  public setData<K extends keyof T>(prop: K, value: T[K]) { return (this.$store[prop] = value) }

  public updateProp(props: DataProps) {
    const next = { ...this._props }
    for (const [prop, definition] of Object.entries(props)) {
      this._expiry(definition.expireTime, 0)
      if (hasOwn(this._data, prop) && (definition.storge ?? 'localStorage') !== this._storageType(prop)) {
        throw new Error('Clear the cached value before changing its storage backend.')
      }
      Object.defineProperty(next, prop, { value: { ...definition, type: Array.isArray(definition.type) ? [...definition.type] : definition.type }, enumerable: true, configurable: true, writable: true })
    }
    this._props = next
  }

  public clearData(prop: string | string[]) { this._remove(prop, false) }
  public removeProp(prop: string | string[]) { this._remove(prop, true) }

  private _remove(prop: string | string[], removeDefinition: boolean) {
    const keys = typeof prop === 'string' ? [prop] : prop
    // Validate the whole request before making changes.
    for (const key of keys) {
      if (!hasOwn(this._props, key)) throw new Error(`Unknown cache property [${key}].`)
    }
    const groups = storageTypes.map(type => ({ type, selected: keys.filter(key => this._storageType(key) === type) }))
    for (const { type, selected } of groups) {
      if (selected.length === 0) continue
      const candidate = Object.assign(Object.create(null), this._data)
      for (const key of selected) delete candidate[key]
      this._persist(type, candidate)
      for (const key of selected) {
        delete this._data[key]
        if (removeDefinition) delete this._props[key]
      }
    }
  }

  public getCapacity() {
    const usage = (type: StorageType) => ({
      used: new Blob([this._storage.getItem(this._namespace, type) ?? '']).size,
      limit: this._capacity[type] ?? 'none'
    })
    return { localStorage: usage('localStorage'), sessionStorage: usage('sessionStorage') }
  }
  public getProps(key?: string) {
    const copy = Object.fromEntries(Object.entries(this._props).map(([prop, definition]) => [prop, { ...definition, type: Array.isArray(definition.type) ? [...definition.type] : definition.type }]))
    return key === undefined ? copy : copy[key]
  }
  public getCryptoKey() { return this._cryptoKey }
  public getNameSpace() { return this._namespace }
}
