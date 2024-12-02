# VmoStore
`forcha`
`VmoStore` is a local cache management class designed for convenient data management, storage, and retrieval in a browser environment. It is engineered to include version control, namespace isolation, and configurable storage capacity limits, making it suitable for various caching scenarios.

## Features

- Supports caching of multiple data types.
- Configurable data structure specifications and expiration times.
- Storage namespaces and version management.
- Optional data encryption support.
- Capacity-limited storage management and cache cleaning.

## Installation

```javascript
npm i vmo-store
```

## Usage Instructions

#### Create Instance

```javascript
const vmoStore = new VmoStore({
  namespace: 'myApp', // Namespace
  prefix: 'APP', // Prefix alias
  version: 1, // Version
  cryptoKey: 'yourCryptoKeyHere', // Encryption key. If empty, cache encryption will not be enabled
  dataProps: {
    user: {
      type: String, // Data type supports multiple types [String, Array, Number]
      storge: 'localStorage', // Specify localStorage
      default: '111', // Default value
      expireTime: '1d' // Expiration time of 1 day,
      /**
       * Expiration time can be set in 3 ways:
       * 1. Numeric value: In milliseconds added from the time of writing or updating + expireTime
       * 2. Character type: s for seconds, m for minutes, h for hours, d for days; converted to milliseconds before adding from the time of writing or updating + expireTime
       * 3. Fixed date format "YYYY-MM-DD HH:mm:ss" for fixed expiration
       */
    },
    settings: {
      type: [Object, Array], // Data type
      default: () => ({}), // For reference types, use a function form to return the default value
      storge: 'sessionStorage' // Specify sessionStorage as the cache
    }
  }, // Store data declaration
  capacity: {
    localStorage: 5000, // LocalStorage limit
    sessionStorage: 3000 // SessionStorage limit
  },
  cacheInitCleanupMode: 'self' // Cache cleanup mode on initialization, options are 'all': clear all except self or 'self': clear only caches with the same namespace and prefix alias except for different versions
})
```

#### Set Data

```javascript
vmoStore.setData('user', 'John Doe')
```

#### Get Data

```javascript
const user = vmoStore.getData('user')
```

#### Clear Data

```javascript
// Clear data by property
vmoStore.clearData('user')

// Clear all cache data
vmoStore.clear('localStorage')
```

#### Update Property Definition

```javascript
vmoStore.updateProp({
  newProp: { type: Number, default: 0, storge: 'localStorage' }
})
```

#### Get Cache Properties

```javascript
const props = vmoStore.getProps()
```

#### Get Namespace

```javascript
const namespace = vmoStore.getNameSpace()
```

#### Storage Capacity

```javascript
const capacity = vmoStore.getCapacity()
```

### Method Details

- constructor(config: StoreParams): Initializes a `VmoStore` instance. The config object is used to configure namespace, version, encryption key, data properties, storage capacities, and cache cleaning mode.

- setData(prop: string, value: any): Sets cache data.

- getData(prop: string): Retrieves cache data.

- clear(type?: ‘localStorage’ | ‘sessionStorage’): Clears the specified type of storage; if unspecified, clears all storage.

- clearData(prop: string | string[]): Clears specified cache data.

- removeProp(prop: string | string[]): Removes cache declaration and data.

- updateProp(props: DataProps): Updates cache property definitions.

- getCapacity(): Gets current storage capacity usage and limits.

- getProps(key?: string): Retrieves cache property definitions.

- getNameSpace(): Retrieves namespace definition.

### Error Handling

`VmoStore` may throw errors in certain scenarios, such as when storage capacity is exceeded or property types mismatch. Ensure sufficient storage space is configured for large data volumes.

### Notes

- If using data encryption, ensure the encryption key length is adequate and keep it secure.
- When storage capacity limits are set, data writing might fail due to exceeding limits.
- Ensure data source security when using eval to avoid security vulnerabilities.
