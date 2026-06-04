import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/config.js';
import { meetings ,analyses,actionItems } from '../db/schema.js';
import { analyzeMeeting } from '../lib/groq.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

const transcriptSchema = z.object({
  timestamp: z.string().min(1),
  speaker: z.string().min(1),
  text: z.string().min(1),
});

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  participants: z.array(z.string().email('Invalid participant email')).min(1),
  meetingDate: z.string().datetime({ offset: true }),
  transcript: z.array(transcriptSchema).min(1, 'Transcript cannot be empty'),
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = meetingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        traceId: req.traceId,
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }
    const { title, participants, meetingDate, transcript } = parsed.data;
    const userId = req.user.userId;

    const newMeeting = await db.insert(meetings).values({
      userId,
      title,
      participants,
      meetingDate: new Date(meetingDate),
      transcript,
    }).returning();

    return res.status(201).json({
      traceId: req.traceId,
      success: true,
      data: newMeeting[0],
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const allMeetings = await db.select().from(meetings)
      .where(eq(meetings.userId, req.user.userId));

    return res.status(200).json({
      traceId: req.traceId,
      success: true,
      data: allMeetings,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const meetingId = req.params.id;
    const meeting = await db.select().from(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.userId, req.user.userId)));

    if (meeting.length === 0) {
      return res.status(404).json({
        traceId: req.traceId,
        success: false,
        error: { code: 'NOT_FOUND', message: 'Meeting not found' },
      });
    }

    return res.status(200).json({
      traceId: req.traceId,
      success: true,
      data: meeting[0],
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/analyze', requireAuth, async (req, res, next) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user.userId;

    const meeting = await db.select().from(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)));

    if (meeting.length === 0) {
      return res.status(404).json({
        traceId: req.traceId,
        success: false,
        error: { code: 'NOT_FOUND', message: 'Meeting not found' },
      });
    }

    const transcript = meeting[0].transcript;
    const result = await analyzeMeeting(transcript);

    const existingAnalysis = await db.select().from(analyses)
      .where(eq(analyses.meetingId, meetingId));

    let savedAnalysis;

    if (existingAnalysis.length > 0) {
      savedAnalysis = await db.update(analyses)
        .set({
          summary: result.summary,
          actionItems: result.actionItems,
          decisions: result.decisions,
          followUps: result.followUps,
        })
        .where(eq(analyses.meetingId, meetingId))
        .returning();
    } else {
      savedAnalysis = await db.insert(analyses)
        .values({
          meetingId,
          summary: result.summary,
          actionItems: result.actionItems,
          decisions: result.decisions,
          followUps: result.followUps,
        })
        .returning();
    }

    await db.delete(actionItems).where(eq(actionItems.meetingId, meetingId));

    if (result.actionItems.length > 0) {
      await db.insert(actionItems).values(
        result.actionItems.map((item) => ({
          meetingId,
          task: item.task,
          assignee: item.assignee,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          citations: item.citations,
          status: 'PENDING',
        }))
      );
    }

    return res.status(200).json({
      traceId: req.traceId,
      success: true,
      data: savedAnalysis[0],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
