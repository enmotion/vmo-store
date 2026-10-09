# Configuration & types

## Instance options

| Option | Default | Behavior |
| --- | --- | --- |
| `dataProps` | Required | Declares property types, defaults, expiration and storage |
| `prefix` | `VMO-STORE` | Ownership boundary for broad cleanup |
| `namespace` | `NORMAL` | Logical cache name |
| `version` | `0` | Non-negative safe integer, or its numeric string |
| `capacity` | No limits | Per-namespace byte limits for each backend |
| `storage` | Browser adapter | Custom synchronous storage methods |
| `cryptoKey` | Disabled | Reversible obfuscation; **not encryption** |
| `cacheInitCleanupMode` | Disabled | Optional old-cache cleanup: `self` or `all` |

The storage key is `prefix:namespace:version`. Construction reads caches without rewriting them. Only an explicitly configured cleanup mode removes older keys.

## Property options

```ts
const dataProps = {
  status: { type: [String, Number], default: 'pending' },
  items: { type: Array, default: () => [], expireTime: '10m' },
  task: { type: Function, default: () => async () => 'ready' }
}
```

| Option | Behavior |
| --- | --- |
| `type` | A supported constructor or array of constructors; checked on assignment |
| `default` | String, number, boolean, or a factory returning a value |
| `storge` | `localStorage` by default, or `sessionStorage` |
| `expireTime` | Omitted means no expiration; see [expiration](./expiration) |

Default factories execute on each missing-value read. Returning an object does not save it automatically. Assign it explicitly before mutating it.

## TypeScript guarantees

```ts
const cache = new VmoStore<{ name: string }>({
  dataProps: { name: { type: String } }
})
const name: string | undefined = cache.getData('name')
cache.setData('name', 'Alice')
// cache.setData('name', 123)      // TypeScript error
// cache.setData('missing', 'x')   // TypeScript error
```

Reads and `$store` properties can be `undefined` when absent. Explicit generics constrain keys and assigned values; keep runtime `dataProps` consistent with that generic. It is not automatically inferred from the constructors.

## Update definitions

`updateProp()` adds or changes definitions. Clear an existing value before moving it to another backend. Changing a type causes incompatible values to fall back on a subsequent read. Configuration objects and `getProps()` results are copied, including union type arrays.
