let handler

export default async (req, res) => {
  try {
    if (!handler) {
      const module = await import('../dist/server/server.js')
      handler = module.default
    }

    const response = await handler.fetch(
      new Request(new URL(req.url, `http://${req.headers.host}`), {
        method: req.method,
        headers: new Headers(req.headers),
        body: ['GET', 'HEAD'].includes(req.method) ? null : req.body,
      })
    )

    res.statusCode = response.status

    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    const buffer = await response.arrayBuffer()
    res.end(Buffer.from(buffer))
  } catch (error) {
    console.error('[API Error]', error)
    res.statusCode = 500
    res.end(`Error: ${error?.message || 'Unknown error'}`)
  }
}
