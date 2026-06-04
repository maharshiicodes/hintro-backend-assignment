import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  let authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({traceId: req.traceId, success: false, error: 'Unauthorized: No token provided' });
  }

  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
     return res.status(401).json({
  traceId: req.traceId,
  success: false,
  error: { code: 'UNAUTHORIZED', message: 'No token provided' }
});
  }
};