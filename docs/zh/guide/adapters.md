# 自定义存储与 SSR

## 同步适配器约定

实现 `StorageMethodProxy`。所有方法必须同步完成，失败时抛出异常。`getItem` 返回字符串或 null，`getKeys` 返回键名数组。

```ts
import { VmoStore, type StorageMethodProxy } from 'vmo-store'

const stores = { localStorage: new Map<string, string>(), sessionStorage: new Map<string, string>() }
const storage: StorageMethodProxy = {
  setItem: (key, value, type = 'localStorage') => stores[type].set(key, value),
  getItem: (key, type = 'localStorage') => stores[type].get(key) ?? null,
  removeItem: (key, type = 'localStorage') => stores[type].delete(key),
  clear: type => {
    if (type) stores[type].clear()
    else { stores.localStorage.clear(); stores.sessionStorage.clear() }
  },
  getKeys: type => type ? [...stores[type].keys()] : [...new Set([...stores.localStorage.keys(), ...stores.sessionStorage.keys()])]
}
const cache = new VmoStore({ storage, dataProps: { name: { type: String } } })
```

不能直接使用异步 IndexedDB 适配器。默认适配器只有在调用方法时才访问浏览器 localStorage/sessionStorage。使用自定义适配器的环境仍需要 Blob 进行字节计算。

## Vue 与 SSR

导入库不会访问浏览器存储全局变量。默认存储实例应在客户端创建，例如使用 `onMounted`：

```vue
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { VmoStore } from 'vmo-store'

const name = ref('guest')
let cache: VmoStore<{ name: string }> | undefined
onMounted(() => {
  cache = new VmoStore({
    namespace: 'vue-example',
    dataProps: { name: { type: String, default: 'guest' } }
  })
  name.value = cache.getData('name') ?? 'guest'
})
watch(name, value => cache?.setData('name', value))
</script>

<template><input v-model="name" aria-label="Name" /></template>
```

`$store` 不是 Vue 响应式状态库，需要显式结合 ref/reactive。服务端缓存应使用请求级适配器，避免不同用户请求共享同一份数据。
