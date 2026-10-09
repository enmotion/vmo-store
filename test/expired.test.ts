import { describe, it, expect, beforeEach, afterEach, vi} from "vitest"
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it.each([
    ['name', 'mod', 'default=name=='],
    ['age', 2, 1],
    ['isMale', true, false],
    ['hobbys', [1, 2], []],
    ['props', { name: 'mod' }, {}],
  ] as const)('%s expires at the exact TTL boundary', (key, value, fallback) => {
    base.setData(key, value);
    expect(base.getData(key)).toEqual(value);
    vi.advanceTimersByTime(999);
    expect(base.getData(key)).toEqual(value);
    vi.advanceTimersByTime(1);
    expect(base.getData(key)).toEqual(fallback);
  });

  it('function expires at the exact TTL boundary', () => {
    base.setData('method', (a: number, b: number) => a + b);
    expect(base.getData('method')(1, 3)).toBe(4);
    vi.advanceTimersByTime(999);
    expect(base.getData('method')(1, 3)).toBe(4);
    vi.advanceTimersByTime(1);
    expect(base.getData('method')(1, 3)).toBe(3);
  });
});
