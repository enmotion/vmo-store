# Playground

This example writes to real browser localStorage under `VMO-DOCS:playground:1`. Save a value, reload this page, then clear the namespace. Unrelated browser data is preserved.

<CachePlayground lang="en" />

## The configuration

```ts
const cache = new VmoStore<{ user: string }>({
  prefix: 'VMO-DOCS', namespace: 'playground', version: 1,
  dataProps: { user: { type: String, default: 'guest' } }
})
```

The component constructs its instance in `onMounted` so static generation never accesses browser storage. It explicitly refreshes Vue refs after cache operations. See [Vue and SSR](../guide/adapters#vue-and-ssr).
