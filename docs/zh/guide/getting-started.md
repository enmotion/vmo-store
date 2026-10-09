# 快速开始

## 安装

```sh
npm install vmo-store
```

运行时不依赖 Vue 等框架。默认适配器需要支持 Web Storage、Proxy、Blob 的现代浏览器；其他环境可以使用自定义同步适配器。

## 声明缓存

```ts
import { VmoStore } from 'vmo-store'

const cache = new VmoStore<{ user: string; settings: Record<string, unknown> }>({
  prefix: 'APP',
  namespace: 'account',
  version: 1,
  dataProps: {
    user: { type: String, default: 'guest', expireTime: '1d' },
    settings: { type: Object, default: () => ({}), storge: 'sessionStorage' }
  }
})

cache.setData('user', 'Alice')
console.log(cache.getData('user')) // Alice
cache.$store.user = 'Bob'
cache.clearData('user')
console.log(cache.getData('user')) // guest
```

`storge` 保留已有 API 的拼写，省略时默认使用 localStorage。

## 刷新后读取

使用**相同的命名空间、版本及属性配置**创建实例，即可恢复持久化数据。函数只保存在当前实例的内存中。

```ts
const config = {
  namespace: 'example',
  dataProps: { count: { type: Number, default: 0 } }
}
const first = new VmoStore<{ count: number }>(config)
first.setData('count', 42)
const reloaded = new VmoStore<{ count: number }>(config)
console.log(reloaded.getData('count')) // 42
```

## 下一步

继续阅读[配置](./configuration)、[持久化](./persistence)或体验[交互示例](../examples/)。已有项目升级前请查看[迁移说明](./cleanup#升级兼容性)。
