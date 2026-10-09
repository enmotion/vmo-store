import { readdir, readFile, writeFile } from 'node:fs/promises'

// CommonJS consumers need declarations classified as CommonJS, including imports.
async function copyDeclarations(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name, directory)
    if (entry.isDirectory()) await copyDeclarations(new URL(entry.name + '/', directory))
    else if (entry.name.endsWith('.d.ts')) {
      const source = await readFile(path, 'utf8')
      await writeFile(new URL(entry.name.replace(/\.d\.ts$/, '.d.cts'), directory), source.replace(/(from\s+['"][^'"]+)\.js(['"])/g, '$1.cjs$2'))
    }
  }
}

await copyDeclarations(new URL('../dist/', import.meta.url))
