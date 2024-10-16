import type { StorageMethodProxy } from '@type'
/**
 * 默认缓存代理,可以更改此处的方法，更换自己需要的缓存器的核心, 增强此库在运用时的扩展性
 * setItem:存储数据，getItem:获取数据，removeItem: 移除数据，clear:清理数据, getKeys: 获取全部的缓存数据键名
 */
export const defaultStorageMethodProxy: StorageMethodProxy = {
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

export const defaultCookieMethodProxy: StorageMethodProxy = {
  setItem: (key, value, type) => {
    return false
  },
  getItem: (key, type) => {
    return key
  },
  removeItem: (key, type) => {
    return false
  },
  clear: type => {
    return false
  },
  getKeys: type => {
    return []
  }
}
