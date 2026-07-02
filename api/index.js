import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let cachedHandler = null

async function getHandler() {
  if (cachedHandler) return cachedHandler

  try {
    const serverPath = path.join(__dirname, '../dist/server/server.js')
    const handler = (await import(serverPath)).default
    cachedHandler = handler
    return handler
  } catch (err) {
    console.error('Failed to load server handler:', err)
    throw err
  }
}

export default async (req, res) => {
  try {
    const handler = await getHandler()

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    
    const response = await handler.fetch(
      new Request(url.toString(), {
        method: req.method || 'GET',
        headers: req.headers || {},
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      })
    )

    // Copy headers
    for (const [key, value] of response.headers) {
      res.setHeader(key, value)
    }

    // Set status
    res.statusCode = response.status

    // Send body
    if (response.body) {
      const buffer = await response.arrayBuffer()
      res.end(Buffer.from(buffer))
    } else {
      res.end()
    }
  } catch (error) {
    console.error('Error in API handler:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain')
    res.end(`Internal Server Error: ${error.message}`)
  }
}
