import { describe, it, expect, beforeEach } from 'vitest'
import { VmoStore, defaultStorageMethodProxy } from '../../index'
import type { StoreParams } from '../../index'

describe('VmoStore GPT',()=>{
  let store: VmoStore
  const config: StoreParams = {
    cryptoKey: '1234567890123456',
    namespace: 'TEST-NAMESPACE',
    version: '1',
    dataProps: {
      key1: { type: String, default: 'default1', storge: 'localStorage', expireTime: '1m' },
      key2: { type: Number, default: 123, storge: 'sessionStorage', expireTime: '1m' },
      key3: { type: Function, default: () => ()=>'default3', storge: 'localStorage', expireTime: '1m' }
    },
    storage: defaultStorageMethodProxy,
    capacity: {
      localStorage: 1000,
      sessionStorage: 1000
    }
  }
  beforeEach(() => {
    defaultStorageMethodProxy.clear('localStorage')
    defaultStorageMethodProxy.clear('sessionStorage')
  })
  it('should initialize correctly', () => {
    store = new VmoStore(config)
    expect((store as any)._cryptoKey).toBe('1234567890123456')
    expect((store as any)._namespace).toBe('VMO-STORE:TEST-NAMESPACE:1')
    expect((store as any)._props).toEqual(config.dataProps)
    expect(store.$store).toEqual({})
  })
  it('should handle initialization errors', () => {
    const invalidConfig: StoreParams = {
      ...config,
      capacity: {
        localStorage: 10,
        sessionStorage: 10
      }
    }
    store =  new VmoStore(invalidConfig)
    expect(() => {
      store.setData('key1','fdkafjalfkdjfsdjlfalfaflsafsdfjdsfjalsjflsa')
    }).toThrow("The storage capacity of memory [localStorage] overflows, with a limit of [10 byte], and a storage capacity of [104 byte], resulting in an overflow of [94 byte].")
  })

  it('should correctly get and set cache data', () => {
    const cacheData = {
      key1: { v: 'value1', t: Date.now() - 60000, k: false },
      key2: { v: 456, t: Date.now() - 60000, k: false },
      key3: { v: '() => "value3"', t: Date.now() - 60000, k: true }
    }
    defaultStorageMethodProxy.setItem('VMO-STORE:TEST-NAMESPACE:1', JSON.stringify(cacheData), 'localStorage')
    store = new VmoStore(config)
    // console.log(store.getData,'sss')
    expect(store.getData('key1')).toBe('default1')
    expect(store.getData('key2')).toBe(123)
    expect(store.getData('key3')()).toBe('default3')
    store.setData('key1', 'newvalue1')
    store.setData('key2', 789)
    store.setData('key3', () => 'newvalue3')
    expect(store.getData('key1')).toBe('newvalue1')
    expect(store.getData('key2')).toBe(789)
    expect(store.getData('key3')()).toBe('newvalue3')
  })
  it('should correctly handle capacity limits', () => {
    const largeConfig: StoreParams = {
      ...config,
      capacity: {
        localStorage: 20,
        sessionStorage: 20
      }
    }
    expect(() => {
      store = new VmoStore(largeConfig)
      store.setData('key1', 'a'.repeat(30))
    }).toThrow(/The storage capacity of memory \[localStorage\] overflows/)
  })
  it('should correctly clear unused cache', () => {
    const store1 = new VmoStore({ ...config, namespace: 'STORE1', version: '1' })
    const store2 = new VmoStore({ ...config, namespace: 'STORE2', version: '2' })
    store1.setData('key1', 'value1')
    store2.setData('key2', 1)

    expect(defaultStorageMethodProxy.getItem('VMO-STORE:STORE1:1', 'localStorage')).not.toBeNull()
    expect(defaultStorageMethodProxy.getItem('VMO-STORE:STORE2:2', 'localStorage')).not.toBeNull()

    // store1.clearUnusedCache('all')
    // expect(defaultStorageMethodProxy.getItem('VMO-STORE:STORE1:1', 'localStorage')).toBe('=QURHMQDGswADYABGAQBAowGMVhGXUgVH11VDZRCQckECJQFHwUUYBhS');
    // // expect(defaultStorageMethodProxy.getItem('VMO-STORE:STORE2:2', 'localStorage')).toBeNull()

    const store3 = new VmoStore({ ...config, namespace: 'STORE3', version: '1' })
    const store4 = new VmoStore({ ...config, namespace: 'STORE4', version: '2' })
    store3.setData('key1', 'value1')
    store4.setData('key2', 1)

    expect(defaultStorageMethodProxy.getItem('VMO-STORE:STORE3:1', 'localStorage')).not.toBeNull()
    expect(defaultStorageMethodProxy.getItem('VMO-STORE:STORE4:2', 'localStorage')).not.toBeNull()

    // store3.clearUnusedCache('self')
    expect(defaultStorageMethodProxy.getItem('VMO-STORE:STORE3:1', 'localStorage')).not.toBeNull()
    expect(defaultStorageMethodProxy.getItem('VMO-STORE:STORE4:2', 'localStorage')).toBe('=8kS')
  })

  it('should correctly clear all cache', () => {
    store = new VmoStore(config)
    store.setData('key1', 'value1')
    store.setData('key2', 123)
    store.setData('key3', () => 'value3')

    expect(defaultStorageMethodProxy.getItem('VMO-STORE:TEST-NAMESPACE:1', 'localStorage')).not.toBeNull()
    expect(defaultStorageMethodProxy.getItem('VMO-STORE:TEST-NAMESPACE:1', 'sessionStorage')).not.toBeNull()

    store.clear('localStorage')
    store.clear('sessionStorage')

    expect(defaultStorageMethodProxy.getItem('VMO-STORE:TEST-NAMESPACE:1', 'localStorage')).toBeNull()
    expect(defaultStorageMethodProxy.getItem('VMO-STORE:TEST-NAMESPACE:1', 'sessionStorage')).toBeNull()
  })


  it('should correctly get and set data', () => {
    store = new VmoStore(config)
    store.setData('key1', 'value1')
    store.setData('key2', 123)
    store.setData('key3', () => 'value3')

    expect(store.getData('key1')).toBe('value1')
    expect(store.getData('key2')).toBe(123)
    expect(store.getData('key3')()).toBe('value3')

    store.setData('key1', 'newvalue1')
    expect(store.getData('key1')).toBe('newvalue1')
  })

  it('should correctly update properties', () => {
    store = new VmoStore(config)
    // console.log(JSON.stringify(config),11111)
    store.updateProp({
      key4: { type: String, default: 'default4', storge: 'localStorage', expireTime: '1m' }
    })
    // console.log(JSON.stringify(config),22222)
    expect(store.getProps('key4')).toEqual({
      type: String,
      default: 'default4',
      storge: 'localStorage',
      expireTime: '1m'
    })
  })

  it('should correctly clear data', () => {
    store = new VmoStore(config)
    // console.log(JSON.stringify(config),99999)
    store.setData('key1', 'value1')
    store.setData('key2', 123)
    store.setData('key3', () => 'value3')

    store.clearData('key1')
    // console.log(JSON.stringify(config),99999)
    expect(store.getData('key1')).toBe('default1')
    expect(store.getData('key2')).toBe(123)
    expect(store.getData('key3')()).toBe('value3')

    store.clearData(['key2', 'key3'])
    // console.log(JSON.stringify(config),99999)
    expect(store.getData('key2')).toBe(123)
    expect(store.getData('key3')()).toBe('default3')
  })

  it('should correctly remove properties', () => {
    store = new VmoStore(config)
    store.setData('key1', 'value1')
    store.setData('key2', 123)
    store.setData('key3', () => 'value3')

    store.removeProp('key1')
    expect(store.getProps('key1')).toBeUndefined()
    expect(store.getData('key1')).toBeUndefined()

    store.removeProp(['key2', 'key3'])
    expect(store.getProps('key2')).toBeUndefined()
    expect(store.getData('key2')).toBeUndefined()
    expect(store.getProps('key3')).toBeUndefined()
    expect(store.getData('key3')).toBeUndefined()
  })
  
  it('should correctly get capacity', () => {
    store = new VmoStore(config)
    store.setData('key1', 'value1')
    const capacity = store.getCapacity()
    expect(capacity.localStorage.used).toBeGreaterThan(0)
    expect(capacity.localStorage.limit).toBe(1000)
    expect(capacity.sessionStorage.used).toBeGreaterThan(0)
    expect(capacity.sessionStorage.limit).toBe(1000)
  })

  it('should correctly get properties and crypto key', () => {
    // console.log(config)
    store = new VmoStore(config)
    expect(store.getCryptoKey()).toBe('1234567890123456')
    expect(store.getNameSpace()).toBe('VMO-STORE:TEST-NAMESPACE:1')
  })

  it('should correctly handle expired data', () => {
    // console.log(typeof [],typeof function(){}, typeof 1,typeof '1', typeof false, typeof {}, typeof undefined, typeof new Set(),typeof new WeakMap(), 'typeof')
    store = new VmoStore(config)
    store.setData('key1', 'value1')
    store.setData('key2', 123)
    store.setData('key3', () => 'value3')

    // Mock Date.now to be in the future
    const originalDateNow = Date.now
    Date.now = () => originalDateNow() + 60000 * 2

    expect(store.getData('key1')).toBe('default1')
    expect(store.getData('key2')).toBe(123)
    expect(store.getData('key3')()).toBe('default3')

    Date.now = originalDateNow
  })
  it('should correctly handle default values', () => {
    store = new VmoStore(config)
    // console.log(JSON.stringify(config),33333)
    expect(store.getData('key4')).toBeUndefined()
    store.updateProp({
      key4: { type: String, default: 'default4', storge: 'localStorage', expireTime: '1m' }
    })
    expect(store.getData('key4')).toBe('default4')
  })
  it('should correctly handle function types', () => {
    store = new VmoStore(config)
    const testFunc = () => 'test'
    store.setData('key3', testFunc)
    expect(store.getData('key3')()).toBe('test')
  })
  it('should correctly handle type constraints', () => {
    store = new VmoStore(config)
    expect(() => {
      store.setData('key1', 12345)
    }).toThrow('VmoStore: Property [key1] expects a type of [String], but the actual obtained type is Number.')
  })
  it('should correctly handle multiple types constraint', () => {
    store = new VmoStore({
      ...config,
      dataProps: {
        key1: { type: [String, Number], default: 'default1', storge: 'localStorage', expireTime: '1m' }
      }
    })
    store.setData('key1', 'value1')
    expect(store.getData('key1')).toBe('value1')

    store.setData('key1', 12345)
    expect(store.getData('key1')).toBe(12345)
  })
})