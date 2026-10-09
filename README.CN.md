# VmoStore

一个独立于框架的同步浏览器缓存工具，支持 localStorage/sessionStorage、命名空间、版本隔离、类型约束、默认值、过期时间和容量限制。

## 使用

```sh
npm install vmo-store
```

```ts
import { VmoStore } from 'vmo-store'

const cache = new VmoStore<{ user: string; settings: Record<string, unknown> }>({
  prefix: 'APP',
  namespace: 'myApp',
  version: 1,
  dataProps: {
    user: { type: String, default: 'guest', expireTime: '1d' },
    settings: { type: Object, default: () => ({}), storge: 'sessionStorage' }
  },
  capacity: { localStorage: 5000, sessionStorage: 3000 },
  cacheInitCleanupMode: 'self'
})

cache.setData('user', 'Alice')
console.log(cache.getData('user'))
cache.$store.user = 'Bob'
cache.clearData('user')
cache.clear('sessionStorage')
```

`storge` 保留已有 API 的拼写，省略时使用 localStorage。默认 prefix 为 `VMO-STORE`、namespace 为 `NORMAL`、version 为 `0`；版本必须为非负安全整数。

## 数据与过期

- 支持 String、Number、Boolean、Array、Object、Date、Map、Set、RegExp，以及这些可序列化值的嵌套组合。读取新实例会恢复复杂类型。
- Function 接受同步、异步函数，但只保存在当前实例内存中，保留闭包；不会持久化或执行旧缓存中的函数字符串。函数默认值仍以工厂形式配置，例如 `default: () => () => 'default'`。
- 拒绝循环引用、自定义类实例、嵌套函数、BigInt、Symbol、undefined 和非有限数值。顶层值还必须符合声明的类型。
- 默认值工厂会在每次缺少缓存值时执行。返回的对象不会自动成为已保存数据。
- 修改嵌套对象或数组后，需要重新赋值或调用 `setData` 才会持久化；代理只拦截顶层赋值。多个实例或浏览器标签页不自动同步。读取类型包含 `undefined`，使用显式泛型约束键名和赋值类型。
- 过期时间支持毫秒数（取绝对值）、`1s`/`1m`/`1h`/`1d`，以及 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm:ss`。写入会重置相对期限；到达截止时间即过期，`0` 表示立即过期，不设置表示永久。日期形式遵循 JavaScript Date 的时区解析规则。

## 清理与异常

- `clear(type?)`：仅移除当前命名空间在指定存储中的缓存，并清理对应内存；省略时处理两种存储。
- `clearData(key | keys[])`：删除值，保留声明与默认值。`delete cache.$store.key` 有相同行为。
- `removeProp(key | keys[])`：删除值与声明。未知键会在任何修改前报错。
- `clearUnusedCache('self')`：清理同 prefix、namespace 的其他版本；`'all'`：清理同 prefix 下其他命名空间/版本，保留当前命名空间和其他 prefix 的数据。
- `updateProp(props)`：新增或更新声明。有缓存值时，必须先 `clearData` 才能更换存储后端。配置与 `getProps(key?)` 返回的声明均会复制，避免外部修改污染内部配置。
- `getCapacity()`：报告当前命名空间序列化内容的 UTF-8 字节数和限额。限额 `0` 生效；未设限额返回 `'none'`。该限额不代表浏览器整个存储空间的实际配额。
- 写入成功后才更新内存；序列化、容量或底层写入失败会抛错。损坏的缓存字段会被隔离，构造实例不会重写缓存；底层访问失败会抛错。
- 操作按存储后端提交；涉及两种存储的清理不提供跨后端事务保证。

## 兼容性

新缓存包含类型标记，支持读取旧格式中的普通数据。旧版本无法读取新格式；升级时建议增加 `version`。清理范围与函数持久化行为的变化见上文。

`cryptoKey` 保留为可选的可逆混淆功能，支持 Unicode 密钥并读取旧混淆格式。它不是密码学加密，不提供机密性或完整性保证。实例可通过 `getCryptoKey()`、`getNameSpace()` 查看配置。

可以通过 `storage` 替换同步存储适配器：实现 `setItem`、`getItem`、`removeItem`、`clear`、`getKeys`，失败时应抛出异常。默认导出的 `defaultStorageMethodProxy` 是原始适配器，它的 `clear()` 会清空整个后端，与 `VmoStore.clear()` 的命名空间清理不同。默认适配器需要浏览器存储 API；其他环境需提供适配器。

## 开发与验证

```sh
npm ci
npm test
npm run coverage
npm run build
npm run test:package
npm run docs:build
npm run test:e2e
```

`npm run test:watch` 用于交互式测试。

覆盖范围是发布库入口 `index.ts` 与全部 `use.lib/**/*.ts` 生产代码，不包含示例、Vue 演示页面、配置和类型声明。语句、分支、函数、行覆盖率要求每个文件均达到 100%，不足会退出失败。HTML 报告位于 `test/reports/unit/coverage/index.html`。CI 执行覆盖率、构建和发布包验证。发布包验证会检查 ESM/CJS 运行时导入和严格 NodeNext 类型声明。

## 在线文档与浏览器实测

[中文文档](https://enmotion.github.io/vmo-store/zh/) · [English](https://enmotion.github.io/vmo-store/)

安装浏览器后运行 `npm run verify`：`npx playwright install chromium firefox webkit`。真实 Chromium、Firefox、WebKit 与两种移动视口测试使用构建产物；移动项目属于设备模拟，不是实体手机实测。`npm run docs:dev` 启动 VitePress 文档。`master` 推送通过验证后自动部署 GitHub Pages。
