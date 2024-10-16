<script setup lang="ts">
import { VmoStore } from '../index'
// import { enCrypto, deCrypto } from '@lib/crypto-key'

// const cryptoData = enCrypto('enmotion-m2', 'kesa')
// console.error('Encrypted Data (Base64):', cryptoData)
// console.error('Decrypted Data (with random chars):', deCrypto(cryptoData, 'kesa'))

const ms = new VmoStore({
  cryptoKey: '1231skfasfjlaflsadf131kjlkjasfj',
  namespace: 'enmo',
  version: 1,
  prefix: 'mods',
  initClearUpMode: 'self',
  dataProps: {
    name: {
      type: [String, Number, Object, Array, Boolean, Date, Function],
      default: () => (a: number, b: number) => a + b,
      // expireTime: '2s',
      storge: 'sessionStorage'
    },
    user: {
      type: [Array, Object],
      default: () => [1233],
      // expireTime: '2s',
      storge: 'sessionStorage'
    },
    age: {
      type: [String, Number, Array, Function, Object],
      default: () => ['age'],
      expireTime: '3.5s',
      storge: 'localStorage'
    }
  }
})
// ms.clearUnusedCache('all')
ms.setData('user', { name: 'mod', id: 'ID:12213' })
ms.$store.age = 12
// ms.$store.name = function (a: number, b: number) {
//   return a * b
// }
console.log(ms.$store)
console.warn(ms.$store.name.constructor == Function ? ms.$store.name(4, 3) : ms.$store.name)
setTimeout(() => {
  console.warn(ms.$store.name.constructor == Function ? ms.$store.name(4, 3) : ms.$store.name)
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
