/*
 * @Author: enmotion
 * @Date: 2024-09-13 02:15:16
 * @Last Modified by: enmotion
 * @Last Modified time: 2024-10-17 10:18:26
 */
// import { ref, watch } from 'vue'
import type { DataProps, BasicType, StoreParams, ExpireTime, StorageMethodProxy, CacheData, Capacity } from '@type'
import { enCrypto, deCrypto } from './crypto-key'
import { defaultStorageMethodProxy } from './default-storage'

const NormlFunc = function () {}.constructor
const AsyncFunc = async function () {}.constructor
// console.log(Function == NormlFunc, isAsyncFunction AsyncFunc)
/**
 * VmoStore:Class
 * 本地缓存管理类
 */
export class VmoStore {
  private _cryptoKey: string | undefined // 加密 KEY任意字符
  private _namespace: `${string}:${string}:${number}` // 命名空间
  private _props: DataProps // 缓存数据 元信息描述
  private _data: CacheData // 热数据 v:数组格式保存的数据,t:存储时间, k:是否要经过 eval 转化
  private _storage: StorageMethodProxy // 存储层方法，可替换存储层，以适应不同的 前端环境
  private _capacity: Capacity // 容量
  public $store: Record<string, any>
  /**
   * constructor:Function 构造函数
   * @param config <StoreParams>
   */
  constructor(config: StoreParams) {
    try {
      this._cryptoKey = config.cryptoKey // 加密 KEY【16】位任意字符
      this._namespace = `${config.prefix ?? 'VMO-STORE'}:${config.namespace ?? 'NORMAL'}:${
        parseInt(config.version as string) ?? 0
      }` // 命名空间 前缀名:命名空间:版本号, 版本号作为清理数据的标识
      this._props = config.dataProps // 数据属性描述
      this._storage = config.storage ?? defaultStorageMethodProxy
      this._data = this._getCache() // 缓存代理数据
      this.$store = this._createProxy(this._data) // 创建缓存数据代理
      this._capacity = config.capacity ?? {}
      Object.defineProperty(this, 'constantValue', {
        value: config.capacity ?? {}, // 属性值
        writable: false, // 不可写
        configurable: false // 不可配置（不可删除或重新定义）
      })
      config.cacheInitCleanupMode && this.clearUnusedCache(config.cacheInitCleanupMode)
      this._setCache('localStorage')
      this._setCache('sessionStorage')
    } catch (err) {
      this._data = {}
      this._setCache('localStorage')
      this._setCache('sessionStorage')
      throw new Error(
        `The currently cached data volume exceeds the storage capacity limit, and the data has become invalid.`
      )
    }
  }
  /**
   * 获取缓存呢数据
   * 1. 获取所有 localStorage 中的缓存数据
   * 2. 获取所有 sessionStorage 中的缓存数据
   * 3. 依照 _props 中的约定，分别在 localStorage 与 sessionStorage 中取出相关数据，组装成最终的缓存数据
   * 4. 清理缓存数据
   * @returns {Record<string,any>}
   */
  private _getCache() {
    const T = this
    try {
      const cache: { localStorage: Record<string, any>; sessionStorage: Record<string, any> } = {
        localStorage:
          JSON.parse(
            !T._cryptoKey
              ? T._storage.getItem(T._namespace, 'localStorage') ?? '{}'
              : deCrypto(T._storage.getItem(T._namespace, 'localStorage') ?? '', T._cryptoKey)
          ) ?? {}, // 获取 localStorage 中缓存的全部数据
        sessionStorage:
          JSON.parse(
            !T._cryptoKey
              ? T._storage.getItem(T._namespace, 'sessionStorage') ?? '{}'
              : deCrypto(T._storage.getItem(T._namespace, 'sessionStorage') ?? '', T._cryptoKey)
          ) ?? {} // 获取 localStorage 中缓存的全部数据
      }
      const result: Record<string, { v: any[]; t: number; k?: boolean }> = {}
      console.log(cache, 'cache')
      Object.keys(T._props).forEach(key => {
        result[key] = cache[T._props[key].storge ?? 'localStorage'][key]
      })
      return result
    } catch (err) {
      console.warn(err)
      return {}
    }
  }
  private _setCache(type: 'sessionStorage' | 'localStorage') {
    const T = this
    const keys = Object.keys(T._props).filter(
      key => T._props[key].storge == type && Date.now() < T._getExpiredTime(key, T._props[key]?.expireTime)
    )
    const store = T._pick(keys, T._data)
    const dataString = !T._cryptoKey ? JSON.stringify(store) : enCrypto(JSON.stringify(store), T._cryptoKey)
    if (!T._capacity?.[type] || (T._capacity[type] as number) >= new Blob([dataString]).size) {
      console.log(type, T._capacity?.[type], new Blob([dataString]).size, dataString)
      T._storage.setItem(T._namespace, dataString, type) // 将数据缓存入持久化
    } else {
      console.log(type, T._capacity?.[type], new Blob([dataString]).size, dataString)
      throw new Error(
        `The storage capacity of memory [${type}] overflows, with a limit of [${
          T._capacity?.[type]
        } byte], and a storage capacity of [${new Blob([dataString]).size} byte], resulting in an overflow of [${
          new Blob([dataString]).size - (T._capacity[type] as number)
        } byte].`
      )
    }
  }
  /**
   * _createProxy:Function 创建代理
   * @param target // 代理目标
   * @returns
   */
  private _createProxy(target: Record<string, any>) {
    const T = this // 固定指针
    const proxyHandler: ProxyHandler<Record<string, any>> = {
      /**
       * 获取代理对象的属性值
       * 处理步骤：
       * 1. 判断该属性是否为 _props 内声明的合法属性
       * 2. 判断该属性 是否过期
       * 3. 判断类型是否符合 _props 声明预期 如果声明为 Function 类型，则同步异步方法都支持
       * 附加操作：
       * 1. 如果过期，则需要进行持久化缓存的对应清理
       * @param target 代理的对象
       * @param prop 获取的值
       * @param receiver
       * @returns
       */
      get: function (target, prop: string, receiver) {
        try {
          /* 键名对应的 缓存数据 元信息描述 是否存在  */
          if (Object.keys(T._props).includes(prop)) {
            // 存在:尝试取值
            const data = Reflect.get(target, prop, receiver)
            let value: any // 声明值但暂不赋值
            // 获取属性的类型
            const types = T._getTypes(T._props[prop].type)
            // 获取属性值，必须满足 0:未设置过期时间||未过期 返回 缓存值 或 默认值
            if (!T._props[prop]?.expireTime || Date.now() < T._getExpiredTime(prop, T._props[prop].expireTime)) {
              value = data?.k ? eval('(' + data?.v + ')') : data?.v // 如过值未过期，则返回真正的值，函数形式的值会由字符串转为函数
            } else {
              // 发现默认值情况，不论是否存在该数据，都应该清理本地缓存 可以进一步优化
              if (!!data) {
                delete target[prop] // 删除 target 中的数值
                T._setCache(T._props[prop].storge ?? 'localStorage')
              }
            }
            // 返回值，必须 0:类型匹配 否则返回 undefined
            return types.includes(value?.constructor) ||
              (types.includes(Function) && [NormlFunc, AsyncFunc].includes(value?.constructor))
              ? value
              : T._getDefaultValue(T._props[prop]?.default)
          } else {
            // 不存在:直接返回 undefined
            return undefined
          }
        } catch (err) {
          console.error(err)
        }
      },
      /**
       * 写入代理对象的属性值
       * 处理步骤：
       * 1. 判断该属性是否为 _props 内声明的合法属性
       * 2. 判断写入类型，是否为声明内约束的合法类型, 如果声明为 Function 类型，则同步异步方法都支持
       * 3. 更新热数据
       * 4. 更新持久化数据
       * @param target
       * @param prop
       * @param value
       * @param receiver
       * @returns
       */
      set: function (target, prop: string, value, receiver) {
        try {
          /* 键名对应的 缓存数据 元信息描述 是否存在  */
          if (Object.keys(T._props).includes(prop)) {
            const types = T._getTypes(T._props[prop].type)
            if (
              types.includes(value?.constructor) ||
              (types.includes(Function) && [NormlFunc, AsyncFunc].includes(value?.constructor))
            ) {
              const data = {
                v: [NormlFunc, AsyncFunc].includes(value.constructor) ? value.toString() : value,
                t: Date.now(),
                k: [NormlFunc, AsyncFunc].includes(value.constructor) ? true : undefined
              } // 更新数据
              Reflect.set(target, prop, data, receiver) // 将数据更新到热数据
              T._setCache(T._props[prop].storge ?? 'localStorage')
              return true
            } else {
              throw new Error(
                `VmoStore: Property [${prop}] expects a type of [${types.map(
                  constructor => (constructor as any)?.name
                )}], but the actual obtained type is ${value?.constructor?.name}.`
              )
            }
          } else {
            throw new Error('当前附值，并未声明')
          }
        } catch (err) {
          throw err as Error
        }
      }
    }
    const proxy = new Proxy(target, proxyHandler)
    return proxy
  }
  /**
   * pick 方法
   * @param keys 挑选出来的可key
   * @param data 目标对象
   * @returns {Reocrd<string,any>}
   */
  private _pick(keys: string[], data: Record<string, any>) {
    const result: Record<string, any> = {}
    keys.forEach(k => {
      result[k] = data[k]
    })
    return result
  }
  /**
   * 获取最大过期时间
   * 1. 如果过期时间设置的为一个数值，则 存储时间+配置的绝对值数值 返回 单位毫秒
   * 2. 如果过期时间设置 满足 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss 那么则可以理解为当前过期时间配置的为具体定期时间，则直接转换为绝对过期时间数值返回
   * 2. 如果过期时间配置的为 s,m,h,d 这种形式，则直接转换为 存储时间+转换后的绝对时间返回 单位 s:秒,m:分, h:时, d:天
   * @param prop 用于输出的属性名
   * @param time 过期时间
   * @returns {number}
   */
  private _getExpiredTime(prop: string, time: ExpireTime = Date.now() + 1000): number {
    const T = this
    if (time.constructor == Number) {
      return T._data[prop]?.t + Math.abs(time)
    }
    const regex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2}){0,1}$/g
    if (regex.test(time as string)) {
      return new Date(time).getTime()
    }
    const regex2 = /^\d+(\.\d+){0,1}(s|m|h|d)$/g
    if (regex2.test(time as string)) {
      const unit = {
        s: 1000,
        m: 1000 * 60,
        h: 1000 * 60 * 60,
        d: 1000 * 60 * 60 * 24
      }[['s', 'm', 'h', 'd'].filter(item => (time as string).includes(item))[0]]
      return T._data[prop]?.t + parseFloat(time as string) * (unit ?? 0)
    }
    throw new Error(
      `The expirationTime setting for property [${prop}] is incorrect; Expected a Number type, or a string of the format [number]d, [number]m, [number]y, or YYYY-MM-DD HH:mm:ss.`
    )
  }
  /**
   * 获取默认值
   * 1. 默认值配置如果是函数，则返回函数执行结果
   * 2. 默认值如果是值类型，则直接返回值
   * @param value
   * @returns
   */
  private _getDefaultValue(
    value?:
      | string
      | number
      | boolean
      | {
          (): any
        }
  ) {
    return value?.constructor == Function ? (value as () => any)() : value
  }
  /**
   * 获取缓存对象的声明类型数组，方便判断
   * @param type
   * @returns
   */
  private _getTypes(type: BasicType | BasicType[]) {
    return type.constructor == Array ? type : [type]
  }
  /**
   * 缓存回收 除自身 命名空间 外
   * @param type // all: 所有缓存, self:仅仅 相同命名空间，但是版本不同的回收
   */
  public clearUnusedCache(type: 'all' | 'self') {
    const T = this
    const itemKeys = T._storage.getKeys()
    switch (type) {
      case 'all':
        itemKeys
          .filter(key => key != T._namespace)
          .forEach(key => {
            T._storage.removeItem(key, 'localStorage')
            T._storage.removeItem(key, 'sessionStorage')
          })
        break
      case 'self':
        const prefixText = T._namespace.split(':').slice(0, -1).join(':') + ':'
        const RegEx = new RegExp(`^${prefixText}\\d+$`)
        itemKeys
          .filter(key => {
            return RegEx.test(key) && T._namespace !== key
          })
          .map(key => {
            T._storage.removeItem(key, 'localStorage')
            T._storage.removeItem(key, 'sessionStorage')
          })
    }
  }
  /**
   * 清理所有的缓存
   * @param type
   */
  public clear(type?: 'localStorage' | 'sessionStorage') {
    if (!!type) {
      this._storage.clear(type)
    } else {
      this._storage.clear('localStorage')
      this._storage.clear('sessionStorage')
    }
  }
  /**
   * 获取缓存对象
   * @param prop
   * @returns
   */
  public getData(prop: string) {
    return this.$store[prop]
  }
  public setData(prop: string, value: any) {
    return (this.$store[prop] = value)
  }

  public updateProp(props: DataProps) {
    this._props = Object.assign(this._props, props)
  }
  /**
   * 清除数据
   * 仅仅清除对应的缓存值，不会更改其声明内容
   * @param prop
   */
  public clearData(prop: string | string[]) {
    if (prop.constructor == String) {
      const type = this._props[prop].storge ?? 'localStorage'
      delete this._data[prop]
      this._setCache(type)
    } else {
      ;(prop as string[]).forEach(key => {
        const type = this._props[key].storge ?? 'localStorage'
        delete this._data[key]
        this._setCache(type)
      })
    }
  }
  /**
   * 清除属性
   * 会清除相关的属性声明与缓存值
   * @param prop
   */
  public removeProp(prop: string | string[]) {
    if (prop.constructor == String) {
      const type = this._props[prop].storge ?? 'localStorage'
      delete this._data[prop]
      delete this._props[prop]
      this._setCache(type)
    } else {
      ;(prop as string[]).forEach(key => {
        const type = this._props[key].storge ?? 'localStorage'
        delete this._data[key]
        delete this._props[key]
        this._setCache(type)
      })
    }
  }
  /**
   * huoqu
   * @returns
   */
  public getCapacity() {
    const T = this
    return {
      localStorage: {
        used: new Blob([T._storage.getItem(T._namespace, 'localStorage') as string]).size,
        limit: T._capacity?.localStorage ?? 'none'
      },
      sessionStorage: {
        used: new Blob([T._storage.getItem(T._namespace, 'sessionStorage') as string]).size,
        limit: T._capacity?.sessionStorage ?? 'none'
      }
    }
  }
  public getProps(key?: string) {
    return key ? this._props[key] : this._props
  }
  public getCryptoKey() {
    return this._cryptoKey
  }
  public getNameSpace() {
    return this._namespace
  }
}
