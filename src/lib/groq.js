import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const analyzeMeeting = async (transcript) => {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `Today's date is ${new Date().toISOString().split('T')[0]}.
Analyze this transcript and return exactly this JSON structure.
For dueDate, extract any mentioned deadlines and convert them to ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ).
Resolve relative dates like "next Friday" or "by Wednesday" based on today's date.
If no deadline is mentioned for a task, set dueDate to null.
You are a meeting analysis engine. Return ONLY raw valid JSON — no markdown, no backticks, no explanation.
STRICT RULES:
- Every insight must cite at least one timestamp that exists in the transcript
- Never invent attendees, tasks, or decisions not in the transcript
- Assignees must be exact speaker names from the transcript
- If something is unclear, omit it — never guess
- dueDate must be null unless explicitly mentioned in the transcript`,
      },
      {
        role: 'user',
        content: `Analyze this transcript and return exactly this JSON structure:
{
  "summary": [{ "text": "...", "citations": [{ "timestamp": "00:10" }] }],
  "actionItems": [{ "task": "...", "assignee": "...", "dueDate": null, "citations": [{ "timestamp": "..." }] }],
  "decisions": [{ "text": "...", "citations": [{ "timestamp": "..." }] }],
  "followUps": [{ "text": "...", "citations": [{ "timestamp": "..." }] }]
}

Transcript:
${JSON.stringify(transcript, null, 2)}`,
      },
    ],
  });

  const raw = completion.choices[0].message.content || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const hasValidCitations = (item) =>
    Array.isArray(item.citations) && item.citations.length > 0;

  return {
    summary: parsed.summary.filter(hasValidCitations),
    actionItems: parsed.actionItems.filter(hasValidCitations),
    decisions: parsed.decisions.filter(hasValidCitations),
    followUps: parsed.followUps.filter(hasValidCitations),
  };
};