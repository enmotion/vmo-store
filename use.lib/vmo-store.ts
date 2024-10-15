/*
 * @Author: enmotion
 * @Date: 2024-09-13 02:15:16
 * @Last Modified by: enmotion
 * @Last Modified time: 2024-10-15 18:09:20
 */
// import { ref, watch } from 'vue'
import type { DataProps, BasicType, StoreParams, ExpireTime, StorageProxyMethods, CacheData } from '@type'
import { enCrypto, deCrypto } from './crypto-key'
/**
 * 默认缓存代理,可以更改此处的方法，更换自己需要的缓存器
 *
 */
const defaultStorage: StorageProxyMethods = {
  setItem: (key, value, type) => {
    const storage = type == 'localStorage' ? localStorage : sessionStorage
    return storage.setItem(key, value)
  },
  getItem: (key, type) => {
    const storage = type == 'localStorage' ? localStorage : sessionStorage
    return storage.getItem(key)
  },
  removeItem: (key, type) => {
    const storage = type == 'localStorage' ? localStorage : sessionStorage
    return storage.removeItem(key)
  },
  clear: type => {
    const storage = type == 'localStorage' ? localStorage : sessionStorage
    return storage.clear()
  }
}
/**
 * VmoStore:Class
 * 本地缓存管理类
 */
export class VmoStore {
  private _cryptoKey: string | undefined // 加密 KEY【16】位任意字符
  private _namespace: string // 命名空间
  private _props: DataProps // 缓存数据 元信息描述
  // private _proxy_pool: WeakMap<object, any> = new WeakMap() // 代理池
  private _data: CacheData // 热数据 v:数组格式保存的数据,t:存储时间, k:是否要经过 eval 转化
  private _storage: StorageProxyMethods
  public $store: Record<string, any>
  /**
   * constructor:Function 构造函数
   * @param config <StoreParams>
   */
  constructor(config: StoreParams) {
    this._cryptoKey = config.cryptoKey // 加密 KEY【16】位任意字符
    this._namespace = `${config.prefix ?? 'VMO-STORE'}:${config.namespace ?? 'NORMAL'}:${config.version ?? 0}` // 命名空间 前缀名:命名空间:版本号, 版本号作为清理数据的标识
    this._props = config.dataProps // 数据属性描述
    this._storage = config.storage ?? defaultStorage
    this._data = this._getCache() // 缓存代理数据
    this.$store = this._createProxy(this._data) // 创建缓存数据代理
  }
  /**
   * 获取缓存呢数据
   * @returns {Record<string,any>}
   */
  private _getCache() {
    try {
      const cache: { localStorage: Record<string, any>; sessionStorge: Record<string, any> } = {
        localStorage:
          JSON.parse(
            !this._cryptoKey
              ? this._storage.getItem(this._namespace, 'localStorage') ?? '{}'
              : deCrypto(this._storage.getItem(this._namespace, 'localStorage') ?? '', this._cryptoKey)
          ) ?? {}, // 获取 localStorage 中缓存的全部数据
        sessionStorge:
          JSON.parse(
            !this._cryptoKey
              ? this._storage.getItem(this._namespace, 'sessionStorge') ?? '{}'
              : deCrypto(this._storage.getItem(this._namespace, 'sessionStorge') ?? '', this._cryptoKey)
          ) ?? {} // 获取 localStorage 中缓存的全部数据
      }
      const result: Record<string, { v: any[]; t: number; k?: boolean }> = {}
      Object.keys(this._props).forEach(key => {
        // console.warn(key, this._props[key].storge)
        result[key] = cache[this._props[key].storge][key]
      })
      return result
    } catch (err) {
      console.error(err)
      return {}
    }
  }
  private _setCache(prop: string) {
    const T = this
    const type = T._props[prop].storge
    const keys = Object.keys(T._props).filter(key => T._props[key].storge == type)
    const store = T._pick(keys, T._data)
    T._storage.setItem(
      T._namespace,
      !T._cryptoKey ? JSON.stringify(store) : enCrypto(JSON.stringify(store), T._cryptoKey),
      type
    ) // 将数据缓存入持久化
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
       * 3. 判断类型是否符合 _props 声明预期
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
            let value: any = null
            // 获取属性的类型
            const types = T._getTypes(T._props[prop].type)
            // console.log(prop, types, 'types')
            // 获取属性值，必须满足 0:未设置过期时间||未过期 返回 缓存值 或 默认值
            if (!T._props[prop]?.expireTime || Date.now() < T._isExpired(prop, T._props[prop].expireTime)) {
              value = data?.v ?? T._getDefaultValue(T._props[prop]?.default)
            } else {
              value = T._getDefaultValue(T._props[prop]?.default)
              // 发现默认值情况，不论是否存在该数据，都应该清理本地缓存 可以进一步优化
              if (!!data) {
                delete target[prop] // 删除 target 中的数值
                T._setCache(prop)
              }
            }
            // 返回值，必须 0:类型匹配 否则返回 undefined
            return types.includes(value?.constructor) ? value : undefined
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
       * 2. 判断写入类型，是否为声明内约束的合法类型
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
            if (types.includes(value.constructor)) {
              const data = { v: value, t: Date.now() } // 更新数据
              Reflect.set(target, prop, data, receiver) // 将数据更新到热数据
              T._setCache(prop)
              return true
            } else {
              throw new Error(
                `Property [${prop}] expects a type of [${types.map(
                  constructor => (constructor as any)?.name
                )}], but the actual obtained type is ${value.constructor?.name}.`
              )
            }
          } else {
            throw new Error('当前附值，并未声明')
          }
        } catch (err) {
          throw err
        }
      }
    }
    const proxy = new Proxy(target, proxyHandler)
    return proxy
  }
  /**
   * pick 方法
   * @param keys
   * @param data
   * @returns
   */
  private _pick(keys: string[], data: Record<string, any>) {
    const result: Record<string, any> = {}
    keys.forEach(k => {
      // console.warn(k, data, data[k])
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
  private _isExpired(prop: string, time: ExpireTime = Date.now() + 1000): number {
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
    value:
      | string
      | number
      | boolean
      | {
          (): any
        }
  ) {
    return value.constructor == Function ? (value as () => any)() : value
  }
  /**
   * 获取缓存对象的声明类型数组，方便判断
   * @param type
   * @returns
   */
  private _getTypes(type: BasicType | BasicType[]) {
    // console.log('_getTypes', type.constructor)
    return type.constructor == Array ? type : [type]
  }
  /**
   * 获取缓存对象
   * @param prop
   * @returns
   */
  public getItem(prop: string) {
    return this.$store[prop]
  }
  public setItem(prop: string, value: any) {
    return (this.$store[prop] = value)
  }
  public getProps() {
    return this._props
  }
  public getCryptoKey() {
    return this._cryptoKey
  }
  public getNameSpace() {
    return this._namespace
  }
}
