/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;

app.use(express.json());

// Helper to get lazy Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ============================================================================
// AI USAGE ENDPOINT 1: Structured Task Extraction
// ============================================================================
/*
 * CRITICAL BOUNDARY: Gemini is called ONLY for parsing a typed/voice sentence
 * into a structured task record {subject, description, due_date, estimated_minutes}.
 * It NEVER answers academic questions, explains concepts, provides solutions,
 * or generates syllabus content. This boundary is strictly enforced.
 */
app.post('/api/parse-task', async (req, res) => {
  const { text, referenceDate } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text input is required' });
  }

  const todayStr = referenceDate || new Date().toISOString().split('T')[0];

  try {
    const ai = getGeminiClient();
    if (ai) {
      /*
       * CRITICAL BOUNDARY: Call Gemini STRICTLY to extract {subject, description, due_date}.
       * Do NOT ask or allow the model to teach or explain the assignment.
       */
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Input sentence from student: "${text}"
Current reference date: ${todayStr}`,
        config: {
          systemInstruction: `You are a strict homework metadata extraction engine for a school student planning app.
ABSOLUTE BOUNDARIES:
1. You ONLY extract:
   - "subject": School subject name (e.g., Mathematics, Science, English, Social Studies, Hindi, Computer Science, Biology, Chemistry, Physics, History). Default to 'General' if unidentifiable.
   - "description": A concise, clear summary of what was assigned (e.g., "Exercise 4.2 questions 1-5", "Read chapter 3", "Lab report on friction").
   - "due_date": The target due date in YYYY-MM-DD format based on the reference date. If words like "tomorrow", "Friday", "next Monday" are used, calculate the exact YYYY-MM-DD date. If no due date is stated, assume tomorrow.
   - "estimated_minutes": Estimated study/homework time in minutes (number, e.g. 20, 30, 45). Default to 30.
2. YOU MUST NEVER explain the subject matter, provide answers, solve the assignment, give tutoring tips, or generate practice questions.
3. Output MUST adhere strictly to the JSON schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
                description: 'The school subject of the assignment',
              },
              description: {
                type: Type.STRING,
                description: 'Concise description of the task',
              },
              due_date: {
                type: Type.STRING,
                description: 'Calculated due date in YYYY-MM-DD format',
              },
              estimated_minutes: {
                type: Type.INTEGER,
                description: 'Estimated minutes to complete (e.g. 20, 30, 45)',
              },
            },
            required: ['subject', 'description', 'due_date'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      if (parsed.subject && parsed.description && parsed.due_date) {
        return res.json({
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
  } catch (err) {
    console.warn('Gemini parse failed, falling back to heuristic parser:', err);
  }

  // Resilient heuristic extraction fallback (if offline or API key absent)
  const extracted = heuristicTaskParser(text, todayStr);
  return res.json({ extracted, source: 'heuristic_fallback' });
});

// ============================================================================
// AI USAGE ENDPOINT 2: Factual Behavioral Trend Narration
// ============================================================================
/*
 * CRITICAL BOUNDARY: Gemini is called ONLY for turning behavior_stats into ONE
 * short plain-language trend sentence (e.g., "You're more consistent in Maths,
 * Science still slips"). Factual trend narration only — NEVER advice framed as tutoring.
 */
app.post('/api/trend-narration', async (req, res) => {
  const { stats } = req.body;

  if (!Array.isArray(stats) || stats.length === 0) {
    return res.json({
      sentence: 'Keep logging your homework tasks to discover your personal consistency patterns.',
      source: 'default',
    });
  }

  try {
    const ai = getGeminiClient();
    if (ai) {
      /*
       * CRITICAL BOUNDARY: Strictly factual trend narration of student's past data.
       * NEVER provide academic advice, tutoring, syllabus guidance, or evaluate intelligence.
       */
      const statsSummary = stats
        .map(
          (s) =>
            `${s.subject}: 7-day completion ${s.completion_rate_7d}%, avg lag ${s.avg_lag_days} days`
        )
        .join('; ');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Student homework statistics: ${statsSummary}`,
        config: {
          systemInstruction: `You are a neutral behavioral trend narrator for a student homework tracking companion.
ABSOLUTE BOUNDARIES:
1. State EXACTLY ONE short, plain-language factual sentence summarizing their empirical consistency pattern.
   Example good outputs:
   - "You're more consistent in Maths, Science still tends to slip."
   - "Social Science tasks are completed on time, while English shows an average lag of two days."
   - "Your 7-day completion rate is highest in Mathematics this week."
2. NEVER give academic tutoring advice, never explain subject concepts, never tell them how to study or solve problems.
3. NEVER make moral judgments or emotional critiques. Keep it concise, factual, and encouraging through transparency.
4. Output MUST be plain text, max 20 words, exactly 1 sentence.`,
        },
      });

      const sentence = response.text?.trim()?.replace(/["\n]/g, '');
      if (sentence) {
        return res.json({ sentence, source: 'gemini' });
      }
    }
  } catch (err) {
    console.warn('Gemini trend narration failed, using heuristic fallback:', err);
  }

  // Resilient heuristic trend narration fallback
  const sentence = heuristicTrendNarration(stats);
  return res.json({ sentence, source: 'heuristic_fallback' });
});

// Heuristic fallback for task parsing (ensures 100% offline & zero-latency reliability)
function heuristicTaskParser(text: string, todayStr: string) {
  const lower = text.toLowerCase();
  const subjects = [
    'Mathematics',
    'Maths',
    'Science',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Social Science',
    'History',
    'Geography',
    'Computer Science',
    'Hindi',
    'Telugu',
  ];

  let detectedSubject = 'General';
  for (const sub of subjects) {
    if (lower.includes(sub.toLowerCase())) {
      detectedSubject = sub === 'Maths' ? 'Mathematics' : sub;
      break;
    }
  }

  // Detect due date
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
      targetDate.setDate(today.getDate() + 1); // default tomorrow
    }
  }

  const dueDateStr = targetDate.toISOString().split('T')[0];

  // Clean description
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

// Heuristic fallback for trend narration
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

// Vite middleware in dev or static serving in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Progress Compass running on http://0.0.0.0:${PORT}`);
  });
}

start();
