<script setup lang="ts">
import { VmoStore } from '../index'
const ms = new VmoStore({
  cryptoKey: 'adfaffdfa',
  dataProps: {
    name: {
      type: [String, Number, Object, Array, Boolean, Date, Function],
      default: 'mod',
      storge: 'sessionStorge'
    },
    age: {
      type: [String, Number, Array, Function, Object],
      default: () => [],
      expireTime: '3.5s',
      storge: 'localStorge'
    }
  }
})
ms.$store.name = 12
ms.$store.age = { a: 12 }
setTimeout(() => {
  ms.$store.name = ['22']
}, 1000)
// ms.$store.a.b = 'aa'
console.log(ms.$store.age)
setTimeout(() => {
  console.log(ms.$store.age)
}, 3000)
setTimeout(() => {
  console.log(ms.$store.age)
}, 5000)
// console.log(ms.$data.a.b.c.d)
// ms.$data.ss = { name: 'kdo' }
// ms.$data.a = 12
// ms.$data.c = {
//   name: {
//     age: 12
//   }
// }
// const bytes = new TextEncoder().encode('徐看看')
// console.log(bytes.byteLength)

// // console.log(ms.$data.a)
// // console.log(ms.$data.c.name.age)
// ms.$data.d = 12
// ms.$data.c.name.ok = 'ok'
// console.log(null ?? true)
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
