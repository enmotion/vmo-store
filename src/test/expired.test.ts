import * as chai from 'chai'
import { VmoStore } from '../../index' // 假设你的缓存库位于 src/lib/cache.ts
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const expect = chai.expect

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
    const record: Record<string, any> = {}
    base.setData('name', 'mod')
    record['o'] = base.getData('name')
    await expect(
      new Promise(resolve => {
        setTimeout(() => {
          record['n'] = base.getData('name')
          resolve(JSON.stringify(record))
        }, 1000)
      })
    ).to.eventually.equal(JSON.stringify({ o: 'mod', n: 'default=name==' }))
  })
  it('number expired test', async () => {
    const record: Record<string, any> = {}
    base.setData('age', 2)
    record['o'] = base.getData('age')
    await expect(
      new Promise(resolve => {
        setTimeout(() => {
          record['n'] = base.getData('age')
          resolve(JSON.stringify(record))
        }, 1000)
      })
    ).to.eventually.equal(JSON.stringify({ o: 2, n: 1 }))
  })
  it('boolean expired test', async () => {
    const record: Record<string, any> = {}
    base.setData('isMale', true)
    record['o'] = base.getData('isMale')
    await expect(
      new Promise(resolve => {
        setTimeout(() => {
          record['n'] = base.getData('isMale')
          resolve(JSON.stringify(record))
        }, 1000)
      })
    ).to.eventually.equal(JSON.stringify({ o: true, n: false }))
  })
  it('array expired test', async () => {
    const record: Record<string, any> = {}
    base.setData('hobbys', [1, 2])
    record['o'] = base.getData('hobbys')
    await expect(
      new Promise(resolve => {
        setTimeout(() => {
          record['n'] = base.getData('hobbys')
          resolve(JSON.stringify(record))
        }, 1000)
      })
    ).to.eventually.equal(JSON.stringify({ o: [1, 2], n: [] }))
  })
  it('object expired test', async () => {
    const record: Record<string, any> = {}
    base.setData('props', { name: 'mod' })
    record['o'] = base.getData('props')
    await expect(
      new Promise(resolve => {
        setTimeout(() => {
          record['n'] = base.getData('props')
          resolve(JSON.stringify(record))
        }, 1000)
      })
    ).to.eventually.equal(JSON.stringify({ o: { name: 'mod' }, n: {} }))
  })
  it('object expired test', async () => {
    const record: Record<string, any> = {}
    base.setData('method', (a: number, b: number) => a + b)
    record['o'] = base.getData('method')(1, 3)
    await expect(
      new Promise(resolve => {
        setTimeout(() => {
          record['n'] = base.getData('method')(1, 3)
          resolve(JSON.stringify(record))
        }, 1000)
      })
    ).to.eventually.equal(JSON.stringify({ o: 4, n: 3 }))
  })
})
