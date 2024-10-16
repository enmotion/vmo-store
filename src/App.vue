<script setup lang="ts">
import { VmoStore } from '../index'

const cache = new VmoStore({
  cryptoKey: 'mods', // 加密密钥
  namespace: 'enmo', // 命名空间
  version: 1, // 存储版本
  prefix: 'mods', // 前置名称
  cacheInitCleanupMode: 'self', // 缓存清理模式
  dataProps: {
    pluss: {
      type: [Function], // 类型约束
      default: () => (a: number, b: number) => a + b, // 默认值，类 vue props
      // expireTime: '2s',
      storge: 'localStorage' // 指定存储器
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
cache.$store.user = ['a', '啊疯狂打是否开放', '啊疯狂打是否开放']
cache.$store.user = ['a', '啊疯狂打是否开放', '啊疯狂打是否开中']
console.log(cache.$store.user) // [1233]
// cache.removeData('user')
console.log(cache.$store.user) // [1233]
console.log(cache.$store.pluss(3, 3)) // 6
cache.$store.pluss = (a: number, b: number) => a * b
console.log(cache.$store.pluss(3, 3)) // 9
setTimeout(() => {
  // 过期后再次使用
  console.log(cache.$store.pluss(3, 3)) // 6
  console.log(cache.getCapacity())
}, 3000)
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
