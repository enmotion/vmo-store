# 配置与类型

## 实例配置

| 选项 | 默认值 | 行为 |
| --- | --- | --- |
| `dataProps` | 必填 | 声明类型、默认值、过期时间及存储后端 |
| `prefix` | `VMO-STORE` | 广泛清理操作的所属范围 |
| `namespace` | `NORMAL` | 逻辑缓存名称 |
| `version` | `0` | 非负安全整数，或对应数字字符串 |
| `capacity` | 不设限 | 两种存储各自的命名空间内容字节上限 |
| `storage` | 浏览器适配器 | 自定义同步存储方法 |
| `cryptoKey` | 不启用 | 可逆混淆，**不是密码学加密** |
| `cacheInitCleanupMode` | 不启用 | 初始化清理旧缓存：`self` 或 `all` |

存储键为 `prefix:namespace:version`。创建实例只读取缓存，不重写数据；只有显式配置的初始化清理模式才会删除旧键。

## 属性配置

```ts
const dataProps = {
  status: { type: [String, Number], default: 'pending' },
  items: { type: Array, default: () => [], expireTime: '10m' },
  task: { type: Function, default: () => async () => 'ready' }
}
```

| 选项 | 行为 |
| --- | --- |
| `type` | 支持的构造函数或构造函数数组，赋值时检查 |
| `default` | 字符串、数字、布尔值或返回默认值的工厂 |
| `storge` | 默认为 `localStorage`，也可选 `sessionStorage` |
| `expireTime` | 不设置即永久；详见[过期与容量](./expiration) |

每次缺少缓存值时都会执行默认值工厂。工厂返回的对象不会自动保存，需要先显式赋值，再进行修改。

## TypeScript 保证

```ts
const cache = new VmoStore<{ name: string }>({
  dataProps: { name: { type: String } }
})
const name: string | undefined = cache.getData('name')
cache.setData('name', 'Alice')
// cache.setData('name', 123)      // TypeScript 错误
// cache.setData('missing', 'x')   // TypeScript 错误
```

缺少数据时读取结果和 `$store` 属性可能为 `undefined`。显式泛型约束键名与赋值类型；运行时 `dataProps` 需要与泛型保持一致，类型不会自动从构造函数推导。

## 更新声明

`updateProp()` 可新增或更新声明。更换存储后端前必须清除已有缓存值。修改声明类型后，不兼容的值会在后续读取时回退。配置对象与 `getProps()` 返回值均经过复制，多类型数组也会复制。
