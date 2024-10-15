export type BasicType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor
  | DateConstructor
  | FunctionConstructor
  | { (): Promise<any> }
  | RegExpConstructor
  | MapConstructor
  | SetConstructor
  | AsyncGenerator

export type CacheData = Record<string, { v: any[]; t: number; k?: boolean }>
export type StorageProxyMethods = {
  setItem: { (key: string, value: any, type: 'localStorage' | 'sessionStorge'): any }
  getItem: { (key: string, type: 'localStorage' | 'sessionStorge'): string | null }
  removeItem: { (key: string, type: 'localStorage' | 'sessionStorge'): any }
  clear: { (type: 'localStorage' | 'sessionStorge'): any }
}
export type ExpireTime =
  | number
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`
  | `${number}-${number}-${number} ${number}:${number}:${number}`

export type DataProps = Record<
  string,
  {
    type: BasicType | BasicType[] // 类型
    default: string | number | boolean | { (): any } // 默认值
    expireTime?: ExpireTime
    storge: 'sessionStorge' | 'localStorage'
  }
>

export type StoreParams = {
  namespace?: string
  prefix?: string
  version?: number
  cryptoKey?: string
  dataProps: DataProps
  storage?: StorageProxy
}
