# API reference

## VmoStore

`new VmoStore<T>(config: StoreParams)` creates an instance. `T` defaults to `Record<string, any>`. See [configuration](../guide/configuration) for instance/property options.

| Member | Signature / result | Behavior |
| --- | --- | --- |
| `$store` | `Partial<T>` | Top-level assignment proxy; declared property reads may be absent |
| `getData` | `(key: K): T[K] \| undefined` | Read a value, or its default |
| `setData` | `(key: K, value: T[K]): T[K]` | Validate, persist, then update memory; return assigned value |
| `clearData` | `(key: string \| string[]): void` | Remove values, keep declarations |
| `removeProp` | `(key: string \| string[]): void` | Remove values and declarations |
| `clear` | `(type?: 'localStorage' \| 'sessionStorage'): void` | Clear the current namespace and memory |
| `clearUnusedCache` | `(mode: 'all' \| 'self'): void` | Remove obsolete owned keys |
| `updateProp` | `(props: DataProps): void` | Add/update definitions |
| `getProps` | `(key?: string)` | Copy of one definition, or all definitions; unknown keys return undefined |
| `getCapacity` | `(): { localStorage, sessionStorage }` | Each result contains `used` and `limit` |
| `getNameSpace` | `(): string` | `prefix:namespace:version` |
| `getCryptoKey` | `(): string \| undefined` | Configured obfuscation key |

`K` is a key of `T`. Unknown reads return undefined. Undeclared writes and unknown clear/remove keys throw. `Object.defineProperty` on `$store` is rejected; use assignment or `setData` instead.

## Exported types

| Type | Purpose |
| --- | --- |
| `BasicType` | Supported runtime constructors |
| `DataProps` | Property definition map |
| `StoreParams` | Instance configuration |
| `CacheData<T>` | Internal entry map containing a value and write timestamp |
| `Capacity` | Optional localStorage/sessionStorage limits |
| `StorageMethodProxy` | Synchronous storage adapter contract |

## defaultStorageMethodProxy

Methods: `setItem`, `getItem`, `removeItem`, `clear`, `getKeys`. Omitting the backend in item methods defaults to localStorage; omitting it for `clear`/`getKeys` processes both backends. `getKeys()` removes duplicate keys.

Its `clear()` clears whole backends. Prefer instance `clear()` for namespace-scoped cleanup.

## Errors

Type mismatch, unknown writes/removals, invalid version/capacity/expiration, unsupported serialization, capacity overflow and adapter failures throw. Catch them at the application boundary. Cache parse/decoding failures are isolated during loading instead of discarding unrelated valid fields.
