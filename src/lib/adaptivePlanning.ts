/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, BehaviorStat, AdaptivePlanItem } from '../types';

/**
 * ADAPTIVE PLANNING RULES (v1, rule-based, no ML)
 * Order today's plan by:
 * (1) Overdue items first
 * (2) Subjects with the highest avg_lag_days or lowest completion_rate_7d
 * (3) Items due soonest
 *
 * Capped to the student's declared available minutes for today (3–5 items max).
 * Each with an empowering, one-line behavioral reason.
 */
export function generateAdaptiveDailyPlan(
  tasks: Task[],
  stats: BehaviorStat[],
  availableMinutes: number = 60,
  referenceDateStr?: string
): {
  planItems: AdaptivePlanItem[];
  totalEstimatedMinutes: number;
  unplannedCount: number;
} {
  const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  // Map stats by subject for O(1) lookup
  const statsMap = new Map<string, BehaviorStat>();
  stats.forEach((s) => statsMap.set(s.subject.toLowerCase(), s));

  // Only examine pending / late tasks
  const activeTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'late');

  if (activeTasks.length === 0) {
    return { planItems: [], totalEstimatedMinutes: 0, unplannedCount: 0 };
  }

  // Score each task
  const scoredItems: AdaptivePlanItem[] = activeTasks.map((task) => {
    const taskDue = new Date(task.due_date);
    const diffTime = taskDue.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0 || task.status === 'late';
    const overdueDays = isOverdue ? Math.max(1, Math.abs(diffDays)) : 0;

    const stat = statsMap.get(task.subject.toLowerCase());
    const avgLag = stat?.avg_lag_days || 0;
    const completion7d = stat?.completion_rate_7d ?? 100;

    let score = 0;
    let reason = '';

    // (1) Overdue items first
    if (isOverdue) {
      score += 10000 + overdueDays * 100;
      reason = `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''} — clear this first to avoid backlog friction.`;
    } 
    // (2) Subjects with highest lag or lowest 7d completion
    else if (avgLag >= 1.5) {
      score += 5000 + avgLag * 200;
      reason = `${task.subject} first — your historical logs show this subject tends to slip by ~${avgLag} days.`;
    } else if (completion7d < 70) {
      score += 4000 + (100 - completion7d) * 10;
      reason = `${task.subject} focus — boost your 7-day consistency rate (currently ${Math.round(completion7d)}%).`;
    } 
    // (3) Items due soonest
    else if (diffDays === 0) {
      score += 3000;
      reason = `Due today — finishing this keeps your daily streak intact.`;
    } else if (diffDays === 1) {
      score += 2000;
      reason = `Due tomorrow — tackling this today gives you breathing room.`;
    } else if (diffDays === 2) {
      score += 1000;
      reason = `Due in 2 days — steady prep beats last-minute rush.`;
    } else {
      score += Math.max(0, 500 - diffDays * 20);
      reason = `${task.subject} progress — consistent daily pacing builds calm confidence.`;
    }

    // Add slight bonus if student has high streak in this subject for positive reinforcement
    if (completion7d >= 85 && !isOverdue && avgLag <= 0.5) {
      score += 150;
      reason = `${task.subject} momentum — you're ${Math.round(completion7d)}% consistent here, a quick win to start.`;
    }

    const estimatedMinutes = task.estimated_minutes || 30;

    return {
      task,
      reason,
      urgency_score: score,
      estimated_minutes: estimatedMinutes,
      is_overdue: isOverdue,
    };
  });

  // Sort descending by score
  scoredItems.sort((a, b) => b.urgency_score - a.urgency_score);

  // Apply time and item capping:
  // - 3 to 5 items max
  // - Respect declared available minutes (with a minimum of 1-3 items even if tight)
  const selected: AdaptivePlanItem[] = [];
  let currentMinutes = 0;

  for (const item of scoredItems) {
    if (selected.length >= 5) break;

    // Always include at least 1 item, and include up to available minutes (or up to 3 minimum if items exist)
    const fitsInTime = currentMinutes + item.estimated_minutes <= availableMinutes;
    const isUnderMinimum = selected.length < 3;

    if (fitsInTime || isUnderMinimum) {
      selected.push(item);
      currentMinutes += item.estimated_minutes;
    }
  }

  return {
    planItems: selected,
    totalEstimatedMinutes: currentMinutes,
    unplannedCount: Math.max(0, scoredItems.length - selected.length),
  };
}
