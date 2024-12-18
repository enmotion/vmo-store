import { describe, it, expect} from "vitest"
import { VmoStore } from '../index' // 假设你的缓存库位于 src/lib/cache.ts
const base = new VmoStore({
  cryptoKey: 'esm', // 加密密钥
  namespace: 'enmo', // 命名空间
  version: 1, // 存储版本
  prefix: 'mods', // 前置名称
  cacheInitCleanupMode: 'self', // 缓存清理模式
  // storage: {
  //   setItem: function (key, value, type) {
  //     let cache = document.cookie.split(';')
  //     console.log(cache, document.cookie, 'cache')
  //     const data: Record<string, string> = {}
  //     cache.forEach(item => {
  //       const itemData = item.split('=')
  //       data[itemData[0]] = itemData[1]
  //     })
  //     data[key] = value
  //     let cookieStr = ''
  //     Object.keys(data).forEach(key => {
  //       cookieStr = cookieStr + `${key}=${data[key]};`
  //     })
  //     console.error(cookieStr, data)
  //     document.cookie = cookieStr
  //     return true
  //   },
  //   getItem: function (key, type) {
  //     let cache = document.cookie.split(';')
  //     const data: Record<string, string> = {}
  //     cache.forEach(item => {
  //       const itemData = item.split('=')
  //       data[itemData[0]] = itemData[1]
  //     })
  //     console.error(data)
  //     return data[key]
  //   },
  //   removeItem: function (key, type) {
  //     return true
  //   },
  //   clear: function (type) {
  //     return true
  //   },
  //   getKeys: function (type) {
  //     let ca = document.cookie.split(';')
  //     return ca.map(item => item[0])
  //   }
  // },
  dataProps: {
    name: {
      type: String,
      default: 'default=name==',
      storge: 'localStorage'
    },
    age: {
      type: Number,
      default: 1,
      storge: 'localStorage'
    },
    isMale: {
      type: Boolean,
      default: false,
      storge: 'localStorage'
    },
    hobbys: {
      type: Array,
      default: () => [],
      storge: 'localStorage'
    },
    props: {
      type: Object,
      default: () => ({}),
      storge: 'localStorage'
    },
    method: {
      type: Function,
      default: () => (a: number, b: number) => a * b,
      storge: 'localStorage'
    }
    // pluss: {
    //   type: [Function], // 类型约束
    //   default: () => (a: number, b: number) => a + b, // 默认值，类 vue props
    //   // expireTime: '2s',
    //   storge: 'localStorage' // 指定存储器
    // },
    // user: {
    //   type: [Function, String],
    //   default: () => (a: number, b: number) => a + b,
    //   expireTime: '1m',
    //   storge: 'localStorage'
    // }
  }
})
describe('VmoStore Base', () => {
  it('string type should set and get a value', () => {
    base.setData('name', 'mod')
    expect(base.getData('name')).to.equal('mod')
  })
  it('number type should set and get a value', () => {
    base.setData('age', 12)
    expect(base.getData('age')).to.equal(12)
  })
  it('boolean type should set and get a value', () => {
    base.setData('isMale', true)
    expect(base.getData('isMale')).to.equal(true)
  })
  it('array type should set and get a value', () => {
    base.setData('hobbys', [1, 2, 3])
    expect(JSON.stringify(base.getData('hobbys'))).to.equal(JSON.stringify([1, 2, 3]))
  })
  it('object type should set and get a value', () => {
    base.setData('props', { name: 'mode2' })
    expect(JSON.stringify(base.getData('props'))).to.equal(JSON.stringify({ name: 'mode2' }))
  })
  it('function type should set and get a value', () => {
    base.setData('method', (a: number, b: number) => a * b - a)
    console.log(localStorage.getItem(localStorage.key(0) as string), 'ccc')
    expect(base.getData('method')(2, 3)).to.equal(4)
  })
})

describe('VmoStore defaultValue', () => {
  it('string type default should get a default=name==', () => {
    base.clearData(['name', 'age', 'isMale', 'hobbys', 'props', 'method'])
    expect(base.getData('name')).to.equal('default=name==')
  })
  it('number type default should get 1', () => {
    expect(base.getData('age')).to.equal(1)
  })
  it('boolean type default should get a false', () => {
    expect(base.getData('isMale')).to.equal(false)
  })
  it('array type should get []', () => {
    expect(JSON.stringify(base.getData('hobbys'))).to.equal(JSON.stringify([]))
  })
  it('object type should get {}', () => {
    expect(JSON.stringify(base.getData('props'))).to.equal(JSON.stringify({}))
  })
  it('function type should get 6', async () => {
    // console.log(localStorage.getItem(localStorage.key(0) as string), 'aaaaa')
    function ss() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(base.getData('method')(2, 3))
        }, 1000)
      })
    }
    const value =await ss();
    expect(value).equal(6)
  })
})
