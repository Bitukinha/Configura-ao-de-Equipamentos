export default async (req, res) => {
  const { default: handler } = await import('../dist/server/server.js')
  const url = new URL(req.url, `http://${req.headers.host}`)
  const response = await handler.fetch(
    new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    })
  )
  for (const [k, v] of response.headers) res.setHeader(k, v)
  res.status(response.status)
  const text = await response.text()
  res.end(text)
}
