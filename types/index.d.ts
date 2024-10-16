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
export type StorageMethodProxy = {
  setItem: { (key: string, value: any, type?: 'localStorage' | 'sessionStorage'): any }
  getItem: { (key: string, type?: 'localStorage' | 'sessionStorage'): string | null }
  removeItem: { (key: string, type?: 'localStorage' | 'sessionStorage'): any }
  clear: { (type?: 'localStorage' | 'sessionStorage'): any }
  getKeys: { (type?: 'localStorage' | 'sessionStorage'): string[] }
}
export type Capacity = {
  local?: number
  session?: number
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
    storge: 'sessionStorage' | 'localStorage'
  }
>

export type StoreParams = {
  namespace?: string
  prefix?: string
  version?: number | string
  cryptoKey?: string
  dataProps: DataProps
  capacity?: Capacity
  storage?: StorageMethodProxy
  cacheInitCleanupMode?: 'all' | 'self'
}
