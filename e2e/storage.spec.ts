import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/test/')
  await expect(page.locator('#ready')).toHaveText('Ready')
})

test('local and session values survive real page reloads', async ({ page }) => {
  await page.evaluate(() => {
    const store = new (window as any).VmoStore({ dataProps: { name: { type: String }, count: { type: Number, storge: 'sessionStorage' } } })
    store.setData('name', 'Alice'); store.setData('count', 42)
  })
  await page.reload(); await expect(page.locator('#ready')).toHaveText('Ready')
  expect(await page.evaluate(() => {
    const store = new (window as any).VmoStore({ dataProps: { name: { type: String }, count: { type: Number, storge: 'sessionStorage' } } })
    return [store.getData('name'), store.getData('count')]
  })).toEqual(['Alice', 42])
})

test('localStorage shares across tabs while sessionStorage and separate contexts stay isolated', async ({ page, context, browser }) => {
  await page.evaluate(() => {
    const store = new (window as any).VmoStore({ dataProps: { local: { type: String }, session: { type: String, storge: 'sessionStorage' } } })
    store.setData('local', 'shared'); store.setData('session', 'private')
  })
  const tab = await context.newPage(); await tab.goto('/test/'); await expect(tab.locator('#ready')).toHaveText('Ready')
  expect(await tab.evaluate(() => {
    const store = new (window as any).VmoStore({ dataProps: { local: { type: String }, session: { type: String, storge: 'sessionStorage' } } })
    return [store.getData('local'), store.getData('session')]
  })).toEqual(['shared', undefined])
  const isolated = await browser.newContext()
  const other = await isolated.newPage(); await other.goto('http://127.0.0.1:4173/test/'); await expect(other.locator('#ready')).toHaveText('Ready')
  expect(await other.evaluate(() => localStorage.length)).toBe(0)
  await isolated.close()
})

test('instance snapshots require explicit reconstruction after another tab writes', async ({ page, context }) => {
  await page.evaluate(() => {
    (window as any).cache = new (window as any).VmoStore({ dataProps: { name: { type: String, default: 'guest' } } })
    ;(window as any).cache.setData('name', 'first')
  })
  const tab = await context.newPage(); await tab.goto('/test/'); await expect(tab.locator('#ready')).toHaveText('Ready')
  await tab.evaluate(() => new (window as any).VmoStore({ dataProps: { name: { type: String } } }).setData('name', 'second'))
  expect(await page.evaluate(() => (window as any).cache.getData('name'))).toBe('first')
  expect(await page.evaluate(() => new (window as any).VmoStore({ dataProps: { name: { type: String } } }).getData('name'))).toBe('second')
})

test('Date, Map, Set, RegExp and nested values reload with their runtime types', async ({ page }) => {
  await page.evaluate(() => {
    const store = new (window as any).VmoStore({ dataProps: { value: { type: Object } } })
    store.setData('value', { date: new Date('2024-01-01'), map: new Map([['set', new Set([1, 2])]]), re: /hello/giu, list: [null, true, '中文😀'] })
  })
  await page.reload(); await expect(page.locator('#ready')).toHaveText('Ready')
  expect(await page.evaluate(() => {
    const value = new (window as any).VmoStore({ dataProps: { value: { type: Object } } }).getData('value')
    return { date: value.date instanceof Date && value.date.toISOString(), map: value.map instanceof Map, set: value.map.get('set') instanceof Set && [...value.map.get('set')], re: value.re instanceof RegExp && value.re.flags, list: value.list }
  })).toEqual({ date: '2024-01-01T00:00:00.000Z', map: true, set: [1, 2], re: 'giu', list: [null, true, '中文😀'] })
})

