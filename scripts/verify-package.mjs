import { cpSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const project = fileURLToPath(new URL('../', import.meta.url))
const root = mkdtempSync(join(tmpdir(), 'vmo-package-'))
const run = args => {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`Package verification failed: ${args[0]}`)
}
try {
  const packageDirectory = join(root, 'node_modules/vmo-store')
  mkdirSync(packageDirectory, { recursive: true })
  cpSync(join(project, 'dist'), join(packageDirectory, 'dist'), { recursive: true })
  copyFileSync(join(project, 'package.json'), join(packageDirectory, 'package.json'))
  const types = `import { VmoStore } from 'vmo-store';
const store = new VmoStore<{ name: string }>({ dataProps: { name: { type: String } } });
const value: string | undefined = store.getData('name');
store.setData('name', 'Alice');
// @ts-expect-error unknown keys must be rejected
store.setData('missing', 'x');
// @ts-expect-error wrong value types must be rejected
store.setData('name', 1);
// @ts-expect-error reads can be absent
const required: string = store.getData('name');
`
  writeFileSync(join(root, 'consumer.mts'), types)
  writeFileSync(join(root, 'consumer.cts'), types)
  run([join(project, 'node_modules/typescript/bin/tsc'), '--strict', '--noEmit', '--skipLibCheck', 'false', '--target', 'ES2020', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'consumer.mts', 'consumer.cts'])
  const runtime = `
const assert = requireAssert;
const stores = { localStorage: new Map(), sessionStorage: new Map() };
const storage = {
  getItem: (key, type) => stores[type].get(key) ?? null,
  setItem: (key, value, type) => stores[type].set(key, value),
  removeItem: (key, type) => stores[type].delete(key),
  clear: type => stores[type].clear(),
  getKeys: () => [...new Set([...stores.localStorage.keys(), ...stores.sessionStorage.keys()])]
};
const config = { storage, dataProps: { value: { type: Map } } };
const store = new VmoStore(config);
store.setData('value', new Map([['date', new Date('2024-01-01')]]));
assert.deepStrictEqual(new VmoStore(config).getData('value'), store.getData('value'));
store.clear();
assert.equal(store.getData('value'), undefined);
`
  writeFileSync(join(root, 'consumer.mjs'), "import { VmoStore } from 'vmo-store';\nimport requireAssert from 'node:assert/strict';\n" + runtime)
  writeFileSync(join(root, 'consumer.cjs'), "const { VmoStore } = require('vmo-store');\nconst requireAssert = require('node:assert/strict');\n" + runtime)
  run(['consumer.mjs'])
  run(['consumer.cjs'])
  console.log('ESM/CJS imports and strict NodeNext declarations passed.')
} finally {
  rmSync(root, { recursive: true, force: true })
}
