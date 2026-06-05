import cron from 'node-cron';
import { and, sql, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/config.js';
import { actionItems, meetings, reminders } from '../db/schema.js';
import { sendDiscordReminder } from '../lib/notifier.js';
import { logger } from '../config/logger.js';

export const processOverdueReminders = async () => {
  const traceId = nanoid();
  logger.info({ traceId, message: 'Cron: checking overdue action items' });

  const overdueItems = await db.select({
    id: actionItems.id,
    task: actionItems.task,
    assignee: actionItems.assignee,
    dueDate: actionItems.dueDate,
    meetingId: actionItems.meetingId,
  })
  .from(actionItems)
  .innerJoin(meetings, eq(actionItems.meetingId, meetings.id))
  .where(
    and(
      sql`${actionItems.status} != 'COMPLETED'`,
      sql`${actionItems.dueDate} < NOW()`
    )
  );

  logger.info({ traceId, message: `Found ${overdueItems.length} overdue items` });

  for (const item of overdueItems) {
    try {
      await sendDiscordReminder(item.task, item.assignee, item.dueDate, traceId);

      await db.insert(reminders).values({
        actionItemId: item.id,
        channel: 'discord',
        status: 'sent',
      });

      logger.info({ traceId, message: 'Reminder sent', actionItemId: item.id, assignee: item.assignee });
    } catch (err) {
      logger.error({ traceId, message: 'Reminder failed', actionItemId: item.id, error: err.message });

      await db.insert(reminders).values({
        actionItemId: item.id,
        channel: 'discord',
        status: 'failed',
      });
    }
  }
};

export const startCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info({ message: 'Cron triggered: processOverdueReminders' });
    await processOverdueReminders();
  });

  logger.info({ message: 'Cron jobs registered' });
};