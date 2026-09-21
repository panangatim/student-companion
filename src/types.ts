/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskStatus = 'pending' | 'done' | 'late';
export type TaskSource = 'typed' | 'voice';

export interface Student {
  id: string;
  name: string;
  username: string;
  pin?: string;
  class: string; // e.g. "Grade 5", "Class 6-B"
  school?: string;
  avatar: string; // e.g. '🚀', '🦉', '🦁', '🦊', '🎨', '⚡', '🐼', '⭐'
  favorite_subject?: string;
  stars: number;
  created_at: string;
}

export interface Task {
  id: string;
  student_id: string;
  subject: string;
  description: string;
  assigned_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  status: TaskStatus;
  completed_at?: string | null;
  source: TaskSource;
  estimated_minutes?: number;
}

export interface BehaviorStat {
  student_id: string;
  subject: string;
  avg_lag_days: number; // positive = slips past due date, 0 or negative = on time / early
  completion_rate_7d: number; // percentage 0 - 100
  completion_rate_30d: number; // percentage 0 - 100
  current_streak: number; // days
  total_completed_30d?: number;
  total_assigned_30d?: number;
  last_computed_at: string;
}

export interface Reflection {
  id: string;
  student_id: string;
  week_start: string;
  prompt_answered: string;
  response_text: string;
  mood?: string; // e.g. '😄' | '🌟' | '💪' | '😅'
  source: TaskSource;
  created_at: string;
}

export interface AdaptivePlanItem {
  task: Task;
  reason: string;
  urgency_score: number;
  estimated_minutes: number;
  is_overdue: boolean;
}

export interface ExtractedTaskPayload {
  subject: string;
  description: string;
  due_date: string; // YYYY-MM-DD
  estimated_minutes?: number;
}

export interface CohortAggregateStats {
  cohort_name: string;
  total_students: number;
  active_students_7d: number;
  cohort_completion_rate_7d: number;
  cohort_completion_rate_30d: number;
  total_tasks_completed: number;
  voice_vs_typed_ratio: {
    voice_percentage: number;
    typed_percentage: number;
  };
  subject_aggregates: {
    subject: string;
    avg_lag_days: number;
    completion_rate: number;
    tasks_count: number;
  }[];
  streak_distribution: {
    streak_range: string;
    student_count: number;
  }[];
}
