<script setup lang="ts">
import { VmoStore } from '../index'
import { enCrypto, deCrypto } from '@lib/crypto-key'

const cryptoData = enCrypto('enmotion-m2', 'kesa')
console.error('Encrypted Data (Base64):', cryptoData)
console.error('Decrypted Data (with random chars):', deCrypto(cryptoData, 'kesa'))

const ms = new VmoStore({
  cryptoKey: 'op',
  namespace: 'mod',
  version: 0,
  prefix: 'sss',
  dataProps: {
    name: {
      type: [String, Number, Object, Array, Boolean, Date, Function],
      default: 'mod',
      storge: 'sessionStorge'
    },
    user: {
      type: [Array, Object],
      default: () => [1233],
      // expireTime: '2s',
      storge: 'localStorage'
    },
    age: {
      type: [String, Number, Array, Function, Object],
      default: () => ['age'],
      expireTime: '3.5s',
      storge: 'localStorage'
    }
  }
})
ms.setItem('user', { name: 'mod', id: 'ID:12213' })
ms.$store.age = 12
ms.$store.name = 'enmotion'
console.log(ms.getItem('user'))
setTimeout(() => {
  console.log(ms.getItem('user'))
}, 1000)
setTimeout(() => {
  console.log(ms.getItem('user'))
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
