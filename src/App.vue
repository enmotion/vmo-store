<script setup lang="ts">
import { VmoStore } from '../index'

const cache = new VmoStore<Record<string,any>>({
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
    pluss: {
      type: [Function], // 类型约束
      default: () => (a: number, b: number) => a + b, // 默认值，类 vue props
      // expireTime: '2s',
      storge: 'localStorage' // 指定存储器
    },
    user: {
      type: [Function],
      default: () => (a: number, b: number) => a + b,
      expireTime: '1m',
      storge: 'localStorage'
    },
    age: {
      type: [String, Number, Array, Function, Object],
      default: () => ['age'],
      expireTime: '3.5s', // 过期时间
      storge: 'localStorage'
    }
  }
})
async function a() {
  const ss = await cache.$store.user(8, 8)
  console.log(ss)
}
cache.getData('name')
cache.setData('age',12)
a()
// console.log( cache.$store.user(2, 1), '1') // [1233]
try {
  // cache.$store.user = async function (a: number, b: number) {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       resolve(a * b + ' /aaa')
  //     }, 1000)
  //   })
  // }
} catch (err) {
  console.log(err)
}

// console.log(cache.$store.user, '2') // [1233]
// // cache.removeData('user')
// console.log(cache.$store.user, '3') // [1233]
// console.log(cache.$store.pluss(3, 3)) // 6
// // cache.$store.pluss = (a: number, b: number) => a * b
// console.log(cache.$store.pluss(3, 3)) // 9
// setTimeout(() => {
//   // 过期后再次使用
//   console.log(cache.$store.pluss(3, 3)) // 6
//   console.log(cache.getCapacity())
// }, 3000)
// const W: any = window
// W.cache = cache
</script>

<template>
  <div class="flex flex-col flex-grow items-center justify-center">
    <!-- <vmo-button perfix="ssee">aaaa</vmo-button> -->
  </div>
</template>

<style>
html,
body {
  height: 100%;
  display: flex;
  flex-grow: 1;
}
</style>
