# VmoStore

`VmoStore` 是一个本地缓存管理类，用于在浏览器环境中方便地管理、存储和检索数据。它设计为具有版本控制、命名空间隔离和可配置的存储容量限制功能，使其适用于各种缓存场景。

## 特性

- 支持多种数据类型的缓存。
- 配置化的数据结构说明和过期时间。
- 存储命名空间和版本管理。
- 支持数据加密（可选）。
- 基于容量限制的存储管理和缓存清理。

## 安装

```javascript
npm i vmo-store
```

## 使用说明

#### 创建实例

```javascript
const vmoStore = new VmoStore({
  namespace: 'myApp', // 命名空间
  prefix: 'APP', // 前置别名
  version: 1, // 版本
  cryptoKey: 'yourCryptoKeyHere', // 加密KEY,如果为空，则不会启用缓存加密能力
  dataProps: {
    user: {
      type: String, // 数据类型 支持多类型[String,Array,Number]
      storge: 'localStorage', // 指定 localStorage
      default: '111', // 默认值
      expireTime: '1d' // 过期时间 1天,
      /**
       * 过期时间可以设置为3种
       * 1. 数值，以毫秒为加时方式，以写入或者更新是时间为起点值+expireTime
       * 2. 类型字符 s秒,m分,h时,d天 先转换为毫秒数值，再1写入或者更新是时间为起点值+expireTime
       * 2. 固定日期格式 "YYYY-MM-DD HH:mm:ss" 定期过期方式
       */
    },
    settings: {
      type: [Object, Array], // 数据类型
      default: () => ({}), // 引用型默认值,请都采用函数返回形式
      storge: 'sessionStorage' // 指定 sessionStorage 缓存器
    }
  }, // 存储数据声明
  capacity: {
    localStorage: 5000, // localStorage 存储上限
    sessionStorage: 3000 // sessionStorage 存储上限
  },
  cacheInitCleanupMode: 'self' // 初始化时清理缓存, 可选 'all':清楚除自身外所有缓存数据 或 'self':仅清除除自身版本外，相同命名空间与前置别名的缓存的
})
```
`TypeScript` 强约束模式
```javascript
const vmoStore = new VmoStore<{user:string,settings:Record<string,any>|any[]}>({
  namespace: 'myApp', // 命名空间
  prefix: 'APP', // 前置别名
  version: 1, // 版本
  cryptoKey: 'yourCryptoKeyHere', // 加密KEY,如果为空，则不会启用缓存加密能力
  dataProps: {
    user: {
      type: String, // 数据类型 支持多类型[String,Array,Number]
      storge: 'localStorage', // 指定 localStorage
      default: '111', // 默认值
      expireTime: '1d' // 过期时间 1天,
      /**
       * 过期时间可以设置为3种
       * 1. 数值，以毫秒为加时方式，以写入或者更新是时间为起点值+expireTime
       * 2. 类型字符 s秒,m分,h时,d天 先转换为毫秒数值，再1写入或者更新是时间为起点值+expireTime
       * 2. 固定日期格式 "YYYY-MM-DD HH:mm:ss" 定期过期方式
       */
    },
    settings: {
      type: [Object, Array], // 数据类型
      default: () => ({}), // 引用型默认值,请都采用函数返回形式
      storge: 'sessionStorage' // 指定 sessionStorage 缓存器
    }
  }, // 存储数据声明
  capacity: {
    localStorage: 5000, // localStorage 存储上限
    sessionStorage: 3000 // sessionStorage 存储上限
  },
  cacheInitCleanupMode: 'self' // 初始化时清理缓存, 可选 'all':清楚除自身外所有缓存数据 或 'self':仅清除除自身版本外，相同命名空间与前置别名的缓存的
})

```

#### 设置数据

```javascript
vmoStore.setData('user', 'John Doe')
```

#### 获取数据

```javascript
const user = vmoStore.getData('user')
```

#### 清理数据

```javascript
// 按属性清空数据
vmoStore.clearData('user')

// 清理所有缓存数据
vmoStore.clear('localStorage')
```

#### 更新属性定义

```javascript
vmoStore.updateProp({
  newProp: { type: Number, default: 0, storge: 'localStorage' }
})
```

#### 获取缓存属性

```javascript
const props = vmoStore.getProps()
```

#### 获取命名空间

```javascript
const namespace = vmoStore.getNameSpace()
```

#### 获取存储容量

```javascript
const capacity = vmoStore.getCapacity()
```

### 方法详解

- constructor(config: StoreParams): 初始化 `VmoStore` 实例。config 对象用于配置命名空间、版本、加密密钥、数据属性、存储容量和缓存清理模式。

- setData(prop: string, value: any): 设置缓存数据。

- getData(prop: string): 获取缓存数据。

- clear(type?: 'localStorage' | 'sessionStorage'): 清理指定类型的存储，若不指定清理所有存储。

- clearData(prop: string | string[]): 清理指定缓存数据。

- removeProp(prop: string | string[]): 移除缓存声明和数据。

- updateProp(props: DataProps): 更新缓存属性说明。

- getCapacity(): 获取当前的存储容量使用情况和限制。

- getProps(key?: string): 获取缓存属性定义。

- getNameSpace(): 获取命名空间定义。

### 错误处理

`VmoStore` 在一些场景下可能会抛出错误，例如：存储容量超过限制，属性类型不匹配等。请确保在数据量较大时配置足够的允许存储空间。

### 注意事项

- 若使用数据加密，请确保加密密钥的长度符合要求，并注意保密。
- 当设定了存储容量限制时，数据写入可能会因为超出限制而抛出错误。
- 在使用 eval 时请确保数据来源的安全性，以免导致安全漏洞。
