import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import CachePlayground from './components/CachePlayground.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) { app.component('CachePlayground', CachePlayground) }
} satisfies Theme
