/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskStatus = 'pending' | 'done' | 'late';
export type TaskSource = 'typed' | 'voice' | 'camera';
export type TaskPriority = 'low' | 'normal' | 'high';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type DiaryType = 'homework' | 'classwork' | 'teacher_note' | 'exam' | 'project' | 'event' | 'study';

export interface Student {
  id: string;
  name: string;
  username: string;
  pin?: string;
  class: string; // e.g. "Grade 6", "Class 6-B"
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
  title?: string;
  description: string;
  assigned_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  status: TaskStatus;
  completed_at?: string | null;
  source: TaskSource;
  estimated_minutes?: number;
  priority?: TaskPriority;
  difficulty?: TaskDifficulty;
  teacher_name?: string;
  notes?: string;
  entry_type?: DiaryType;
}

export interface ExamChapter {
  id: string;
  name: string;
  status: 'completed' | 'needs_revision' | 'not_started';
}

export interface Exam {
  id: string;
  student_id: string;
  title: string;
  subject: string;
  exam_date: string; // YYYY-MM-DD
  chapters: ExamChapter[];
  revision_notes?: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  student_id: string;
  subject: string;
  topic: string;
  duration_minutes: number;
  completed_at: string;
  mood_rating?: 'easy' | 'good' | 'difficult' | 'need_help';
  notes?: string;
}

export interface Goal {
  id: string;
  student_id: string;
  title: string;
  category: 'daily' | 'weekly' | 'monthly';
  target_value: number;
  current_value: number;
  unit: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  student_id: string;
  title: string;
  emoji: string;
  current_streak: number;
  completed_today: boolean;
  last_completed_date?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'buddy';
  text: string;
  timestamp: string;
  mode?: 'chat' | 'tutor' | 'quiz' | 'plan';
  step?: number;
  actionPayload?: any;
}

export interface BehaviorStat {
  student_id: string;
  subject: string;
  avg_lag_days: number;
  completion_rate_7d: number;
  completion_rate_30d: number;
  current_streak: number;
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
  mood?: string;
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
  priority?: TaskPriority;
  entry_type?: DiaryType;
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
