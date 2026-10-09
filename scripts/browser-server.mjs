import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.cjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost')
    let path = decodeURIComponent(url.pathname)
    if (path === '/vmo-store') { response.writeHead(301, { location: '/vmo-store/' }); response.end(); return }
    let directory
    if (path.startsWith('/vmo-store/')) { directory = resolve(root, 'docs/.vitepress/dist'); path = path.slice('/vmo-store/'.length) }
    else if (path.startsWith('/dist/')) { directory = resolve(root, 'dist'); path = path.slice('/dist/'.length) }
    else if (path === '/test/' || path === '/test/index.html') { directory = resolve(root, 'e2e'); path = 'fixture.html' }
    else { response.writeHead(404); response.end('Not found'); return }
    let file = resolve(directory, path)
    if (file !== directory && !file.startsWith(directory + sep)) { response.writeHead(403); response.end('Forbidden'); return }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html')
    const body = await readFile(file)
    response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    response.end(body)
  } catch { response.writeHead(404); response.end('Not found') }
})
server.listen(Number(process.env.BROWSER_TEST_PORT ?? 4173), '127.0.0.1', () => console.log('Browser test server ready on http://127.0.0.1:4173'))
