# 交互示例

此示例使用真实浏览器 localStorage，命名空间为 `VMO-DOCS:playground:1`。保存数据后刷新页面，再清理命名空间，可以验证持久化与清理行为。其他浏览器数据不会删除。

<CachePlayground lang="zh" />

## 示例配置

```ts
const cache = new VmoStore<{ user: string }>({
  prefix: 'VMO-DOCS', namespace: 'playground', version: 1,
  dataProps: { user: { type: String, default: 'guest' } }
})
```

组件在 `onMounted` 中创建实例，静态生成时不会访问浏览器存储。缓存操作后显式刷新 Vue ref。详见[Vue 与 SSR](../guide/adapters#vue-与-ssr)。
