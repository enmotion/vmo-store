# API 参考

## VmoStore

`new VmoStore<T>(config: StoreParams)` 创建实例。`T` 默认为 `Record<string, any>`。实例与属性选项见[配置与类型](../guide/configuration)。

| 成员 | 签名 / 返回值 | 行为 |
| --- | --- | --- |
| `$store` | `Partial<T>` | 顶层赋值代理；读取可能缺少数据 |
| `getData` | `(key: K): T[K] \| undefined` | 读取缓存值或默认值 |
| `setData` | `(key: K, value: T[K]): T[K]` | 校验、持久化成功后更新内存，返回赋值 |
| `clearData` | `(key: string \| string[]): void` | 删除值，保留声明 |
| `removeProp` | `(key: string \| string[]): void` | 删除值和声明 |
| `clear` | `(type?: 'localStorage' \| 'sessionStorage'): void` | 清理当前命名空间及内存 |
| `clearUnusedCache` | `(mode: 'all' \| 'self'): void` | 清理所属范围中的旧缓存键 |
| `updateProp` | `(props: DataProps): void` | 新增或更新声明 |
| `getProps` | `(key?: string)` | 一个或全部声明的副本；未知键返回 undefined |
| `getCapacity` | `(): { localStorage, sessionStorage }` | 每种存储包含 `used` 和 `limit` |
| `getNameSpace` | `(): string` | `prefix:namespace:version` |
| `getCryptoKey` | `(): string \| undefined` | 配置的数据混淆密钥 |

`K` 为 `T` 的键。未知读取返回 undefined；未声明赋值和未知清理键会抛错。`$store` 不允许 `Object.defineProperty`，请使用赋值或 `setData`。

## 导出类型

| 类型 | 用途 |
| --- | --- |
| `BasicType` | 支持的运行时构造函数 |
| `DataProps` | 属性声明映射 |
| `StoreParams` | 实例配置 |
| `CacheData<T>` | 包含值与写入时间的内部数据映射 |
| `Capacity` | 可选 localStorage/sessionStorage 上限 |
| `StorageMethodProxy` | 同步存储适配器约定 |

## defaultStorageMethodProxy

方法包括 `setItem`、`getItem`、`removeItem`、`clear`、`getKeys`。单项方法不传后端时默认 localStorage；`clear`/`getKeys` 不传后端则处理两种存储。`getKeys()` 会去重。

它的 `clear()` 清空整个后端；需要限定命名空间时应使用实例的 `clear()`。

## 异常

类型不匹配、未知赋值/清理键、版本/容量/期限无效、不支持的序列化、容量超限和适配器失败都会抛错，可在应用边界处理。缓存解析或解码失败在读取阶段被隔离，不会丢弃其他有效字段。
