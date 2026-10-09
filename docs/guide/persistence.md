# Persistence & values

## Supported values

String, finite Number, Boolean, Array, plain Object, Date, Map, Set and RegExp values are serialized with explicit type tags. Nested combinations are supported, including null values inside objects and arrays.

```ts
const cache = new VmoStore<{ value: Map<string, Date> }>({
  dataProps: { value: { type: Map } }
})
cache.setData('value', new Map([['created', new Date()]]))
```

A new instance restores the Map and its Date entry. RegExp patterns and flags are preserved, but transient execution state such as `lastIndex` is not.

## Functions and unsupported values

Functions are **memory-only**. Both sync and async functions retain their closures in the current instance. After reloading, a function default is returned, or `undefined` if none is configured. Legacy function strings are never evaluated.

Circular structures, nested functions, undefined, BigInt, Symbol, non-finite numbers, invalid dates and custom class instances cannot be persisted. Serialization failures leave the previous value intact.

## Nested edits

The proxy observes top-level assignments, not deep edits:

```ts
const settings = cache.getData('settings')
if (settings) {
  settings.theme = 'dark'
  cache.setData('settings', settings)
}
```

For an independent update, clone the value before editing it. In-place edits affect the object already in memory; a later failed reassignment cannot undo those earlier edits.

## Failure behavior

Each assignment serializes and writes the selected backend's whole namespace payload synchronously. Memory changes only after the write succeeds. Quota and storage-access errors are thrown. Malformed payloads or fields are isolated during load, without discarding other valid fields or rewriting storage during construction.

Instances and tabs maintain independent in-memory snapshots. Recreate an instance to read externally updated storage; automatic `storage` event synchronization is not provided.

## Obfuscation

`cryptoKey` optionally obfuscates the payload using a reversible XOR format. Unicode keys are supported, and old obfuscation formats are readable. This offers no cryptographic confidentiality, integrity or authentication. Do not treat browser cache as a secure credential store.