test('real elapsed time expires values across a reload', async ({ page }) => {
  await page.evaluate(() => new (window as any).VmoStore({ dataProps: { name: { type: String, default: 'expired', expireTime: 100 } } }).setData('name', 'short'))
  await page.waitForTimeout(150)
  await page.reload(); await expect(page.locator('#ready')).toHaveText('Ready')
  expect(await page.evaluate(() => new (window as any).VmoStore({ dataProps: { name: { type: String, default: 'expired', expireTime: 100 } } }).getData('name'))).toBe('expired')
})

test('fixed dates and zero duration expire at the boundary', async ({ page }) => {
  expect(await page.evaluate(() => {
    const store = new (window as any).VmoStore({ dataProps: { past: { type: String, default: 'expired', expireTime: '2000-01-01' }, zero: { type: Number, default: 0, expireTime: 0 } } })
    store.setData('past', 'old'); store.setData('zero', 42)
    return [store.getData('past'), store.getData('zero')]
  })).toEqual(['expired', 0])
})

test('capacity failures preserve saved and in-memory values', async ({ page }) => {
  expect(await page.evaluate(() => {
    const config = { capacity: { localStorage: 180 }, dataProps: { name: { type: String } } }
    const store = new (window as any).VmoStore(config); store.setData('name', 'old')
    let error = ''
    try { store.setData('name', 'x'.repeat(500)) } catch (cause) { error = String(cause) }
    return [error.includes('overflows'), store.getData('name'), new (window as any).VmoStore(config).getData('name')]
  })).toEqual([true, 'old', 'old'])
})

test('browser quota errors do not update memory', async ({ page }) => {
  expect(await page.evaluate(() => {
    const config = { dataProps: { name: { type: String } } }
    const store = new (window as any).VmoStore(config); store.setData('name', 'old')
    let failed = false
    try { store.setData('name', 'x'.repeat(12 * 1024 * 1024)) } catch (cause) { failed = cause instanceof DOMException && cause.name === 'QuotaExceededError' }
    return [failed, store.getData('name'), new (window as any).VmoStore(config).getData('name')]
  })).toEqual([true, 'old', 'old'])
})

test('clear only removes the namespace and does not resurrect old memory', async ({ page }) => {
  expect(await page.evaluate(() => {
    localStorage.setItem('foreign', 'keep'); sessionStorage.setItem('foreign', 'keep')
    const config = { dataProps: { name: { type: String, default: 'guest' }, session: { type: Number, storge: 'sessionStorage', default: 0 } } }
    const store = new (window as any).VmoStore(config); store.setData('name', 'old'); store.setData('session', 1)
    store.clear('localStorage')
    const afterLocal = [store.getData('name'), store.getData('session')]
    store.clear()
    return [afterLocal, store.getData('session'), localStorage.getItem('foreign'), sessionStorage.getItem('foreign')]
  })).toEqual([['guest', 1], 0, 'keep', 'keep'])
})

test('version cleanup treats regex characters literally and preserves foreign prefixes', async ({ page }) => {
  expect(await page.evaluate(() => {
    for (const key of ['A.+:B[*]:0', 'A.+:B[*]:1', 'A.+:other:0', 'Ax:B[*]:0', 'foreign']) localStorage.setItem(key, 'keep')
    const store = new (window as any).VmoStore({ prefix: 'A.+', namespace: 'B[*]', version: 1, dataProps: {} })
    store.clearUnusedCache('self')
    const self = [localStorage.getItem('A.+:B[*]:0'), localStorage.getItem('A.+:other:0')]
    store.clearUnusedCache('all')
    return [self, localStorage.getItem('A.+:B[*]:1'), localStorage.getItem('A.+:other:0'), localStorage.getItem('Ax:B[*]:0'), localStorage.getItem('foreign')]
  })).toEqual([[null, 'keep'], 'keep', null, 'keep', 'keep'])
})

