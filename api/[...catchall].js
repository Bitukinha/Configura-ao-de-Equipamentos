import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../dist/client')

let cachedHandler = null

async function getHandler() {
  if (cachedHandler) return cachedHandler
  const serverPath = path.join(__dirname, '../dist/server/server.js')
  const handler = (await import(serverPath)).default
  cachedHandler = handler
  return handler
}

async function serveStatic(req, res, filePath) {
  try {
    const file = await fs.readFile(filePath)
    const ext = path.extname(filePath)
    const mimeTypes = {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.woff2': 'font/woff2',
    }
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
    res.statusCode = 200
    res.end(file)
    return true
  } catch {
    return false
  }
}

export default async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const pathname = url.pathname

    // Tenta servir arquivo estático
    const filePath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname)
    if (await serveStatic(req, res, filePath)) return

    // Fallback para handler dinâmico
    const handler = await getHandler()
    const response = await handler.fetch(
      new Request(url.toString(), {
        method: req.method || 'GET',
        headers: req.headers || {},
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      })
    )

    for (const [key, value] of response.headers) {
      res.setHeader(key, value)
    }

    res.statusCode = response.status

    if (response.body) {
      const buffer = await response.arrayBuffer()
      res.end(Buffer.from(buffer))
    } else {
      res.end()
    }
  } catch (error) {
    console.error('[API Error]', error.message)
    res.statusCode = 500
    res.end(`Error: ${error.message}`)
  }
}
