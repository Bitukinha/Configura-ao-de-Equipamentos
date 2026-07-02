import type { VercelRequest, VercelResponse } from '@vercel/node'
import server from '../../dist/server/server.js'

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const response = await server.fetch(
      new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers as any,
        body:
          req.method === 'GET' || req.method === 'HEAD'
            ? undefined
            : JSON.stringify(req.body),
      })
    )

    res.status(response.status)
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    const buffer = await response.arrayBuffer()
    res.end(Buffer.from(buffer))
  } catch (error) {
    console.error('Error:', error)
    res.status(500).end('Internal Server Error')
  }
}

