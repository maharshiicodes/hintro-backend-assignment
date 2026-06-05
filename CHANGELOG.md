# Changelog

## v1.0.0 — 2026-06-05

### Milestone 1 — Project Setup
- Initialized Node.js + Express project
- Configured Drizzle ORM with PostgreSQL
- Set up Zod validation, Winston logging, traceId middleware

### Milestone 2 — Authentication
- Implemented JWT-based auth
- Register and login endpoints
- bcrypt password hashing
- Auth middleware for protected routes

### Milestone 3 — Meeting Management
- Create, get, list meetings endpoints
- Pagination and filtering support (title, date range)
- Transcript stored as JSONB

### Milestone 4 — AI Analysis
- Groq integration with llama-3.3-70b-versatile
- Citation grounding for all AI outputs
- Hallucination prevention via post-generation filtering
- Auto-seeds action items after analysis

### Milestone 5 — Action Item Management
- CRUD endpoints for action items
- Status filtering, assignee filtering, meetingId filtering
- Overdue detection endpoint
- Status normalization (case-insensitive input)

### Milestone 6 — Reminder Scheduler
- node-cron background job
- Discord webhook integration
- Reminder history recorded in DB
- Structured logging for all cron activity

### Milestone 7 — Production
- Rate limiting added
- Helmet security headers
- Deployed to Railway
- Swagger documentation published