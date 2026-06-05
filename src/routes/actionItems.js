import { Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/config.js';
import { actionItems, meetings } from '../db/schema.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

const createActionItemSchema = z.object({
  meetingId: z.string().uuid('Invalid meeting ID'),
  task: z.string().min(1, 'Task is required'),
  assignee: z.string().min(1, 'Assignee is required'),
  dueDate: z.string().datetime({ offset: true }).optional(),
  citations: z.array(z.object({ timestamp: z.string() })).default([]),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
    errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' }),
  }),
});

const listQuerySchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  assignee: z.string().optional(),
  meetingId: z.string().uuid().optional(),
});

router.post('/action-items', requireAuth, async (req, res, next) => {
  try {
    const parsed = createActionItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        traceId: req.traceId,
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { meetingId, task, assignee, dueDate, citations } = parsed.data;

    
    const meeting = await db.select().from(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.userId, req.user.userId)));

    if (meeting.length === 0) {
      return res.status(404).json({
        traceId: req.traceId,
        success: false,
        error: { code: 'NOT_FOUND', message: 'Meeting not found' },
      });
    }

    const newItem = await db.insert(actionItems).values({
      meetingId,
      task,
      assignee,
      dueDate: dueDate ? new Date(dueDate) : null,
      citations,
    }).returning();

    return res.status(201).json({
      traceId: req.traceId,
      success: true,
      data: newItem[0],
    });
  } catch (err) {
    next(err);
  }
});


router.get('/action-items', requireAuth, async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        traceId: req.traceId,
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { status, assignee, meetingId } = parsed.data;

    const conditions = and(
      eq(meetings.userId, req.user.userId),
      status ? eq(actionItems.status, status) : undefined,
      assignee ? eq(actionItems.assignee, assignee) : undefined,
      meetingId ? eq(actionItems.meetingId, meetingId) : undefined,
    );

    const items = await db.select({
      id: actionItems.id,
      meetingId: actionItems.meetingId,
      task: actionItems.task,
      assignee: actionItems.assignee,
      status: actionItems.status,
      dueDate: actionItems.dueDate,
      citations: actionItems.citations,
    })
    .from(actionItems)
    .innerJoin(meetings, eq(actionItems.meetingId, meetings.id))
    .where(conditions);

    return res.status(200).json({
      traceId: req.traceId,
      success: true,
      data: items,
    });
  } catch (err) {
    next(err);
  }
});


router.patch('/action-items/:id/status', requireAuth, async (req, res, next) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        traceId: req.traceId,
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    
    const item = await db.select().from(actionItems)
      .innerJoin(meetings, eq(actionItems.meetingId, meetings.id))
      .where(and(eq(actionItems.id, req.params.id), eq(meetings.userId, req.user.userId)));

    if (item.length === 0) {
      return res.status(404).json({
        traceId: req.traceId,
        success: false,
        error: { code: 'NOT_FOUND', message: 'Action item not found' },
      });
    }

    const updated = await db.update(actionItems)
      .set({ status: parsed.data.status })
      .where(eq(actionItems.id, req.params.id))
      .returning();

    return res.status(200).json({
      traceId: req.traceId,
      success: true,
      data: updated[0],
    });
  } catch (err) {
    next(err);
  }
});

router.get('/action-items/overdue', requireAuth, async (req, res, next) => {
  try {
    const overdueItems = await db.select({
      id: actionItems.id,
      meetingId: actionItems.meetingId,
      task: actionItems.task,
      assignee: actionItems.assignee,
      status: actionItems.status,
      dueDate: actionItems.dueDate,
      citations: actionItems.citations,
    })
    .from(actionItems)
    .innerJoin(meetings, eq(actionItems.meetingId, meetings.id))
    .where(
      and(
        eq(meetings.userId, req.user.userId),
        sql`${actionItems.status} != 'COMPLETED'`,
        sql`${actionItems.dueDate} < NOW()`
      )
    );

    return res.status(200).json({
      traceId: req.traceId,
      success: true,
      data: overdueItems,
    });
  } catch (err) {
    next(err);
  }
});

export default router;