/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedTaskPayload, BehaviorStat } from '../types';

/*
 * ============================================================================
 * EXPLICIT AI BOUNDARY ENFORCEMENT
 * ============================================================================
 * CRITICAL BOUNDARY: Gemini is called for exactly TWO narrow jobs:
 * (a) Parsing a typed/voice sentence into a structured task record {subject, description, due_date}.
 * (b) Turning behavior_stats into ONE short plain-language trend sentence.
 *
 * NEVER call Gemini to explain a concept, solve an academic problem, generate practice
 * questions, or hold any syllabus content. This application is a behavioral planning
 * companion, NOT an academic tutor.
 * ============================================================================
 */

export async function extractTaskWithGemini(
  text: string,
  referenceDate?: string
): Promise<ExtractedTaskPayload> {
  /*
   * CRITICAL BOUNDARY: Gemini is called ONLY to extract {subject, description, due_date}
   * as structured metadata. Never to solve, answer, or explain homework content.
   */
  try {
    const response = await fetch('/api/parse-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, referenceDate }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.extracted) {
        return data.extracted;
      }
    }
  } catch (error) {
    console.warn('Network error calling /api/parse-task, using client fallback:', error);
  }

  // Client-side heuristic fallback if server is unreachable
  return fallbackClientParser(text, referenceDate);
}

export async function narrateTrendWithGemini(
  stats: BehaviorStat[],
  studentName?: string
): Promise<string> {
  /*
   * CRITICAL BOUNDARY: Gemini is called ONLY to narrate factual empirical consistency
   * trends based on numbers. Never to provide tutoring advice or teach subject matter.
   */
  try {
    const response = await fetch('/api/trend-narration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats, studentName }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.sentence) {
        return data.sentence;
      }
    }
  } catch (error) {
    console.warn('Network error calling /api/trend-narration, using client fallback:', error);
  }

  return fallbackClientTrendNarration(stats);
}

// Client heuristic parser (ensures app works smoothly under any network constraint)
function fallbackClientParser(text: string, referenceDate?: string): ExtractedTaskPayload {
  const lower = text.toLowerCase();
  const subjects = [
    'Mathematics',
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
  for (const s of subjects) {
    if (lower.includes(s.toLowerCase()) || (s === 'Mathematics' && lower.includes('math'))) {
      detectedSubject = s;
      break;
    }
  }

  const baseDate = referenceDate ? new Date(referenceDate) : new Date();
  const targetDate = new Date(baseDate);

  if (lower.includes('tomorrow')) {
    targetDate.setDate(baseDate.getDate() + 1);
  } else if (lower.includes('day after tomorrow')) {
    targetDate.setDate(baseDate.getDate() + 2);
  } else {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let matched = false;
    for (let i = 0; i < 7; i++) {
      if (lower.includes(daysOfWeek[i])) {
        const curDay = baseDate.getDay();
        let diff = i - curDay;
        if (diff <= 0) diff += 7;
        targetDate.setDate(baseDate.getDate() + diff);
        matched = true;
        break;
      }
    }
    if (!matched) targetDate.setDate(baseDate.getDate() + 1);
  }

  const dueDate = targetDate.toISOString().split('T')[0];
  let cleanDesc = text
    .replace(/(?:due|by|for)\s+(?:tomorrow|today|friday|monday|tuesday|wednesday|thursday|saturday|sunday)/gi, '')
    .trim();
  if (cleanDesc.length < 3) {
    cleanDesc = `${detectedSubject} homework task`;
  }

  return {
    subject: detectedSubject,
    description: cleanDesc,
    due_date: dueDate,
    estimated_minutes: 30,
  };
}

function fallbackClientTrendNarration(stats: BehaviorStat[]): string {
  if (!stats || stats.length === 0) {
    return 'Log completed tasks to see your personal pace and consistency patterns.';
  }

  const sorted = [...stats].sort((a, b) => b.avg_lag_days - a.avg_lag_days);
  const highestLag = sorted[0];
  const mostConsistent = [...stats].sort((a, b) => b.completion_rate_7d - a.completion_rate_7d)[0];

  if (highestLag && mostConsistent && highestLag.subject !== mostConsistent.subject && highestLag.avg_lag_days > 0.5) {
    return `You're more consistent in ${mostConsistent.subject}, while ${highestLag.subject} shows a slight tendency to slip.`;
  }

  return `Your current completion consistency across subjects is averaging ${Math.round(
    stats.reduce((acc, s) => acc + s.completion_rate_7d, 0) / stats.length
  )}%.`;
}
