/*
 * @Author: enmotion
 * @Date: 2024-09-13 02:15:16
 * @Last Modified by: enmotion
 * @Last Modified time: 2024-09-14 10:38:36
 */
import type { DataProps, BasicType, StoreParams, ExpireTime } from '@type'

/**
 * VmoStore:Class
 * 本地缓存管理类
 */
export class VmoStore {
  private _cryptoKey: string | undefined // 加密 KEY【16】位任意字符
  private _namespace: string // 命名空间
  private _props: DataProps // 缓存数据 元信息描述
  // private _proxy_pool: WeakMap<object, any> = new WeakMap() // 代理池
  private _data: Record<string, { v: any[]; t: number }> // 热数据
  public $store: Record<string, any>

  /**
   * constructor:Function 构造函数
   * @param config <StoreParams>
   */
  constructor(config: StoreParams) {
    this._cryptoKey = config.cryptoKey // 加密 KEY【16】位任意字符
    this._namespace = `${config.prefix ?? 'VMO-STORE'}:${config.namespace ?? 'NORMAL'}:${config.version ?? 0}` // 命名空间 前缀名:命名空间:版本号
    this._props = config.dataProps // 数据属性描述
    this._data = JSON.parse(localStorage.getItem(this._namespace) ?? '{}') ?? {} // 缓存代理数据
    this.$store = this._createProxy(this._data) // 创建缓存数据代理
  }
  /**
   * _createProxy:Function 创建代理
   * @param target // 代理目标
   * @returns
   */
  private _createProxy(target: Record<string, any>) {
    const T = this // 固定指针
    const proxyHandler: ProxyHandler<Record<string, any>> = {
      get: function (target, prop: string /* receiver */) {
        try {
          /* 键名对应的 缓存数据 元信息描述 是否存在  */
          if (Object.keys(T._props).includes(prop)) {
            // 存在:尝试取值
            const data = Reflect.get(target, prop)
            let value: any = null
            // 获取属性的类型
            const types = T._props[prop].type.constructor == Array ? T._props[prop].type : [T._props[prop].type]
            // 获取属性值，必须满足 0:未设置过期时间||未过期 返回 缓存值 或 默认值
            if (!T._props[prop]?.expireTime || Date.now() < T._isExpired(prop, T._props[prop]?.expireTime)) {
              value = data?.v?.[0]
            } else {
              value = T._getDefaultValue(T._props[prop]?.default)
              // 发现默认值情况，不论是否存在该数据，都应该清理本地缓存 可以进一步优化
              if (!!data) {
                delete target[prop]
                localStorage.setItem(T._namespace, JSON.stringify(target)) // 将数据缓存入持久化
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
      set: function (target, prop: string, value, receiver) {
        try {
          /* 键名对应的 缓存数据 元信息描述 是否存在  */
          if (Object.keys(T._props).includes(prop)) {
            const types = T._props[prop].type.constructor == Array ? T._props[prop].type : [T._props[prop].type]
            if (types.includes(value.constructor)) {
              const data = { v: [value], t: Date.now() } // 更新数据
              Reflect.set(target, prop, data, receiver) // 将数据更新到热数据
              localStorage.setItem(T._namespace, JSON.stringify(target)) // 将数据缓存入持久化
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
   * 获取最大过期时间
   * @param prop 用于输出的属性名
   * @param time 过期时间
   * @returns {number}
   */
  private _isExpired(prop: string, time: ExpireTime): number {
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
   * 获取默认值, 默认值除了值类型，都会自动返回
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
