import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import { traceMiddleware } from './middlewares/trace.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { errorHandler } from './middlewares/error.js';
import meetingRoutes from './routes/meetings.js';
import actionItemsRouter from './routes/actionItems.js';
import { startCronJobs } from './reminders/reminderJob.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' }
  }
});



const app = express();
const PORT = 8080;
app.use(limiter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(traceMiddleware); 
app.use(loggerMiddleware);
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api', actionItemsRouter);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

app.get('/api/evaluation', (req, res) => {
  res.json({
    candidateName: 'Maharshi Lavana',
    email: 'maharshilavana@gmail.com',
    repositoryUrl: 'https://github.com/maharshiicodes/hintro-backend-assignment',
    deployedUrl: 'https://hintro-backend-assignment-production.up.railway.app',
    externalIntegration: 'Discord Webhook',
    features: [
      'Authentication',
      'AI Analysis',
      'Citation Grounding',
      'Action Item Management',
      'Overdue Detection',
      'Reminder Scheduler',
      'Discord Integration',
      'Rate Limiting',
    ],
  });
});
app.use(errorHandler);

startCronJobs();
app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});