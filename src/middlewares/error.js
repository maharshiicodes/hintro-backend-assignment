export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} >>`, err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Something went wrong on the server',
    traceId: req.traceId 
  });
};