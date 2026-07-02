export default (req, res) => {
  res.json({ ok: true, url: req.url, time: new Date().toISOString() })
}
