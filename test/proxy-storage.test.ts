import { expect, test } from 'vitest'
import { defaultStorageMethodProxy as storage } from '../index'

test('defaultStorageMethodProxy.setItem', () => {
  // Test localStorage
  storage.setItem('testKey', 'testValue', 'localStorage')
  expect(localStorage.getItem('testKey')).toBe('testValue')

  // Test sessionStorage
  storage.setItem('testKey', 'testValue', 'sessionStorage')
  expect(sessionStorage.getItem('testKey')).toBe('testValue')
})

test('defaultStorageMethodProxy.getItem', () => {
  // Test localStorage
  localStorage.setItem('testKey', 'testValue')
  expect(storage.getItem('testKey', 'localStorage')).toBe('testValue')

  // Test sessionStorage
  sessionStorage.setItem('testKey', 'testValue')
  expect(storage.getItem('testKey', 'sessionStorage')).toBe('testValue')
})

test('defaultStorageMethodProxy.removeItem', () => {
  // Test localStorage
  localStorage.setItem('testKey', 'testValue')
  storage.removeItem('testKey', 'localStorage')
  expect(localStorage.getItem('testKey')).toBeNull()

  // Test sessionStorage
  sessionStorage.setItem('testKey', 'testValue')
  storage.removeItem('testKey', 'sessionStorage')
  expect(sessionStorage.getItem('testKey')).toBeNull()
})

test('defaultStorageMethodProxy.clear', () => {
  // Test clearing localStorage
  localStorage.setItem('testKey', 'testValue')
  storage.clear('localStorage')
  expect(localStorage.length).toBe(0)

  // Test clearing sessionStorage
  sessionStorage.setItem('testKey', 'testValue')
  storage.clear('sessionStorage')
  expect(sessionStorage.length).toBe(0)

  // Test clearing both storages
  localStorage.setItem('testKey1', 'testValue1')
  sessionStorage.setItem('testKey2', 'testValue2')
  storage.clear()
  expect(localStorage.length).toBe(0)
  expect(sessionStorage.length).toBe(0)
})

test('defaultStorageMethodProxy.getKeys', () => {
  // Test getting keys from localStorage
  localStorage.setItem('testKey1', 'testValue1')
  localStorage.setItem('testKey2', 'testValue2')
  expect(storage.getKeys('localStorage')).toEqual(['testKey1', 'testKey2'])

  // Test getting keys from sessionStorage
  sessionStorage.setItem('testKey1', 'testValue1')
  sessionStorage.setItem('testKey2', 'testValue2')
  expect(storage.getKeys('sessionStorage')).toEqual(['testKey1', 'testKey2'])

  // Test getting keys from both storages
  localStorage.setItem('testKey1', 'testValue1')
  sessionStorage.setItem('testKey2', 'testValue2')
  expect(storage.getKeys()).toEqual(['testKey1', 'testKey2'])
})