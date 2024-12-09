import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VmoStore } from '../index'
import { enCrypto, deCrypto } from '../use.lib/crypto-key'
import { defaultStorageMethodProxy } from '../index'

// 模拟加密和解密函数
vi.mock('./crypto-key', () => ({
  enCrypto: vi.fn((data: string, key: string) => data),
  deCrypto: vi.fn((data: string, key: string) => data)
}))

// 模拟存储方法
vi.mock('./default-storage', () => ({
  defaultStorageMethodProxy: {
    getItem: vi.fn((key: string, type: 'localStorage' | 'sessionStorage') => {
      return type === 'localStorage' ? localStorage.getItem(key) : sessionStorage.getItem(key)
    }),
    setItem: vi.fn((key: string, value: string, type: 'localStorage' | 'sessionStorage') => {
      if (type === 'localStorage') {
        localStorage.setItem(key, value)
      } else {
        sessionStorage.setItem(key, value)
      }
    }),
    getKeys: vi.fn(() => {
      return ['VMO-STORE:NORMAL:0', 'VMO-STORE:NORMAL:1', 'OTHER-STORE:NORMAL:0']
    }),
    removeItem: vi.fn((key: string, type: 'localStorage' | 'sessionStorage') => {
      if (type === 'localStorage') {
        localStorage.removeItem(key)
      } else {
        sessionStorage.removeItem(key)
      }
    }),
    clear: vi.fn((type: 'localStorage' | 'sessionStorage') => {
      if (type === 'localStorage') {
        localStorage.clear()
      } else {
        sessionStorage.clear()
      }
    })
  }
}))

