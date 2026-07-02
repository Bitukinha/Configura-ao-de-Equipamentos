export default async (req, res) => {
  try {
    const { default: handler } = await import('../dist/server/server.js')
    const response = await handler.fetch(new Request(new URL(req.url, `http://${req.headers.host}`), { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body }))
    for (const [k, v] of response.headers) res.setHeader(k, v)
    res.status(response.status)
    res.end(await response.text())
  } catch (e) {
    res.status(500).end(e.message)
  }
}
