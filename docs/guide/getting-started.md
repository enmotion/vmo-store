# Getting started

## Install

```sh
npm install vmo-store
```

The library has no runtime framework dependency. Use a modern browser with Web Storage, Proxy and Blob support; custom adapters can run in other environments.

## Declare a cache

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

`storge` retains the original API spelling. Omitting it selects localStorage.

## Read after reloading

Create another instance with the **same namespace, version and property configuration**. Persistent values are restored automatically. Functions are memory-only.

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

## Next steps

Explore [configuration](./configuration), [persistence](./persistence) and the [interactive playground](../examples/). See the [migration notes](./cleanup#upgrade-compatibility) before upgrading an existing application.
