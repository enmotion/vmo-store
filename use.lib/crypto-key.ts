/** Reversible obfuscation for compatibility; this is not cryptographic encryption. */
export function enCrypto(data: string, key: string): string {
  if (key.length === 0) throw new TypeError('Obfuscation key must not be empty.')
  let bytes = ''
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    bytes += String.fromCharCode(code & 255, code >>> 8)
  }
  return 'v1:' + btoa(bytes)
}

export function deCrypto(data: string, key: string): string {
  if (key.length === 0) throw new TypeError('Obfuscation key must not be empty.')
  let result = ''
  if (data.startsWith('v1:')) {
    const bytes = atob(data.slice(3))
    if (bytes.length % 2 !== 0) throw new TypeError('Invalid obfuscated payload.')
    for (let i = 0; i < bytes.length; i += 2) {
      const code = bytes.charCodeAt(i) | (bytes.charCodeAt(i + 1) << 8)
      result += String.fromCharCode(code ^ key.charCodeAt((i / 2) % key.length))
    }
  } else {
    // Read caches written by releases using reversed Base64 over UTF-8 XOR text.
    const legacy = decodeURIComponent(escape(atob(data.split('').reverse().join(''))))
    for (let i = 0; i < legacy.length; i++) {
      result += String.fromCharCode(legacy.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
  }
  return result
}
