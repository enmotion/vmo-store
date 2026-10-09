# 清理与版本迁移

## 清理数据

```ts
cache.clearData('user')             // 保留声明与默认值
cache.clearData(['user', 'count'])
cache.removeProp('user')            // 同时移除声明
cache.clear('localStorage')         // 当前命名空间，仅 localStorage
cache.clear()                      // 当前命名空间，两种存储
```

`delete cache.$store.user` 与 `clearData('user')` 行为一致。未知清理键会在任何修改前被拒绝。底层异常会抛出；涉及两种存储的清理按后端提交，不提供跨后端事务保证。

## 清理旧命名空间

| 模式 | 范围 |
| --- | --- |
| `self` | 相同 prefix、namespace 的其他数字版本 |
| `all` | 相同 prefix 下的其他命名空间或数字版本 |

两种模式都保留当前命名空间。其他 prefix 和不带数字版本的无关键不会删除。prefix、namespace 中的正则特殊字符按普通字符处理。

```ts
cache.clearUnusedCache('self')
// 也可在初始化时配置 cacheInitCleanupMode: 'self'。
```

::: warning 原始适配器的清理
`defaultStorageMethodProxy.clear()` 属于原始后端操作，会清空所选后端，与 `VmoStore.clear()` 的命名空间清理不同。
:::

## 升级兼容性

修复后的实现改变了以下行为：

1. `clear()` 只清理当前命名空间及对应内存。
2. 函数只保存在内存中；旧缓存中的可执行字符串会丢弃。
3. 持久化内容增加类型标记。可以读取旧格式的普通值，但旧版本无法读取新内容。
4. 不传版本默认为 `0`；无效版本会抛错，不再生成 `NaN` 命名空间。
5. 读取类型包含 `undefined`，ESM/CJS 具有独立的 NodeNext 声明。

升级部署建议增加 `version`，需要移除旧版本时选择 `self` 清理。不会自动迁移不同版本间的数据。
