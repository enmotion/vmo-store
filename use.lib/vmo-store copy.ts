/*
 * @Author: enmotion
 * @Date: 2024-09-13 02:15:16
 * @Last Modified by: enmotion
 * @Last Modified time: 2024-09-14 10:38:36
 */
import type { DataProps, StoreParams } from '@type'

/**
 * VmoStore:Class
 * 本地缓存管理类
 */
export class VmoStore {
  private _cryptoKey: string | undefined // 加密 KEY【16】位任意字符
  private _namespace: string // 命名空间
  private _props: DataProps // 数据属性描述
  private _cache: WeakMap<object, any> = new WeakMap()
  private _data: Record<string, any> // 本地数据
  public $data: Record<string, any>

  /**
   * constructor:Function 构造函数
   * @param config <StoreParams>
   */
  constructor(config: StoreParams) {
    this._cryptoKey = config.cryptoKey // 加密 KEY【16】位任意字符
    this._namespace = `${config.prefix ?? 'VMO-STORE'}:${config.namespace ?? 'NORMAL'}:${config.version ?? 0}` // 命名空间 前缀名:命名空间:版本号
    this._props = config.dataProps // 数据属性描述
    this._data = {} // 缓存代理数据
    this.$data = this.createProxy(this._data) // 创建缓存数据代理
  }
  /**
   * createProxy:Function 创建代理
   * @param target // 代理目标
   * @param handler // 代理处理函数
   * @param cache // 代理
   * @returns
   */
  private createProxy(
    target: Record<string, any> | any[],
    handler: ProxyHandler<Record<string, any>> = {
      get: function (target, prop /*receiver*/) {
        console.log(`Getting ${prop as string}`)
        return prop in target ? target[prop as string] : `Property ${prop as string} does not exist`
      },
      set: function (target, prop, value /*receiver*/) {
        console.log(`Setting ${prop as string} to ${value}`)
        target[prop as string] = value
        return true // 表示操作成功
      }
    }
  ) {
    const THIS = this
    if (THIS._cache.has(target)) {
      return THIS._cache.get(target)
    }
    const proxyHandler: ProxyHandler<Record<string, any>> = {
      get: function (target, prop: string) {
        console.log(`Getting target:${JSON.stringify(target)} prop: ${prop}`)
        const value = target[prop]
        if (!!value && [Object].includes(value.constructor)) {
          return THIS.createProxy(value, handler)
        }
        return prop in target ? target[prop] : undefined
      },
      set: function (target, prop: string, value /*receiver*/) {
        // console.log(`Setting ${prop} to ${JSON.stringify(value)}`)
        console.log('update', prop, target)
        if (!!value && [Object].includes(value.constructor)) {
          value = THIS.createProxy(value, handler)
        }
        target[prop] = value
        return true // 表示操作成功
      }
    }
    const proxy = new Proxy(target, proxyHandler)
    THIS._cache.set(target, proxy)
    return proxy
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
