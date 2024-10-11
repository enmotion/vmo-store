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
    storge: 'sessionStorge' | 'localStorge'
  }
>

export type StoreParams = {
  namespace?: string
  prefix?: string
  version?: number
  cryptoKey?: string
  dataProps: DataProps
}
