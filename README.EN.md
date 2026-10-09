# VmoStore

A framework-independent synchronous browser cache with localStorage/sessionStorage, namespaces, version isolation, runtime types, defaults, expiration and capacity limits.

## Usage

```sh
npm install vmo-store
```

```ts
import { VmoStore } from 'vmo-store'

const cache = new VmoStore<{ user: string; settings: Record<string, unknown> }>({
  prefix: 'APP',
  namespace: 'myApp',
  version: 1,
  dataProps: {
    user: { type: String, default: 'guest', expireTime: '1d' },
    settings: { type: Object, default: () => ({}), storge: 'sessionStorage' }
  },
  capacity: { localStorage: 5000, sessionStorage: 3000 },
  cacheInitCleanupMode: 'self'
})

cache.setData('user', 'Alice')
console.log(cache.getData('user'))
cache.$store.user = 'Bob'
cache.clearData('user')
cache.clear('sessionStorage')
```

The existing `storge` spelling is retained for compatibility; it defaults to localStorage. Prefix defaults to `VMO-STORE`, namespace to `NORMAL`, and version to `0`. Versions must be non-negative safe integers.

## Values and expiration

- String, Number, Boolean, Array, Object, Date, Map, Set and RegExp values, including nested serializable combinations, survive reloading with their types intact.
- Functions, including async functions, are memory-only and retain their closures. Function strings from legacy caches are never evaluated. Function defaults use a factory, e.g. `default: () => () => 'default'`.
- Circular references, custom class instances, nested functions, BigInt, Symbol, undefined and non-finite numbers cannot be persisted. Top-level values must also match their declared types.
- Default factories execute on each missing-value read. Their returned objects are not automatically saved.
- Nested object/array mutations require reassignment or `setData` to persist. Only top-level assignments are intercepted. Instances and browser tabs do not synchronize automatically. Read types include `undefined`; explicit generics constrain keys and write values.
- Expiration accepts milliseconds (absolute magnitude), durations such as `1s`, `1m`, `1h`, `1d`, or `YYYY-MM-DD` / `YYYY-MM-DD HH:mm:ss`. Relative deadlines reset on assignment. Values expire at the deadline; `0` expires immediately, and omitted expiration means no deadline. Fixed dates follow JavaScript Date timezone parsing rules.

## Cleanup and errors

- `clear(type?)` removes only the current namespace and its matching in-memory values. Omit the type to process both backends.
- `clearData(key | keys[])` removes values while retaining definitions/defaults. `delete cache.$store.key` does the same.
- `removeProp(key | keys[])` removes values and definitions. Unknown keys are rejected before any mutation.
- `clearUnusedCache('self')` removes other versions of the same prefix/namespace. `'all'` removes other namespaces/versions sharing the prefix, preserving the current namespace and unrelated prefixes.
- `updateProp(props)` adds or updates definitions. Clear existing values before changing their backend. Configuration and `getProps(key?)` results are copied to prevent external mutation.
- `getCapacity()` reports the namespace payload's UTF-8 byte size and configured limit. Zero limits are enforced; missing limits return `'none'`. These limits are separate from the browser's total storage quota.
- Memory updates only after persistence succeeds. Serialization, capacity and adapter errors are propagated. Malformed fields are isolated; construction never rewrites cached payloads. Backend access failures are propagated.
- Operations commit per backend; cleanup spanning both backends is not a cross-backend transaction.

## Compatibility

New payloads contain type tags and can read ordinary values from legacy payloads. Old releases cannot read the new format; increment `version` when upgrading. Cleanup scopes and function persistence have changed as described above.

Optional `cryptoKey` provides reversible obfuscation, with Unicode key support and legacy-format reading. It is not cryptographic encryption and offers no confidentiality or integrity guarantee. `getCryptoKey()` and `getNameSpace()` expose instance configuration.

A custom synchronous `storage` adapter implements `setItem`, `getItem`, `removeItem`, `clear` and `getKeys`, and must throw on failure. Exported `defaultStorageMethodProxy` is a raw adapter: its `clear()` clears entire backends, unlike namespace-scoped `VmoStore.clear()`. The default adapter requires browser storage APIs; provide an adapter in other environments.

## Development

```sh
npm ci
npm test
npm run coverage
npm run build
npm run test:package
```

Use `npm run test:watch` for interactive testing.

Coverage includes the published entry `index.ts` and all production modules in `use.lib/**/*.ts`. Examples, the Vue demo, configuration and type declarations are outside that scope. Each production file must reach 100% statement, branch, function and line coverage; falling below any threshold fails the command. The HTML report is at `test/reports/unit/coverage/index.html`. CI checks coverage, builds the package, and verifies ESM/CJS runtime imports and strict NodeNext declarations.
