<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { VmoStore } from '../../../../index'

const props = defineProps<{ lang: 'en' | 'zh' }>()
const input = ref('Alice')
const value = ref('guest')
const usage = ref(0)
const ready = ref(false)
const error = ref('')
let cache: VmoStore<{ user: string }>
const config = { prefix: 'VMO-DOCS', namespace: 'playground', version: 1, dataProps: { user: { type: String, default: 'guest' } } }
const text = (en: string, zh: string) => props.lang === 'zh' ? zh : en
function refresh() {
  value.value = cache.getData('user') ?? 'guest'
  usage.value = cache.getCapacity().localStorage.used
}
function action(kind: 'save' | 'reload' | 'clear') {
  error.value = ''
  try {
    if (kind === 'save') cache.setData('user', input.value)
    if (kind === 'reload') cache = new VmoStore(config)
    if (kind === 'clear') cache.clear()
    refresh()
  } catch (cause) { error.value = String(cause) }
}
onMounted(() => {
  try { cache = new VmoStore(config); refresh(); ready.value = true }
  catch (cause) { error.value = String(cause) }
})
</script>

<template>
  <section class="playground" :aria-label="text('Cache playground', '缓存交互示例')">
    <label for="cache-user">{{ text('User name', '用户名称') }}</label>
    <input id="cache-user" v-model="input" autocomplete="off" :disabled="!ready" />
    <div class="actions">
      <button :disabled="!ready" @click="action('save')">{{ text('Save value', '保存数据') }}</button>
      <button :disabled="!ready" @click="action('reload')">{{ text('Read persisted cache', '重新读取持久化缓存') }}</button>
      <button :disabled="!ready" @click="action('clear')">{{ text('Clear namespace', '清理命名空间') }}</button>
    </div>
    <output aria-live="polite" data-testid="playground-value">{{ value }}</output>
    <p class="detail">{{ text('Local payload', '本地缓存内容') }}: {{ usage }} bytes · {{ text('Default', '默认值') }}: guest</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </section>
</template>
