# 持久化与数据类型

## 支持的数据

String、有限 Number、Boolean、Array、普通 Object、Date、Map、Set、RegExp 使用显式类型标记序列化。支持嵌套组合，以及对象、数组中的 null。

```ts
const cache = new VmoStore<{ value: Map<string, Date> }>({
  dataProps: { value: { type: Map } }
})
cache.setData('value', new Map([['created', new Date()]]))
```

新实例会恢复 Map 及其中的 Date。RegExp 保留表达式和 flags，但不保留 `lastIndex` 等临时执行状态。

## 函数与不支持的数据

函数**仅保存在内存中**。同步、异步函数都能在当前实例中保留闭包。刷新后返回函数默认值；没有默认值则返回 `undefined`。旧缓存中的函数字符串不会被执行。

拒绝循环引用、嵌套函数、undefined、BigInt、Symbol、非有限数字、无效日期以及自定义类实例。序列化失败会保留之前的值。

## 嵌套修改

代理只拦截顶层赋值，不跟踪深层修改：

```ts
const settings = cache.getData('settings')
if (settings) {
  settings.theme = 'dark'
  cache.setData('settings', settings)
}
```

需要独立更新时，先复制再修改。原地修改会立即影响内存中的同一个对象；之后重新赋值失败，无法撤销之前的原地修改。

## 异常行为

每次赋值都会同步序列化并写入所选存储后端的整个命名空间内容，写入成功后才更新内存。配额及存储访问异常会抛出。读取时隔离损坏内容和字段，保留其他有效数据，构造实例不会重写存储。

多个实例或标签页各自持有独立内存快照。外部修改后可以重新创建实例读取；不提供自动 `storage` 事件同步。

## 数据混淆

`cryptoKey` 可选启用可逆 XOR 混淆，支持 Unicode 密钥并能读取旧混淆格式。它不提供密码学机密性、完整性或身份验证，浏览器缓存不应作为安全凭证存储。
