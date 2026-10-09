import type { StorageMethodProxy } from '../types/index.js'

type StorageType = 'localStorage' | 'sessionStorage'
const getStorage = (type: StorageType = 'localStorage') => type === 'localStorage' ? localStorage : sessionStorage

/** Raw storage adapter. Unlike VmoStore.clear(), clear() clears the whole backend. */
export const defaultStorageMethodProxy: StorageMethodProxy = {
  setItem: (key, value, type) => getStorage(type).setItem(key, value),
  getItem: (key, type) => getStorage(type).getItem(key),
  removeItem: (key, type) => getStorage(type).removeItem(key),
  clear: type => {
    if (type) getStorage(type).clear()
    else {
      localStorage.clear()
      sessionStorage.clear()
    }
  },
  getKeys: type => {
    const stores = type ? [getStorage(type)] : [localStorage, sessionStorage]
    const keys: string[] = []
    for (const storage of stores) {
      for (let i = 0; i < storage.length; i++) keys.push(storage.key(i) as string)
    }
    return Array.from(new Set(keys))
  }
}
