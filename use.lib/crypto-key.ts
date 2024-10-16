/*
 * @Author: enmotion
 * @Date: 2024-10-16 17:05:20
 * @Last Modified by: enmotion
 * @Last Modified time: 2024-10-16 17:07:21
 */
function _trans(data: string, key: string): string[] {
  const result = []
  for (let i = 0; i < data.length; i++) {
    // 使用字符的 Unicode 码进行异或操作
    result.push(String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length)))
  }
  return result
}

function _toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

function _fromBase64(str: string): string {
  return decodeURIComponent(escape(atob(str)))
}
/**
 * 加密
 * @param data {string} 需要加密的数据
 * @param key {string} 加密的KEY
 * @returns {string}
 */
export function enCrypto(data: string, key: string): string {
  return _toBase64(_trans(data, key).join('')).split('').reverse().join('')
}
/**
 * 解密
 * @param data {string} 需要解密的数据
 * @param key {string} 解密的KEY
 * @returns {string}
 */
export function deCrypto(data: string, key: string): string {
  return _trans(_fromBase64(data.split('').reverse().join('')), key).join('')
}
