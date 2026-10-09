# Expiration & capacity

## Relative deadlines

```ts
const dataProps = {
  short: { type: String, expireTime: 1000 },
  minute: { type: String, expireTime: '1m' },
  fractional: { type: String, expireTime: '1.5h' }
}
```

Supported suffixes are `s`, `m`, `h` and `d`. Numeric durations use milliseconds and their absolute magnitude. Every assignment resets the relative deadline. `0` expires immediately; omitting `expireTime` never expires.

A value is valid strictly **before** its deadline. At the deadline, reads return the configured default and remove the cached value. Reloading requires the same expiration configuration because relative deadlines are calculated from the saved write timestamp and current definition.

## Fixed dates

Use `YYYY-MM-DD` or `YYYY-MM-DD HH:mm:ss`. Date-only strings use JavaScript's UTC date parsing; date-time strings use local time. Specify one convention consistently across clients. Invalid formats throw when defining properties.

## Capacity limits

```ts
const cache = new VmoStore({
  dataProps: { payload: { type: String } },
  capacity: { localStorage: 5000, sessionStorage: 3000 }
})
console.log(cache.getCapacity())
```

Limits measure the serialized namespace payload's UTF-8 bytes, including metadata and optional obfuscation. They do not represent the browser's total quota. Unconfigured limits return `'none'`; zero is a real limit. Negative or non-finite limits are rejected.

If a write exceeds the limit, it throws and keeps the previously saved and in-memory values. The actual browser can also throw a quota error even when this configured limit has not been reached.
