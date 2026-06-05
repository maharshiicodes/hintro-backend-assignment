/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, participants, meetingDate, transcript]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Sprint Planning
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [alice@example.com, bob@example.com]
 *               meetingDate:
 *                 type: string
 *                 example: 2026-06-04T10:00:00Z
 *               transcript:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                     speaker:
 *                       type: string
 *                     text:
 *                       type: string
 *     responses:
 *       201:
 *         description: Meeting created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: List all meetings with pagination and filters
 *     tags: [Meetings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         example: 2026-01-01T00:00:00Z
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         example: 2026-12-31T00:00:00Z
 *     responses:
 *       200:
 *         description: List of meetings with pagination
 */

/**
 * @swagger
 * /api/meetings/{id}:
 *   get:
 *     summary: Get a meeting by ID
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting data
 *       404:
 *         description: Meeting not found
 */

/**
 * @swagger
 * /api/meetings/{id}/analyze:
 *   post:
 *     summary: Analyze meeting transcript with AI
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI analysis with citations
 *       404:
 *         description: Meeting not found
 */
import { Router } from 'express';
import { eq, and, ilike, gte, lte, count} from 'drizzle-orm';
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
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      title: z.string().optional(),
      from: z.string().datetime({ offset: true }).optional(),
      to: z.string().datetime({ offset: true }).optional(),
    });

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        traceId: req.traceId,
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { page, limit, title, from, to } = parsed.data;
    const offset = (page - 1) * limit;

    const conditions = and(
      eq(meetings.userId, req.user.userId),
      title ? ilike(meetings.title, `%${title}%`) : undefined,
      from ? gte(meetings.meetingDate, new Date(from)) : undefined,
      to ? lte(meetings.meetingDate, new Date(to)) : undefined,
    );

    const [data, totalResult] = await Promise.all([
      db.select().from(meetings)
        .where(conditions)
        .orderBy(meetings.createdAt)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(meetings).where(conditions),
    ]);

    const total = Number(totalResult[0].count);

    return res.status(200).json({
      traceId: req.traceId,
      success: true,
      data: {
        meetings: data,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
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
