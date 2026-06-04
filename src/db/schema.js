import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', ['PENDING', 'IN_PROGRESS', 'COMPLETED']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const meetings = pgTable('meetings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  meetingDate: timestamp('meeting_date').notNull(),
  participants: text('participants').array().notNull(), 
  transcript: jsonb('transcript').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const actionItems = pgTable('action_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  meetingId: uuid('meeting_id')
    .notNull()
    .references(() => meetings.id, { onDelete: 'cascade' }),
  task: text('task').notNull(),
  assignee: text('assignee').notNull(),
  status: statusEnum('status').default('PENDING').notNull(),
  dueDate: timestamp('due_date'),
  citations: jsonb('citations').notNull(), 
});

export const analyses = pgTable('analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  meetingId: uuid('meeting_id')
    .notNull()
    .unique()
    .references(() => meetings.id, { onDelete: 'cascade' }),
  summary: jsonb('summary').notNull(),
  actionItems: jsonb('action_items').notNull(),  
  decisions: jsonb('decisions').notNull(),
  followUps: jsonb('follow_ups').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});