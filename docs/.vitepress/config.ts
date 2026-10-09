import { defineConfig } from 'vitepress'

const base = '/vmo-store/'
const sidebar = (zh: boolean) => {
  const prefix = zh ? '/zh' : ''
  const item = (text: string, path: string) => ({ text, link: `${prefix}/${path}` })
  return [
    { text: zh ? '使用指南' : 'Guide', items: [
      item(zh ? '快速开始' : 'Getting started', 'guide/getting-started'),
      item(zh ? '配置与类型' : 'Configuration & types', 'guide/configuration'),
      item(zh ? '持久化与数据类型' : 'Persistence & values', 'guide/persistence'),
      item(zh ? '过期与容量' : 'Expiration & capacity', 'guide/expiration'),
      item(zh ? '清理与版本迁移' : 'Cleanup & migration', 'guide/cleanup'),
      item(zh ? '自定义存储与 SSR' : 'Adapters & SSR', 'guide/adapters')
    ] },
    { text: zh ? '参考与示例' : 'Reference & examples', items: [
      item(zh ? 'API 参考' : 'API reference', 'api/'),
      item(zh ? '交互示例' : 'Playground', 'examples/'),
      item(zh ? '测试与验证' : 'Testing', 'guide/testing'),
      item(zh ? '发布到 GitHub Pages' : 'GitHub Pages deployment', 'guide/deployment')
    ] }
  ]
}

export default defineConfig({
  title: 'VmoStore',
  description: 'Typed browser caching with clear boundaries. 类型明确、边界清晰的浏览器缓存。',
  base,
  cleanUrls: false,
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }]],
  sitemap: { hostname: 'https://enmotion.github.io/vmo-store/' },
  locales: {
    root: {
      label: 'English', lang: 'en', description: 'Typed browser caching with clear boundaries.',
      themeConfig: {
        nav: [{ text: 'Guide', link: '/guide/getting-started' }, { text: 'API', link: '/api/' }, { text: 'Playground', link: '/examples/' }, { text: '0.0.1', link: '/guide/cleanup' }],
        sidebar: sidebar(false),
        outline: { level: [2, 3], label: 'On this page' },
        footer: { message: 'Small caches. Explicit behavior.', copyright: 'VmoStore · enmotion' }
      }
    },
    zh: {
      label: '简体中文', lang: 'zh-CN', description: '类型明确、边界清晰的浏览器缓存。',
      themeConfig: {
        nav: [{ text: '指南', link: '/zh/guide/getting-started' }, { text: 'API', link: '/zh/api/' }, { text: '交互示例', link: '/zh/examples/' }, { text: '0.0.1', link: '/zh/guide/cleanup' }],
        sidebar: sidebar(true),
        outline: { level: [2, 3], label: '本页目录' },
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdated: { text: '最后更新' },
        sidebarMenuLabel: '目录', returnToTopLabel: '返回顶部', darkModeSwitchLabel: '外观',
        langMenuLabel: '选择语言',
        footer: { message: '小型缓存，明确行为。', copyright: 'VmoStore · enmotion' }
      }
    }
  },
  themeConfig: {
    logo: '/favicon.svg',
    socialLinks: [{ icon: 'github', link: 'https://github.com/enmotion/vmo-store' }],
    editLink: { pattern: 'https://github.com/enmotion/vmo-store/edit/master/docs/:path' },
    search: { provider: 'local', options: { locales: { zh: { translations: {
      button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
      modal: { noResultsText: '没有找到相关结果', resetButtonTitle: '清除搜索', footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' } }
    } } } } }
  },
  vite: { server: { host: '127.0.0.1' } }
})
