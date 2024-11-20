import { describe, it, expect} from "vitest"
import { VmoStore } from '../index' // 假设你的缓存库位于 src/lib/cache.ts

const base = new VmoStore({
  cryptoKey: 'esm', // 加密密钥
  namespace: 'enmo', // 命名空间
  version: 1, // 存储版本
  prefix: 'mods', // 前置名称
  cacheInitCleanupMode: 'self', // 缓存清理模式
  dataProps: {
    name: {
      type: String,
      default: 'default=name==',
      expireTime: '1s',
      storge: 'localStorage'
    },
    age: {
      type: Number,
      default: 1,
      expireTime: '1s',
      storge: 'localStorage'
    },
    isMale: {
      type: Boolean,
      default: false,
      expireTime: '1s',
      storge: 'localStorage'
    },
    hobbys: {
      type: Array,
      default: () => [],
      expireTime: '1s',
      storge: 'localStorage'
    },
    props: {
      type: Object,
      default: () => ({}),
      expireTime: '1s',
      storge: 'localStorage'
    },
    method: {
      type: Function,
      default: () => (a: number, b: number) => a * b,
      expireTime: '1s',
      storge: 'localStorage'
    }
  }
})
describe('VmoStore data Expired test', () => {
  it('string expired test', async () => {
    base.setData('name', 'mod')
    expect(base.$store.name).toBe('mod')
    function delay(){
      return new Promise((resolve,reject)=>{
        setTimeout(() => {
          resolve(base.getData('name'))
        }, 1000)
      })
    }
    const timeoutValue = await delay();
    expect(timeoutValue).toBe('default=name==')
  })
  it('number expired test', async () => {
    base.setData('age', 2)
    expect(base.$store.age).toBe(2)
    function delay(){
      return new Promise((resolve,reject)=>{
        setTimeout(() => {
          resolve(base.getData('age'))
        }, 1000)
      })
    }
    const timeoutValue = await delay();
    expect(timeoutValue).toBe(1)
  })
  it('boolean expired test', async () => {
    base.setData('isMale', true)
    expect(base.$store.isMale).toBe(true)
    function delay(){
      return new Promise((resolve,reject)=>{
        setTimeout(() => {
          resolve(base.getData('isMale'))
        }, 1000)
      })
    }
    const timeoutValue = await delay();
    expect(timeoutValue).toBe(false)
  })
  it('array expired test', async () => {
    base.setData('hobbys',  [1, 2])
    expect(base.$store.hobbys).toEqual([1,2])
    function delay(){
      return new Promise((resolve,reject)=>{
        setTimeout(() => {
          resolve(base.getData('hobbys'))
        }, 1000)
      })
    }
    const timeoutValue = await delay();
    expect(timeoutValue).toEqual([])
  })
  it('object expired test', async () => {
    base.setData('props',  { name: 'mod' })
    expect(base.$store.props).toEqual({ name: 'mod' })
    function delay(){
      return new Promise((resolve,reject)=>{
        setTimeout(() => {
          resolve(base.getData('props'))
        }, 1000)
      })
    }
    const timeoutValue = await delay();
    expect(timeoutValue).toEqual({})
  })
  it('function expired test', async () => {
    base.setData('method',  (a: number, b: number) => a + b)
    expect(base.$store.method(1,3)).toEqual(4)
    function delay(){
      return new Promise((resolve,reject)=>{
        setTimeout(() => {
          resolve(base.getData('method')(1,3))
        }, 1000)
      })
    }
    const timeoutValue = await delay();
    expect(timeoutValue).toEqual(3)
  })
})
