# Technical Decisions

## 1. Database — PostgreSQL with Drizzle ORM

**Chosen:** PostgreSQL + Drizzle ORM  
**Alternatives considered:** MongoDB, SQLite  
**Why:** Meetings have clear relational structure — mmetings have their id as a primary key which act as a foreign key for action Items and various such connections like actionItems and reminders so for it I thought SQL would be best. Drizzle provides type-safe queries  compared to Prisma.  
**Trade-offs:** More setup than MongoDB, but relational data fits the domain perfectly.

## 2. Authentication — JWT

**Chosen:** JWT (JSON Web Tokens)  
**Alternatives considered:** Session-based authentication  
**Why:** Stateless — no session store needed. Works well for REST APIs. Easy to verify on every request without a DB lookup.  
**Trade-offs:** Tokens can't be invalidated before expiry without a blocklist, but acceptable for this use case.

## 3. External Integration — Discord Webhook

**Chosen:** Discord Webhook  
**Alternatives considered:** Resend (email), Telegram Bot API  
**Why:** Zero configuration, no account verification, free, instant setup. A single POST request delivers the reminder so for It I chose discord  
**Trade-offs:** Less formal than email but many open source orgs communicate through discord like aossie.

## 4. AI Provider — Groq (llama-3.3-70b-versatile)

**Chosen:** Groq  
**Alternatives considered:** OpenAI, Gemini  
**Why:** It's fast and has generous free tier llama-3.3-70b-versatile handles structured JSON output reliably.  
**Trade-offs:** Dependent on third-party availability, but acceptable for an assignment.

## 5. Project Structure — Module-based

**Chosen:** Feature-based modules (auth, meetings, actionItems, reminders)  
**Why:** Each module owns its routes, keeping concerns separated. Easy to navigate and maintain.  
**Trade-offs:** Slightly more files than a flat structure, but scales better.