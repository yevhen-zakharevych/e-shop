function errorHandler(error, req, res, next) {
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, error: error.inner.message });
  }

  return res.status(500).json({ success: false, error });
}

module.exports = errorHandler;
