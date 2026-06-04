import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import { traceMiddleware } from './middlewares/trace.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { errorHandler } from './middlewares/error.js';
import meetingRoutes from './routes/meetings.js';

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

app.use(traceMiddleware); 
app.use(loggerMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});