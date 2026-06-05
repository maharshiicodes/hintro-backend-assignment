import { logger } from '../config/logger.js';

export const sendDiscordReminder = async (task, assignee, dueDate, traceId) => {
  const body = {
    content: ` **Overdue Reminder**\n**Task:** ${task}\n**Assigned to:** ${assignee}\n**Due:** ${dueDate ? new Date(dueDate).toDateString() : 'No due date'}`,
  };

  const res = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook failed with status ${res.status}`);
  }

  logger.info({ traceId, message: 'Discord reminder sent', task, assignee });
};