import { test, expect } from '@playwright/test'

for (const locale of ['en', 'zh'] as const) {
  const prefix = locale === 'en' ? '/vmo-store/' : '/vmo-store/zh/'
  const zh = locale === 'zh'
  test(`${locale}: homepage is accessible, responsive and free of runtime errors`, async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const response = await page.goto(prefix)
    expect(response?.status()).toBe(200)
    await expect(page.locator('html')).toHaveAttribute('lang', zh ? 'zh-CN' : 'en')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(zh ? '浏览器缓存' : 'Browser caching')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: info.outputPath(`${locale}-home.png`), fullPage: true })
    expect(errors).toEqual([])
  })

  test(`${locale}: every guide and API deep link loads from the production base`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    for (const route of ['guide/getting-started.html', 'guide/configuration.html', 'guide/persistence.html', 'guide/expiration.html', 'guide/cleanup.html', 'guide/adapters.html', 'guide/testing.html', 'guide/deployment.html', 'api/']) {
      const response = await page.goto(prefix + route)
      expect(response?.status(), route).toBe(200)
      await expect(page.locator('main h1')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true)
      await page.reload()
      await expect(page.locator('main h1')).toBeVisible()
    }
    expect(errors).toEqual([])
  })

  test(`${locale}: playground persists on reload and clears only its namespace`, async ({ page }, info) => {
    await page.goto(prefix + 'examples/')
    const field = page.getByLabel(zh ? '用户名称' : 'User name', { exact: true })
    await expect(field).toBeEnabled()
    await page.evaluate(() => localStorage.setItem('foreign-app', 'keep'))
    await field.fill('Browser 用户😀')
    await page.getByRole('button', { name: zh ? '保存数据' : 'Save value', exact: true }).click()
    await expect(page.getByTestId('playground-value')).toHaveText('Browser 用户😀')
    await page.reload()
    await expect(page.getByTestId('playground-value')).toHaveText('Browser 用户😀')
    await page.getByRole('button', { name: zh ? '重新读取持久化缓存' : 'Read persisted cache', exact: true }).click()
    await expect(page.getByTestId('playground-value')).toHaveText('Browser 用户😀')
    await page.getByRole('button', { name: zh ? '清理命名空间' : 'Clear namespace', exact: true }).click()
    await expect(page.getByTestId('playground-value')).toHaveText('guest')
    expect(await page.evaluate(() => localStorage.getItem('foreign-app'))).toBe('keep')
    await expect(page.getByRole('alert')).toHaveCount(0)
    await page.screenshot({ path: info.outputPath(`${locale}-playground.png`), fullPage: true })
  })

  test(`${locale}: local search finds a real documentation page`, async ({ page }) => {
    await page.goto(prefix)
    await page.locator('.VPNavBarSearch button').click()
    const search = page.locator('#localsearch-input')
    await expect(search).toBeVisible()
    await search.fill(zh ? '容量' : 'capacity')
    const result = page.locator('.VPLocalSearchBox a').filter({ hasText: zh ? '容量' : /capacity/i }).first()
    await expect(result).toBeVisible()
    await result.click()
    await expect(page.locator('main h1')).toBeVisible()
    expect(page.url()).toContain('/vmo-store/')
  })
}

test('language menus switch between corresponding pages', async ({ page }) => {
  await page.goto('/vmo-store/guide/getting-started.html')
  const mobile = (page.viewportSize()?.width ?? 1280) < 960
  async function switchLanguage(label: string) {
    if (mobile) {
      await page.getByRole('button', { name: 'mobile navigation', exact: true }).click()
      await page.locator('.VPNavScreenTranslations button').click()
      await page.locator('.VPNavScreenTranslations').getByRole('link', { name: label, exact: true }).click()
    } else {
      await page.locator('.VPNavBarTranslations button').click()
      await page.locator('.VPNavBarTranslations').getByRole('link', { name: label, exact: true }).click()
    }
  }
  await switchLanguage('简体中文')
  await expect(page.locator('main h1')).toHaveText('快速开始')
  await switchLanguage('English')
  await expect(page.locator('main h1')).toHaveText('Getting started')
})

test('navigation menus work and dark mode survives reloading', async ({ page }, info) => {
  await page.goto('/vmo-store/')
  const mobile = (page.viewportSize()?.width ?? 1280) < 960
  if (mobile) {
    await page.getByRole('button', { name: 'mobile navigation', exact: true }).click()
    await page.locator('.VPNavScreenMenu').getByRole('link', { name: 'Guide', exact: true }).click()
  } else {
    await page.locator('.VPNavBarMenu').getByRole('link', { name: 'Guide', exact: true }).click()
  }
  await expect(page.locator('main h1')).toHaveText('Getting started')
  if (mobile) await page.getByRole('button', { name: 'mobile navigation', exact: true }).click()
  const toggle = page.locator(mobile ? '.VPNavScreenAppearance .VPSwitchAppearance' : '.VPNavBarAppearance .VPSwitchAppearance')
  await toggle.click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('dark-guide.png'), fullPage: true })
})

test('all internal documentation links resolve to generated pages', async ({ page, request }) => {
  await page.goto('/vmo-store/guide/getting-started.html')
  const urls = new Set<string>()
  for (const route of ['/vmo-store/', '/vmo-store/zh/', '/vmo-store/api/', '/vmo-store/zh/api/', '/vmo-store/examples/', '/vmo-store/zh/examples/']) {
    await page.goto(route)
    const links = await page.locator('a[href]').evaluateAll(elements => elements.map(element => (element as HTMLAnchorElement).href))
    for (const link of links) {
      const url = new URL(link)
      if (url.origin === 'http://127.0.0.1:4173' && url.pathname.startsWith('/vmo-store/')) urls.add(url.pathname)
    }
  }
  expect(urls.size).toBeGreaterThan(20)
  for (const url of urls) expect((await request.get(url)).status(), url).toBe(200)
})