test('malformed fields and backend payloads do not erase valid saved data', async ({ page }) => {
  expect(await page.evaluate(() => {
    const key = 'VMO-STORE:NORMAL:0'
    localStorage.setItem(key, JSON.stringify({ name: { v: 'saved', t: Date.now() }, broken: { format: 1, t: Date.now(), v: { type: 'unknown' } } }))
    sessionStorage.setItem(key, 'invalid')
    const before = localStorage.getItem(key)
    const store = new (window as any).VmoStore({ dataProps: { name: { type: String }, broken: { type: Object, default: () => ({}) } } })
    return [store.getData('name'), store.getData('broken'), localStorage.getItem(key) === before, sessionStorage.getItem(key)]
  })).toEqual(['saved', {}, true, 'invalid'])
})

test('functions retain closures but never execute cache strings or persist', async ({ page }) => {
  expect(await page.evaluate(async () => {
    const config = { dataProps: { fn: { type: Function, default: () => () => 'default' } } }
    const key = 'VMO-STORE:NORMAL:0'
    localStorage.setItem(key, JSON.stringify({ fn: { k: true, t: Date.now(), v: '(() => { window.injected = true; return () => 1 })()' } }))
    const store = new (window as any).VmoStore(config)
    const legacy = store.getData('fn')()
    const captured = 'closure'; store.setData('fn', async () => captured)
    return [legacy, await store.getData('fn')(), new (window as any).VmoStore(config).getData('fn')(), 'injected' in window, JSON.parse(localStorage.getItem(key)!).fn]
  })).toEqual(['default', 'closure', 'default', false, undefined])
})

test('Unicode obfuscation survives page reload with Unicode keys', async ({ page }) => {
  await page.evaluate(() => new (window as any).VmoStore({ cryptoKey: '中文🔑', dataProps: { name: { type: String } } }).setData('name', '秘密😀'))
  await page.reload(); await expect(page.locator('#ready')).toHaveText('Ready')
  expect(await page.evaluate(() => {
    const store = new (window as any).VmoStore({ cryptoKey: '中文🔑', dataProps: { name: { type: String } } })
    return [store.getData('name'), localStorage.getItem(store.getNameSpace())!.includes('秘密')]
  })).toEqual(['秘密😀', false])
})

test('invalid and circular assignments preserve previous data', async ({ page }) => {
  expect(await page.evaluate(() => {
    const store = new (window as any).VmoStore({ dataProps: { name: { type: String }, value: { type: Object } } })
    store.setData('name', 'old'); store.setData('value', { saved: true })
    const circular: any = {}; circular.self = circular
    let errors = 0
    for (const [key, value] of [['name', 1], ['value', circular], ['value', { fn: () => 1 }], ['missing', 'x']]) {
      try { store.setData(key, value) } catch { errors++ }
    }
    return [errors, store.getData('name'), store.getData('value')]
  })).toEqual([4, 'old', { saved: true }])
})

test('deep changes require reassignment and removal preserves defaults', async ({ page }) => {
  expect(await page.evaluate(() => {
    const config = { dataProps: { value: { type: Object, default: () => ({ fallback: true }) } } }
    const store = new (window as any).VmoStore(config); store.setData('value', { count: 1 })
    const value = store.getData('value'); value.count = 2
    const before = new (window as any).VmoStore(config).getData('value').count
    store.setData('value', value)
    const after = new (window as any).VmoStore(config).getData('value').count
    delete store.$store.value
    const fallback = store.getData('value')
    store.removeProp('value')
    return [before, after, fallback, store.getProps('value'), store.getData('value')]
  })).toEqual([1, 2, { fallback: true }, undefined, undefined])
})

test('UMD bundle loads as a classic browser script', async ({ page }) => {
  await page.addScriptTag({ url: '/dist/vmo-store.umd.cjs' })
  expect(await page.evaluate(() => {
    const bundle = (window as any)['vmo-store']
    const store = new bundle.VmoStore({ namespace: 'umd', dataProps: { name: { type: String } } })
    store.setData('name', 'UMD')
    return new bundle.VmoStore({ namespace: 'umd', dataProps: { name: { type: String } } }).getData('name')
  })).toBe('UMD')
})
