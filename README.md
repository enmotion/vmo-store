# vmo-store

vmo-store 是基于原生缓存的上层封装库，其目的主要是为解决对缓存的类型约束，命名空间管理(避免污染), 过期判定，类型约束，有效存储空间维护 5 大功能
其采用了 proxy 代理的设计模式，对缓存操作进行了底层上的自动化处理封装。让缓存的管控变得更为精准，简单，快捷！

## 如何安装

```node
npm i vmo-store --save
```

## 快速开始

```ts
import { VmoStore } from '../index'

const cache = new VmoStore({
  cryptoKey: '123', // 加密密钥
  namespace: 'enmo', // 命名空间
  version: 1, // 存储版本
  prefix: 'mods', // 前置名称
  cacheInitCleanupMode: 'self', // 缓存清理模式
  dataProps: {
    plused: {
      type: [Function], // 类型约束
      default: () => (a: number, b: number) => a + b, // 默认值，类 vue props
      // expireTime: '2s',
      storge: 'sessionStorage' // 指定存储器
    },
    user: {
      type: Array,
      default: () => [1233],
      // expireTime: '2m',
      storge: 'sessionStorage'
    },
    age: {
      type: [String, Number, Array, Function, Object],
      default: () => ['age'],
      expireTime: '3.5s', // 过期时间
      storge: 'localStorage'
    }
  }
})

console.log(cache.$store.user) // [1233]
console.log(cache.$store.plused(3, 3), 'a') // 6
// cache.$store.plused = (a: number, b: number) => a * b
console.log(cache.$store.plused(3, 3), 'b') // 9
setTimeout(() => {
  // 过期后再次使用
  console.log(cache.$store.plused(3, 3)) // 6
}, 3000)
```

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.