describe('VmoStore', () => {
  let store: VmoStore<Record<string, any>>
  const config = {
    prefix: 'VMO-STORE',
    namespace: 'NORMAL',
    version: '1',
    cryptoKey: '1234567812345678',
    dataProps: {
      name: { type: String, storge: 'localStorage', expireTime: '1d' },
      age: { type: Number, storge: 'sessionStorage', expireTime: '1h' },
      isActive: { type: Boolean, storge: 'localStorage', default: false },
      fetchData: { type: Function, storge: 'sessionStorage', expireTime: '1m' },
      isValid: { type: Boolean, storge: 'localStorage', default: () => true },
      birth:{type:Boolean, storge:'localStorage',default:true, expireTime:'2050-12-11'}
    },
    storage: defaultStorageMethodProxy,
    cacheInitCleanupMode: 'all'
  }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    store = new VmoStore(config)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize correctly', () => {
    expect(store._cryptoKey).toBe('1234567812345678')
    expect(store._namespace).toBe('VMO-STORE:NORMAL:1')
    expect(store._props).toEqual(config.dataProps)
    expect(store._data).toEqual({})
    expect(store.$store).toEqual({})
  })

  it('should get and set data correctly', async () => {
    store.$store.name = 'John Doe'
    expect(store.$store.name).toBe('John Doe')

    store.$store.age = 30
    expect(store.$store.age).toBe(30)

    store.$store.isActive = true
    expect(store.$store.isActive).toBe(true)

    store.$store.fetchData = async () => 'data'
    expect(await store.$store.fetchData()).toBe('data')

    store.$store.isValid = false
    expect(store.$store.isValid).toBe(false)

    store.$store.birth = false
    expect(store.$store.birth).toBe(false)
  })

  it('should handle expired data correctly', async () => {
    vi.setSystemTime(new Date('2024-09-13T02:15:17.000Z'))
    store.$store.name = 'John Doe'
    vi.setSystemTime(new Date('2024-09-14T02:15:17.000Z'))
    expect(store.$store.name).toBeUndefined()
  })

  it('should handle invalid data types correctly', () => {
    expect(() => {
      store.$store.name = 30
    }).toThrowError('VmoStore: Property [name] expects a type of [String], but the actual obtained type is Number.')

    expect(() => {
      store.$store.age = '30'
    }).toThrowError('VmoStore: Property [age] expects a type of [Number], but the actual obtained type is String.')

    expect(() => {
      store.$store.isActive = 'true'
    }).toThrowError('VmoStore: Property [isActive] expects a type of [Boolean], but the actual obtained type is String.')

    expect(() => {
      store.$store.fetchData = 30
    }).toThrowError('VmoStore: Property [fetchData] expects a type of [Function], but the actual obtained type is Number.')

    expect(() => {
      store.$store.isValid = 30
    }).toThrowError('VmoStore: Property [isValid] expects a type of [Boolean], but the actual obtained type is Number.')
  })

  it('should handle capacity limits correctly', () => {
    store = new VmoStore(config)

    expect(store.$store.name).toBeUndefined()
    expect(store.$store.age).toBeUndefined()
    expect(store.$store.isActive).toBeFalsy()
    expect(store.$store.fetchData).toBeUndefined()
    expect(store.$store.isValid).toBeTruthy()
  })

  it('should clear unused cache correctly', () => {
    localStorage.setItem('VMO-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))
    localStorage.setItem('VMO-STORE:NORMAL:1', JSON.stringify({ name: 'John Doe', version: 1 }))
    localStorage.setItem('OTHER-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))

    store.clearUnusedCache('all')
    expect(localStorage.getItem('VMO-STORE:NORMAL:0')).toBe(null)
    expect(localStorage.getItem('VMO-STORE:NORMAL:1')).toBe(JSON.stringify({ name: 'John Doe', version: 1 }))
    expect(localStorage.getItem('OTHER-STORE:NORMAL:0')).toBe(null)

    localStorage.setItem('VMO-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))
    localStorage.setItem('VMO-STORE:NORMAL:1', JSON.stringify({ name: 'John Doe', version: 1 }))
    localStorage.setItem('OTHER-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))

    store.clearUnusedCache('self')
    expect(localStorage.getItem('VMO-STORE:NORMAL:0')).toBe(null)
    expect(localStorage.getItem('VMO-STORE:NORMAL:1')).toBe(JSON.stringify({ name: 'John Doe', version: 1 }))
    expect(localStorage.getItem('OTHER-STORE:NORMAL:0')).toBe(JSON.stringify({ name: 'John Doe', version: 0 }))
  })

  it('should clear all cache correctly', () => {
    localStorage.setItem('VMO-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))
    sessionStorage.setItem('VMO-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))

    store.clear('localStorage')
    expect(localStorage.getItem('VMO-STORE:NORMAL:0')).toBe(null)
    expect(sessionStorage.getItem('VMO-STORE:NORMAL:0')).toBe(JSON.stringify({ name: 'John Doe', version: 0 }))

    localStorage.setItem('VMO-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))
    sessionStorage.setItem('VMO-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))

    store.clear('sessionStorage')
    expect(localStorage.getItem('VMO-STORE:NORMAL:0')).toBe(JSON.stringify({ name: 'John Doe', version: 0 }))
    expect(sessionStorage.getItem('VMO-STORE:NORMAL:0')).toBe(null)

    localStorage.setItem('VMO-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))
    sessionStorage.setItem('VMO-STORE:NORMAL:0', JSON.stringify({ name: 'John Doe', version: 0 }))

    store.clear()
    expect(localStorage.getItem('VMO-STORE:NORMAL:0')).toBe(null)
    expect(sessionStorage.getItem('VMO-STORE:NORMAL:0')).toBe(null)
  })

  it('should clear data correctly', () => {
    store.$store.name = 'John Doe'
    store.$store.age = 30

    store.clearData('name')
    expect(store.$store.name).toBeUndefined()
    expect(store.$store.age).toBe(30)

    store.clearData(['name', 'age'])
    expect(store.$store.name).toBeUndefined()
    expect(store.$store.age).toBeUndefined()
  })

  it('should remove prop correctly', () => {
    store.$store.name = 'John Doe'
    store.$store.age = 30

    store.removeProp('name')
    expect(store.$store.name).toBeUndefined()
    expect(store._props.name).toBeUndefined()

    store.removeProp(['age', 'isValid'])
    expect(store.$store.age).toBeUndefined()
    expect(store._props.age).toBeUndefined()
    expect(store.$store.isValid).toBeUndefined()
    expect(store._props.isValid).toBeUndefined()
  })

  it('should get capacity correctly', () => {
    localStorage.setItem('VMO-STORE:NORMAL:1', JSON.stringify({ name: 'John Doe', version: 0 }))
    sessionStorage.setItem('VMO-STORE:NORMAL:1', JSON.stringify({ name: 'John Doe', version: 0 }))

    const capacity = store.getCapacity()
    expect(capacity.localStorage.used).toBe(31)
    expect(capacity.localStorage.limit).toBe('none')
    expect(capacity.sessionStorage.used).toBe(31)
    expect(capacity.sessionStorage.limit).toBe('none')
  })

  it('should get prop correctly', () => {
    expect(store.getProps('name')).toEqual({ type: String, storge: 'localStorage', expireTime: '1d' })
    expect(store.getProps()).toEqual(config.dataProps)
  })

  it('should get crypto key and namespace correctly', () => {
    expect(store.getCryptoKey()).toBe('1234567812345678')
    expect(store.getNameSpace()).toBe('VMO-STORE:NORMAL:1')
  })

  it('should handle function types correctly', async () => {
    store.$store.fetchData = async () => 'data'
    expect(await store.$store.fetchData()).toBe('data')

    store.$store.fetchData = () => { return 'data' }
    expect(store.$store.fetchData()).toBe('data')
  })

  it('should throw error when init', async () => {
    expect(() => {
      new VmoStore()
    }).toThrowError("Cannot read properties of undefined (reading 'cryptoKey')")
  })
  it('should throw error expiredTime wrong type', async () => {
    expect(() => {
      new VmoStore({
        prefix: 'VMO-STORE',
        namespace: 'NORMAL',
        version: '1',
        cryptoKey: 'fdsfsdfffsdas',
        dataProps: {
          name: { type: String, storge: 'localStorage', expireTime: '1d' },
          age: { type: Number, storge: 'sessionStorage', expireTime: '1o' },
          isActive: { type: Boolean, storge: 'localStorage', default: false },
          fetchData: { type: Function, storge: 'sessionStorage', expireTime: '1m' },
          isValid: { type: Boolean, storge: 'localStorage', default: () => true }
        },
        storage: defaultStorageMethodProxy,
        cacheInitCleanupMode: 'all'
      })
    }).toThrowError('The expirationTime setting for property [age] is incorrect; Expected a Number type, or a string of the format [number]d, [number]m, [number]y, or YYYY-MM-DD HH:mm:ss.')
  })
  
  // it('should throw error with undeclared prop', async () => {
  //   expect(store.$store.fetchDatas = () => { return 'data' }).toThrowError("'set' on proxy: trap returned falsish for property 'fetchDatas'")
  // })
})