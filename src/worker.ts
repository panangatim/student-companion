/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  GEMINI_API_KEY?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// JSON helper
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Heuristic fallback parser
function heuristicTaskParser(text: string, todayStr: string) {
  const lower = text.toLowerCase();
  const subjects = [
    { key: 'mathematics', name: 'Mathematics' },
    { key: 'maths', name: 'Mathematics' },
    { key: 'math', name: 'Mathematics' },
    { key: 'physics', name: 'Physics' },
    { key: 'chemistry', name: 'Chemistry' },
    { key: 'biology', name: 'Biology' },
    { key: 'science', name: 'Science' },
    { key: 'english', name: 'English' },
    { key: 'social studies', name: 'Social Studies' },
    { key: 'social science', name: 'Social Studies' },
    { key: 'social', name: 'Social Studies' },
    { key: 'history', name: 'History' },
    { key: 'geography', name: 'Geography' },
    { key: 'computer science', name: 'Computer Science' },
    { key: 'computer', name: 'Computer Science' },
    { key: 'hindi', name: 'Hindi' },
    { key: 'telugu', name: 'Telugu' },
  ];

  let detectedSubject = 'General';
  for (const sub of subjects) {
    if (lower.includes(sub.key)) {
      detectedSubject = sub.name;
      break;
    }
  }

  const today = new Date(todayStr);
  const targetDate = new Date(today);

  if (lower.includes('tomorrow')) {
    targetDate.setDate(today.getDate() + 1);
  } else if (lower.includes('day after tomorrow')) {
    targetDate.setDate(today.getDate() + 2);
  } else if (lower.includes('today') || lower.includes('tonight')) {
    // keep today
  } else {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let dayFound = false;
    for (let i = 0; i < 7; i++) {
      if (lower.includes(daysOfWeek[i])) {
        const currentDay = today.getDay();
        let diff = i - currentDay;
        if (diff <= 0) diff += 7;
        targetDate.setDate(today.getDate() + diff);
        dayFound = true;
        break;
      }
    }
    if (!dayFound) {
      targetDate.setDate(today.getDate() + 1);
    }
  }

  const dueDateStr = targetDate.toISOString().split('T')[0];

  let cleanDesc = text
    .replace(/(?:due|by|for)\s+(?:tomorrow|today|friday|monday|tuesday|wednesday|thursday|saturday|sunday)/gi, '')
    .trim();
  if (cleanDesc.length < 3) {
    cleanDesc = `${detectedSubject} assignment`;
  }

  return {
    subject: detectedSubject,
    description: cleanDesc,
    due_date: dueDateStr,
    estimated_minutes: 30,
  };
}

// Heuristic fallback trend narration
function heuristicTrendNarration(stats: any[]) {
  if (!stats || stats.length === 0) {
    return 'Track your daily homework completions to build your adaptive plan.';
  }

  const sortedByLag = [...stats].sort((a, b) => (b.avg_lag_days || 0) - (a.avg_lag_days || 0));
  const highestLag = sortedByLag[0];
  const lowestLag = sortedByLag[sortedByLag.length - 1];

  if (highestLag && lowestLag && highestLag.subject !== lowestLag.subject && highestLag.avg_lag_days > 0.5) {
    return `You're most consistent in ${lowestLag.subject}, while ${highestLag.subject} tasks tend to slip by ~${highestLag.avg_lag_days} days.`;
  }

  if (stats.every((s) => s.completion_rate_7d >= 80)) {
    return `Your overall completion consistency is strong across all subjects this week.`;
  }

  return `Notice your pace in ${highestLag?.subject || 'core subjects'} to keep your streak steady.`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. /api/parse-task
    if (url.pathname === '/api/parse-task' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const text = body.text;
        const referenceDate = body.referenceDate;

        if (!text || typeof text !== 'string') {
          return jsonResponse({ error: 'Text input is required' }, 400);
        }

        const todayStr = referenceDate || new Date().toISOString().split('T')[0];
        const apiKey = env.GEMINI_API_KEY;

        if (apiKey) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Extract homework metadata into JSON with keys "subject", "description", "due_date" (YYYY-MM-DD), and "estimated_minutes" (integer).\nReference date: ${todayStr}\nInput sentence: "${text}"`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (geminiRes.ok) {
              const geminiData: any = await geminiRes.json();
              const candidate = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate) {
                const parsed = JSON.parse(candidate);
                if (parsed.subject && parsed.description && parsed.due_date) {
                  return jsonResponse({
                    extracted: {
                      subject: parsed.subject,
                      description: parsed.description,
                      due_date: parsed.due_date,
                      estimated_minutes: parsed.estimated_minutes || 30,
                    },
                    source: 'gemini',
                  });
                }
              }
            }
          } catch (aiErr) {
            console.warn('Gemini cloud call failed, using fallback:', aiErr);
          }
        }

        // Return fallback with 200 OK
        const extracted = heuristicTaskParser(text, todayStr);
        return jsonResponse({ extracted, source: 'heuristic_fallback' });
      } catch (err) {
        return jsonResponse({ error: 'Internal server error' }, 500);
      }
    }

    // 2. /api/trend-narration
    if (url.pathname === '/api/trend-narration' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const stats = body.stats;
        const studentName = body.studentName || 'Student';

        if (!Array.isArray(stats) || stats.length === 0) {
          return jsonResponse({
            sentence: `Keep logging your homework tasks to discover your personal consistency patterns, ${studentName}!`,
            source: 'default',
          });
        }

        const apiKey = env.GEMINI_API_KEY;
        if (apiKey) {
          try {
            const statsSummary = stats
              .map(
                (s: any) =>
                  `${s.subject}: 7-day completion ${s.completion_rate_7d}%, avg lag ${s.avg_lag_days} days`
              )
              .join('; ');

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Student name: ${studentName}. Statistics: ${statsSummary}. State exactly ONE short (under 20 words) encouraging factual trend sentence summarizing their empirical consistency pattern. Do NOT teach or tutor.`,
                      },
                    ],
                  },
                ],
              }),
            });

            if (geminiRes.ok) {
              const geminiData: any = await geminiRes.json();
              const candidate = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate) {
                const sentence = candidate.trim().replace(/["\n]/g, '');
                return jsonResponse({ sentence, source: 'gemini' });
              }
            }
          } catch (aiErr) {
            console.warn('Gemini trend narration call failed, using fallback:', aiErr);
          }
        }

        const sentence = heuristicTrendNarration(stats);
        return jsonResponse({ sentence, source: 'heuristic_fallback' });
      } catch (err) {
        return jsonResponse({ error: 'Internal server error' }, 500);
      }
    }

    // Fallback to static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
