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

const app = express();
const PORT = 8080;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());
app.use(express.json());

app.use(traceMiddleware); 
app.use(loggerMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api', actionItemsRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});
app.use(errorHandler);

startCronJobs();
app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});