# 过期与容量

## 相对期限

```ts
const dataProps = {
  short: { type: String, expireTime: 1000 },
  minute: { type: String, expireTime: '1m' },
  fractional: { type: String, expireTime: '1.5h' }
}
```

支持 `s`、`m`、`h`、`d`。数字以毫秒计并取绝对值。每次赋值重置相对期限；`0` 表示立即过期；不设置 `expireTime` 则永久有效。

只有**截止时间之前**的值才有效。到达截止时间后，读取返回默认值并删除缓存值。重新加载需要相同的过期配置，因为相对期限根据保存的写入时间和当前声明计算。

## 固定日期

使用 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm:ss`。仅日期形式遵循 JavaScript 的 UTC 日期解析；带时间形式使用本地时间。客户端应统一约定。格式无效时在属性定义阶段报错。

## 容量上限

```ts
const cache = new VmoStore({
  dataProps: { payload: { type: String } },
  capacity: { localStorage: 5000, sessionStorage: 3000 }
})
console.log(cache.getCapacity())
```

上限按命名空间内容序列化后的 UTF-8 字节数计算，包含元信息与可选混淆。它不等同于浏览器整个存储空间的配额。未设置上限返回 `'none'`，`0` 会生效。负数和非有限上限会被拒绝。

超限写入会抛错，并保留之前的持久化值和内存值。即使未达到配置上限，浏览器仍可能因实际配额不足而抛错。
