# AI Approach

## Model
Groq — llama-3.3-70b-versatile

## Prompt Design
The system prompt establishes strict rules:
- Return only raw valid JSON, no markdown or explanation
- Every insight must cite at least one timestamp from the transcript
- Never invent attendees, tasks, or decisions not present in the transcript
- Assignees must be exact speaker names from the transcript
- Resolve relative dates (e.g. "next Friday") using today's date injected into the prompt
- Temperature set to 0.1 for consistent, deterministic output

## Citation Strategy
Every generated item (summary, actionItems, decisions, followUps) must include a `citations` array with at least one `{ timestamp }` object referencing the exact transcript segment it was derived from.

## Hallucination Prevention
Post-generation validation filters out any item with an empty citations array before saving to the database. This ensures no uncited content ever reaches the client.

```js
const hasValidCitations = (item) =>
  Array.isArray(item.citations) && item.citations.length > 0;

return {
  summary: parsed.summary.filter(hasValidCitations),
  actionItems: parsed.actionItems.filter(hasValidCitations),
  decisions: parsed.decisions.filter(hasValidCitations),
  followUps: parsed.followUps.filter(hasValidCitations),
};
```

## Output Validation
- JSON parse wrapped in try/catch
- Markdown fences stripped before parsing
- Each field validated to be an array before filtering

## Known Limitations
- Relative dates depend on the current date being correctly injected into the prompt
- Very short transcripts may produce minimal or no follow-ups
- LLM may occasionally miss implicit decisions not explicitly stated