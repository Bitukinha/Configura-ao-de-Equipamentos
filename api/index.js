import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

let server

export default async (req, res) => {
  try {
    if (!server) {
      const { default: handler } = await import('../dist/server/server.js')
      server = handler
    }

    const url = new URL(req.url, `http://${req.headers.host}`)
    const response = await server.fetch(
      new Request(url, {
        method: req.method,
        headers: req.headers,
        body:
          req.method === 'GET' || req.method === 'HEAD'
            ? undefined
            : req.body,
      })
    )

    res.statusCode = response.status
    for (const [key, value] of response.headers) {
      res.setHeader(key, value)
    }

    const buffer = await response.arrayBuffer()
    res.end(Buffer.from(buffer))
  } catch (error) {
    console.error('Error:', error)
    res.statusCode = 500
    res.end('Internal Server Error: ' + error.message)
  }
}
