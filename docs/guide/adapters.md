# Adapters & SSR

## Synchronous adapter contract

Implement `StorageMethodProxy`. Methods must complete synchronously; throw on failure. `getItem` returns a string or null, and `getKeys` returns key names.

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

Async IndexedDB adapters cannot be used directly. The default adapter accesses browser localStorage/sessionStorage only when its methods are called. Runtimes using custom adapters still need Blob for byte accounting.

## Vue and SSR

Importing the library is safe without browser storage globals. Construct a default-storage instance on the client, for example in `onMounted`:

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

`$store` is not a Vue reactive store. Use refs/reactive state explicitly. Server-side caches should use request-scoped adapters, rather than sharing user values between requests.
