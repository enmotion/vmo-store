# Cleanup & migration

## Clear values

```ts
cache.clearData('user')             // Keep definition and default
cache.clearData(['user', 'count'])
cache.removeProp('user')            // Remove definition too
cache.clear('localStorage')         // Current namespace, localStorage only
cache.clear()                      // Current namespace, both backends
```

`delete cache.$store.user` behaves like `clearData('user')`. Unknown clear/remove keys are rejected before any mutation. Storage failures are propagated; multi-backend cleanup commits per backend and is not a cross-backend transaction.

## Remove obsolete namespaces

| Mode | Scope |
| --- | --- |
| `self` | Same prefix and namespace, other numeric versions |
| `all` | Same prefix, other namespaces or numeric versions |

Both modes preserve the current namespace. Other prefixes and non-versioned unrelated keys are preserved. Regex characters in prefixes/namespaces are treated as ordinary characters.

```ts
cache.clearUnusedCache('self')
// Or configure cacheInitCleanupMode: 'self' at initialization.
```

::: warning Raw adapter cleanup
`defaultStorageMethodProxy.clear()` is a raw backend operation and clears the entire selected backend. This differs from namespace-scoped `VmoStore.clear()`.
:::

## Upgrade compatibility

The repaired implementation changes several behaviors:

1. `clear()` now clears only the current namespace and corresponding memory.
2. Functions are memory-only; legacy executable strings are discarded.
3. Persisted values use type tags. Ordinary legacy values can be read, but old releases cannot read new payloads.
4. Missing versions default to `0`; malformed versions throw instead of creating `NaN` namespaces.
5. Read types include `undefined`, and ESM/CJS have separate NodeNext declarations.

Increment `version` when deploying an upgrade, and use `self` cleanup when older versions should be removed. No automatic data migration between versions is performed.
