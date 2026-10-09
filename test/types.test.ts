import { expect, expectTypeOf, it } from 'vitest'
import { VmoStore } from '../index'

it('types reads as possibly absent while checking write values and keys', () => {
  const store = new VmoStore<{ name: string }>({
    namespace: 'type-test',
    dataProps: { name: { type: String } }
  })
  expectTypeOf(store.getData('name')).toEqualTypeOf<string | undefined>()
  expectTypeOf(store.$store.name).toEqualTypeOf<string | undefined>()
  expect(store.getData('name')).toBeUndefined()
  expectTypeOf(store.setData('name', 'Alice')).toEqualTypeOf<string>()
  expect(store.getData('name')).toBe('Alice')
  store.clear()
})
