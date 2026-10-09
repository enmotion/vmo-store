# VmoStore

A framework-independent browser cache with namespace/version isolation, expiration, defaults, runtime type checks and pluggable synchronous storage.

[中文文档](README.CN.md) · [English documentation](README.EN.md)

```ts
import { VmoStore } from 'vmo-store'

const cache = new VmoStore<{ user: string }>({
  namespace: 'myApp',
  version: 1,
  dataProps: { user: { type: String, default: 'guest', expireTime: '1d' } }
})
cache.setData('user', 'Alice')
console.log(cache.getData('user'))
```

Production library code requires **100% statements, branches, functions and lines**, enforced per file by `npm run coverage` and CI. Run `npm run build` to validate types and produce ESM/CJS bundles.

Functions are memory-only. `clear()` is namespace-scoped. Optional `cryptoKey` is reversible obfuscation, not cryptographic encryption. See the documentation for upgrade compatibility and supported values.
