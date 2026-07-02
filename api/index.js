export default async (req, res) => {
  try {
    const { default: handler } = await import('../dist/server/server.js')

    const response = await handler.fetch(
      new Request(new URL(req.url, `http://${req.headers.host}`), {
        method: req.method,
        headers: req.headers,
        body: req.body ? JSON.stringify(req.body) : undefined,
      })
    )

    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value)
    }
    res.status(response.status)
    res.end(await response.text())
  } catch (error) {
    console.error('Handler error:', error)
    res.status(500).end(`Error: ${error.message}`)
  }
}
