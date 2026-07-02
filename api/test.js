export default (req, res) => {
  res.status(200).json({ message: 'API working', time: new Date().toISOString() })
}
