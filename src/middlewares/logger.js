export const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const logData = {
      timestamp: new Date().toISOString(),
      traceId: req.traceId, 
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    };
    console.log(JSON.stringify(logData));
  });

  next();
};