# Hintro Meeting Intelligence API

AI-powered meeting intelligence service that helps users manage meetings, extract actionable insights, and stay on top of follow-ups.

## Live Demo
- **API Base URL:** https://hintro-backend-assignment-production.up.railway.app
- **Swagger Docs:** https://hintro-backend-assignment-production.up.railway.app/api-docs
- **Health Check:** https://hintro-backend-assignment-production.up.railway.app/health

## Tech Stack
- Node.js + Express
- PostgreSQL + Drizzle ORM
- Groq AI (llama-3.3-70b-versatile)
- Discord Webhook
- node-cron
- Zod validation
- Winston logging
- JWT authentication

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Groq API key
- Discord Webhook URL

### Installation

```bash
git clone https://github.com/maharshiicodes/hintro-backend-assignment
cd hintro-backend-assignment
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
DISCORD_WEBHOOK_URL=your_discord_webhook_url
PORT=8080
NODE_ENV=development
BASE_URL=http://localhost:8080
```

### Run Locally

```bash
# Push database schema
npx drizzle-kit push --config=drizzle.config.js

# Start development server
npm run dev
```

### API Usage Examples

**Register:**
```bash
curl -X POST https://hintro-backend-assignment-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "secret123"}'
```

**Login:**
```bash
curl -X POST https://hintro-backend-assignment-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "secret123"}'
```

**Create Meeting:**
```bash
curl -X POST https://hintro-backend-assignment-production.up.railway.app/api/meetings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint Planning",
    "participants": ["alice@example.com", "bob@example.com"],
    "meetingDate": "2026-06-04T10:00:00Z",
    "transcript": [
      {"timestamp": "00:10", "speaker": "John", "text": "We should launch next Friday."},
      {"timestamp": "00:20", "speaker": "Alice", "text": "I will prepare release notes."}
    ]
  }'
```

**Analyze Meeting:**
```bash
curl -X POST https://hintro-backend-assignment-production.up.railway.app/api/meetings/MEETING_ID/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Overdue Action Items:**
```bash
curl https://hintro-backend-assignment-production.up.railway.app/api/action-items/overdue \
  -H "Authorization: Bearer YOUR_TOKEN"
```