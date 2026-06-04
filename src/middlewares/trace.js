import { randomUUID } from 'crypto';

export const traceMiddleware = (req, res, next) => {
  const id = randomUUID();
  req.traceId = id;
  res.setHeader('x-trace-id', id);
  next();
};