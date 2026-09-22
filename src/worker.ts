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

    // Health check
    if (url.pathname === '/api/health') {
      return jsonResponse({ status: 'ok', time: new Date().toISOString() });
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

    // 3. /api/buddy-chat
    if (url.pathname === '/api/buddy-chat' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const message = body.message || '';
        const studentName = body.studentName || 'Deeksha';
        const tasks = body.tasks || [];
        const exams = body.exams || [];

        const pending = tasks.filter((t: any) => t.status !== 'done');
        const nextExam = exams[0];

        const apiKey = env.GEMINI_API_KEY;
        if (apiKey) {
          try {
            const contextText = `Student: ${studentName}. Pending tasks: ${pending.map((t: any) => `${t.subject}: ${t.description} (due ${t.due_date})`).join('; ')}. Upcoming exams: ${exams.map((e: any) => `${e.title} on ${e.exam_date}`).join('; ')}.`;
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `You are Buddy, an encouraging, friendly AI Digital School Companion for student ${studentName}. Keep replies short (2-3 sentences max), warm, and actionable.\n${contextText}\nStudent says: "${message}"`,
                      },
                    ],
                  },
                ],
              }),
            });

            if (geminiRes.ok) {
              const data: any = await geminiRes.json();
              const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate) {
                return jsonResponse({ reply: candidate.trim(), source: 'gemini' });
              }
            }
          } catch (e) {
            console.warn('Gemini chat failed, using heuristic:', e);
          }
        }

        // Heuristic fallback
        const lower = message.toLowerCase();
        let reply = `I'm here to help, ${studentName}! What would you like to conquer today? 🚀`;

        if (lower.includes('what should i study') || lower.includes('what next')) {
          if (nextExam) {
            reply = `Your ${nextExam.title} is coming up on ${nextExam.exam_date}! I recommend a 20-minute focused revision session on ${nextExam.subject} today. 💡`;
          } else if (pending.length > 0) {
            reply = `You have ${pending.length} tasks on your planner today! Starting with ${pending[0].subject} (${pending[0].title || pending[0].description}) will give you quick momentum. 🎯`;
          } else {
            reply = `You're all caught up on homework quests! Fantastic job! Would you like to read for 20 minutes or review an upcoming topic? 🌟`;
          }
        } else if (lower.includes('photosynthesis')) {
          reply = `Photosynthesis is how green plants turn sunlight, water, and carbon dioxide into glucose (energy) and release oxygen! 🌿 Think of leaves like nature's solar powered kitchens. Want me to quiz you on this?`;
        } else if (lower.includes('fraction')) {
          reply = `A fraction is just a part of a whole! The top number (numerator) tells how many slices you have, and the bottom (denominator) tells how many equal slices the whole pizza was cut into! 🍕`;
        } else if (lower.includes('quiz')) {
          reply = `Pop quiz time! 🧠 Question: In plant photosynthesis, which green pigment captures sunlight inside the leaf? (Hint: starts with 'C'!)`;
        } else if (lower.includes('pending') || lower.includes('homework')) {
          reply = pending.length > 0
            ? `You have ${pending.length} pending homework quest${pending.length > 1 ? 's' : ''}: ${pending.slice(0, 3).map((t: any) => t.subject).join(', ')}. Let's check them off one by one!`
            : `All homework quests are complete! You are a star learner today! ⭐`;
        }

        return jsonResponse({ reply, source: 'heuristic_fallback' });
      } catch (err) {
        return jsonResponse({ error: 'Internal server error' }, 500);
      }
    }

    // 4. /api/ai-tutor
    if (url.pathname === '/api/ai-tutor' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const topic = body.topic || 'Photosynthesis';
        const step = body.step || 1; // 1: Understand, 2: Example, 3: Practice, 4: Check, 5: Improve
        const studentAnswer = body.studentAnswer || '';

        const apiKey = env.GEMINI_API_KEY;
        if (apiKey) {
          try {
            const prompt = `You are Buddy in AI Tutor Mode for a Grade 6 student.\nTopic: ${topic}\nCurrent Step: ${step} (1=Understand, 2=Example, 3=Practice question, 4=Check answer "${studentAnswer}", 5=Improve/Encourage).\nProvide a clear, engaging, child-friendly response appropriate for Step ${step}. Keep it under 60 words.`;
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            });
            if (geminiRes.ok) {
              const data: any = await geminiRes.json();
              const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate) {
                return jsonResponse({ text: candidate.trim(), source: 'gemini' });
              }
            }
          } catch (e) {
            console.warn('Gemini tutor error:', e);
          }
        }

        // Heuristic step responses
        const tutorSteps: Record<number, string> = {
          1: `Let's understand ${topic}! Plants use light energy from the sun to convert water and carbon dioxide into food (glucose) and give off clean oxygen for us to breathe! 🌿`,
          2: `Imagine baking bread: you need flour (CO2) and water, plus oven heat (sunlight). The leaf chloroplast is the oven that bakes glucose cookies for the plant! 🍪`,
          3: `Practice time! ✏️ Which gas do plants absorb from the air during photosynthesis, and which gas do they release?`,
          4: `Great attempt! Plants take in Carbon Dioxide (CO2) through tiny openings called stomata and release fresh Oxygen (O2) as a byproduct! 🌟`,
          5: `Awesome job learning ${topic}! You now know the core process of plant energy. Ready to try another concept or take a quick quiz? 🚀`,
        };

        return jsonResponse({ text: tutorSteps[step] || tutorSteps[1], source: 'heuristic_fallback' });
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
