# Testing

## Test Scenarios

### Authentication
- Register with valid email and password → 201 success
- Register with duplicate email → 409 conflict
- Register with invalid email format → 400 validation error
- Login with correct credentials → 200 with JWT token
- Login with wrong password → 401 invalid credentials
- Access protected route without token → 401 unauthorized

### Meetings
- Create meeting with valid transcript → 201 success
- Create meeting with missing title → 400 validation error
- Create meeting with invalid participant email → 400 validation error
- List meetings with pagination → correct pagination metadata
- Filter meetings by title → returns matching results
- Filter meetings by date range → returns correct results
- Get meeting by ID belonging to another user → 404

### AI Analysis
- Analyze meeting with clear transcript → returns summary, actionItems, decisions, followUps with citations
- Every returned insight has at least one citation → verified
- Action items seeded to action_items table after analysis → verified
- Re-analyzing same meeting updates existing analysis → verified

### Action Items
- Create action item manually → 201 success
- Filter by status → returns correct items
- Filter by assignee → returns correct items
- Filter by meetingId → returns correct items
- Update status with lowercase value (e.g. "completed") → normalized and accepted
- Update status with invalid value → 400 validation error
- Get overdue items → returns items where dueDate < now and status != COMPLETED

### Reminder Scheduler
- Cron fires every minute in test mode → verified via logs
- Overdue item triggers Discord message → verified
- Reminder recorded in reminders table after send → verified
- Failed Discord send recorded as failed status → verified

## Edge Cases Considered
- Empty transcript array → validation error
- Transcript with no actionable items → empty arrays returned
- Action item with no dueDate → excluded from overdue detection
- Re-analyzing a meeting → upserts analysis, deletes and re-seeds action items

## Limitations
- No integration tests written
- AI output depends on LLM availability
- Discord webhook failures are caught and logged but not retried