# VmoStore

A framework-independent browser cache with namespace/version isolation, expiration, defaults, runtime type checks and pluggable synchronous storage.

[在线文档 / Documentation](https://enmotion.github.io/vmo-store/) · [中文](https://enmotion.github.io/vmo-store/zh/)

[中文仓库说明](README.CN.md) · [English repository guide](README.EN.md)

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

## Documentation and browser tests

```sh
npm ci
npx playwright install chromium firefox webkit
npm run verify
npm run docs:dev
```

VitePress provides English/Chinese guides, full API documentation, local search and a real-storage playground. Trusted pushes to `master` deploy to GitHub Pages after coverage, builds and cross-browser checks pass.
