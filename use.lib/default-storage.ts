import type { StorageProxyMethods } from '@type'
/**
 * 默认缓存代理,可以更改此处的方法，更换自己需要的缓存器
 *
 */
export const defaultStorageMethodProxy: StorageProxyMethods = {
  setItem: (key, value, type) => {
    const storage = type == 'localStorage' ? localStorage : sessionStorage
    return storage.setItem(key, value)
  },
  getItem: (key, type) => {
    const storage = type == 'localStorage' ? localStorage : sessionStorage
    return storage.getItem(key)
  },
  removeItem: (key, type) => {
    const storage = type == 'localStorage' ? localStorage : sessionStorage
    return storage.removeItem(key)
  },
  clear: type => {
    if (!!type) {
      const storage = type == 'localStorage' ? localStorage : sessionStorage
      return storage.clear()
    } else {
      localStorage.clear()
      sessionStorage.clear()
    }
  },
  getKeys: (type?: 'sessionStorage' | 'localStorage') => {
    if (!!type) {
      const storage = type == 'localStorage' ? localStorage : sessionStorage
      const length: number = storage.length
      const keys: string[] = []
      for (let i = 0; i < length; i++) {
        keys[i] = storage[i]
      }
      return keys
    } else {
      const keys: string[] = []
      const localLength = localStorage.length
      const sessionLength = sessionStorage.length
      for (let l = 0; l < localLength; l++) {
        keys.push(localStorage.key(l) as string)
      }
      for (let s = 0; s < sessionLength; s++) {
        keys.push(sessionStorage.key(s) as string)
      }
      return Array.from(new Set(keys))
    }
  }
}
