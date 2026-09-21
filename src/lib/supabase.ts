/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Student, Task, BehaviorStat, Reflection, CohortAggregateStats } from '../types';

// Detect environment variables for Supabase Cloud
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('https://')
);

// Optional live Supabase client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// REAL STUDENT DATA STORE (Persistent Local Storage + Live Supabase Cloud Sync)
// ============================================================================

const STORAGE_STUDENTS_KEY = 'study_buddy_students_v2';
const STORAGE_TASKS_KEY = 'study_buddy_tasks_v2';
const STORAGE_REFLECTIONS_KEY = 'study_buddy_reflections_v2';
const STORAGE_CURRENT_STUDENT_KEY = 'study_buddy_active_student_v2';

export class PilotDataStore {
  // --- Students Management ---
  public static getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_STUDENTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    }
    return [];
  }

  public static async fetchStudentsFromCloud(): Promise<Student[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          this.saveStudents(data as Student[]);
          return data as Student[];
        }
      } catch (e) {
        console.warn('Supabase fetch error, using local data:', e);
      }
    }
    return this.getStudents();
  }

  private static saveStudents(students: Student[]) {
    try {
      localStorage.setItem(STORAGE_STUDENTS_KEY, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students:', e);
    }
  }

  public static getCurrentStudent(): Student | null {
    const students = this.getStudents();
    if (students.length === 0) return null;

    try {
      const activeId = localStorage.getItem(STORAGE_CURRENT_STUDENT_KEY);
      if (activeId) {
        const found = students.find((s) => s.id === activeId);
        if (found) return found;
      }
    } catch (e) {}

    return students[0] || null;
  }

  public static setCurrentStudent(student: Student) {
    try {
      localStorage.setItem(STORAGE_CURRENT_STUDENT_KEY, student.id);
    } catch (e) {}
  }

  public static createStudent(data: {
    name: string;
    username: string;
    pin?: string;
    class: string;
    school?: string;
    avatar: string;
    favorite_subject?: string;
  }): Student {
    const students = this.getStudents();
    const newStudent: Student = {
      id: 'student_' + Math.random().toString(36).substring(2, 11),
      name: data.name.trim(),
      username:
        data.username.trim().toLowerCase() ||
        data.name.trim().toLowerCase().replace(/\s+/g, '_'),
      pin: data.pin?.trim() || '',
      class: data.class.trim(),
      school: data.school?.trim() || '',
      avatar: data.avatar || '🚀',
      favorite_subject: data.favorite_subject || 'General',
      stars: 10, // Starter bonus stars!
      created_at: new Date().toISOString(),
    };

    students.push(newStudent);
    this.saveStudents(students);
    this.setCurrentStudent(newStudent);

    // Sync to Supabase Cloud if configured
    if (supabase) {
      supabase
        .from('students')
        .insert(newStudent)
        .then(({ error }) => {
          if (error) console.warn('Supabase insert student error:', error.message);
        });
    }

    return newStudent;
  }

  public static updateStudent(updatedStudent: Student): void {
    const students = this.getStudents().map((s) =>
      s.id === updatedStudent.id ? updatedStudent : s
    );
    this.saveStudents(students);

    if (supabase) {
      supabase
        .from('students')
        .update(updatedStudent)
        .eq('id', updatedStudent.id)
        .then(({ error }) => {
          if (error) console.warn('Supabase update student error:', error.message);
        });
    }
  }

  public static addStars(studentId: string, count: number): number {
    const students = this.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) return 0;

    student.stars = (student.stars || 0) + count;
    this.saveStudents(students);

    if (supabase) {
      supabase
        .from('students')
        .update({ stars: student.stars })
        .eq('id', studentId)
        .then(({ error }) => {
          if (error) console.warn('Supabase update stars error:', error.message);
        });
    }

    return student.stars;
  }

  // --- Tasks Management ---
  private static getStoredTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_TASKS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse tasks:', e);
    }
    return [];
  }

  private static setStoredTasks(tasks: Task[]) {
    try {
      localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to set tasks:', e);
    }
  }

  public static getTasks(studentId: string): Task[] {
    const all = this.getStoredTasks();
    return all.filter((t) => t.student_id === studentId);
  }

  public static async fetchTasksFromCloud(studentId: string): Promise<Task[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('student_id', studentId)
          .order('due_date', { ascending: true });

        if (!error && data) {
          const currentAll = this.getStoredTasks().filter((t) => t.student_id !== studentId);
          const combined = [...data, ...currentAll];
          this.setStoredTasks(combined);
          return data as Task[];
        }
      } catch (e) {
        console.warn('Supabase fetch tasks error:', e);
      }
    }
    return this.getTasks(studentId);
  }

  public static addTask(task: Omit<Task, 'id'>): Task {
    const all = this.getStoredTasks();
    const newTask: Task = {
      ...task,
      id: 'task_' + Math.random().toString(36).substring(2, 10),
    };
    all.unshift(newTask);
    this.setStoredTasks(all);

    // Sync to Supabase
    if (supabase) {
      supabase
        .from('tasks')
        .insert(newTask)
        .then(({ error }) => {
          if (error) console.warn('Supabase insert task error:', error.message);
        });
    }

    return newTask;
  }

  public static deleteTask(taskId: string): boolean {
    const all = this.getStoredTasks();
    const filtered = all.filter((t) => t.id !== taskId);
    if (filtered.length !== all.length) {
      this.setStoredTasks(filtered);

      if (supabase) {
        supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .then(({ error }) => {
            if (error) console.warn('Supabase delete task error:', error.message);
          });
      }

      return true;
    }
    return false;
  }

  public static updateTaskStatus(
    taskId: string,
    status: 'done' | 'pending' | 'late'
  ): { task: Task | null; starsAwarded: number } {
    const all = this.getStoredTasks();
    const idx = all.findIndex((t) => t.id === taskId);
    if (idx === -1) return { task: null, starsAwarded: 0 };

    const wasDone = all[idx].status === 'done';
    const updated = { ...all[idx] };
    updated.status = status;

    let starsAwarded = 0;
    if (status === 'done') {
      updated.completed_at = new Date().toISOString();
      if (!wasDone) {
        // Award 15 stars for completing a quest!
        starsAwarded = 15;
        this.addStars(updated.student_id, starsAwarded);
      }
    } else {
      updated.completed_at = null;
    }

    all[idx] = updated;
    this.setStoredTasks(all);

    // Sync to Supabase
    if (supabase) {
      supabase
        .from('tasks')
        .update({
          status: updated.status,
          completed_at: updated.completed_at,
        })
        .eq('id', taskId)
        .then(({ error }) => {
          if (error) console.warn('Supabase update task error:', error.message);
        });
    }

    return { task: updated, starsAwarded };
  }

  // --- Real Dynamic Behavior Stats & Streak Computation ---
  public static computeBehaviorStats(studentId: string): BehaviorStat[] {
    const tasks = this.getTasks(studentId);
    if (tasks.length === 0) return [];

    const subjects = Array.from(new Set(tasks.map((t) => t.subject)));
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Calculate real streak from completed dates
    const completedDates = tasks
      .filter((t) => t.status === 'done' && t.completed_at)
      .map((t) => t.completed_at!.split('T')[0]);
    const uniqueDates = Array.from(new Set(completedDates)).sort().reverse();

    let streak = 0;
    const checkDate = new Date();
    const todayStr = checkDate.toISOString().split('T')[0];
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];

    // If completed today or yesterday, count streak
    if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
      let streakDate = new Date();
      if (!uniqueDates.includes(todayStr) && uniqueDates.includes(yesterdayStr)) {
        streakDate.setDate(streakDate.getDate() - 1);
      }
      while (true) {
        const dateStr = streakDate.toISOString().split('T')[0];
        if (uniqueDates.includes(dateStr)) {
          streak++;
          streakDate.setDate(streakDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (uniqueDates.length > 0) {
      streak = 0;
    }

    return subjects.map((subject) => {
      const subTasks = tasks.filter((t) => t.subject === subject);
      let totalLagDays = 0;
      let lagCount = 0;

      subTasks.forEach((t) => {
        const due = new Date(t.due_date);
        if (t.completed_at) {
          const comp = new Date(t.completed_at);
          const diffDays = Math.ceil((comp.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
          totalLagDays += Math.max(0, diffDays);
          lagCount++;
        } else if (t.status === 'late' || (t.status === 'pending' && due < now)) {
          const diffDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
          totalLagDays += Math.max(0, diffDays);
          lagCount++;
        }
      });

      const avg_lag_days = lagCount > 0 ? Number((totalLagDays / lagCount).toFixed(1)) : 0;

      // 7-day rate
      const assigned7d = subTasks.filter((t) => new Date(t.assigned_date) >= sevenDaysAgo);
      const done7d = assigned7d.filter((t) => t.status === 'done');
      const completion_rate_7d =
        assigned7d.length > 0 ? Math.round((done7d.length / assigned7d.length) * 100) : 100;

      // 30-day rate
      const assigned30d = subTasks.filter((t) => new Date(t.assigned_date) >= thirtyDaysAgo);
      const done30d = assigned30d.filter((t) => t.status === 'done');
      const completion_rate_30d =
        assigned30d.length > 0 ? Math.round((done30d.length / assigned30d.length) * 100) : 100;

      return {
        student_id: studentId,
        subject,
        avg_lag_days,
        completion_rate_7d,
        completion_rate_30d,
        current_streak: streak,
        total_completed_30d: done30d.length,
        total_assigned_30d: assigned30d.length,
        last_computed_at: new Date().toISOString(),
      };
    });
  }

  // --- Reflections Management ---
  private static getStoredReflections(): Reflection[] {
    try {
      const data = localStorage.getItem(STORAGE_REFLECTIONS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse reflections:', e);
    }
    return [];
  }

  private static setStoredReflections(refs: Reflection[]) {
    try {
      localStorage.setItem(STORAGE_REFLECTIONS_KEY, JSON.stringify(refs));
    } catch (e) {}
  }

  public static getReflections(studentId: string): Reflection[] {
    const all = this.getStoredReflections();
    return all.filter((r) => r.student_id === studentId);
  }

  public static async fetchReflectionsFromCloud(studentId: string): Promise<Reflection[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reflections')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const currentAll = this.getStoredReflections().filter((r) => r.student_id !== studentId);
          const combined = [...data, ...currentAll];
          this.setStoredReflections(combined);
          return data as Reflection[];
        }
      } catch (e) {
        console.warn('Supabase fetch reflections error:', e);
      }
    }
    return this.getReflections(studentId);
  }

  public static addReflection(
    ref: Omit<Reflection, 'id' | 'created_at'>
  ): Reflection {
    const all = this.getStoredReflections();
    const newRef: Reflection = {
      ...ref,
      id: 'ref_' + Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString(),
    };
    all.unshift(newRef);
    this.setStoredReflections(all);
    // Award 20 bonus stars for completing weekly self-reflection!
    this.addStars(ref.student_id, 20);

    if (supabase) {
      supabase
        .from('reflections')
        .insert(newRef)
        .then(({ error }) => {
          if (error) console.warn('Supabase insert reflection error:', error.message);
        });
    }

    return newRef;
  }

  // --- Aggregate Stats for Family / Classroom summary ---
  public static getCohortAggregateStats(): CohortAggregateStats {
    const students = this.getStudents();
    const allTasks = this.getStoredTasks();
    const completedTasks = allTasks.filter((t) => t.status === 'done');
    const voiceCount = allTasks.filter((t) => t.source === 'voice').length;
    const typedCount = allTasks.filter((t) => t.source === 'typed').length;
    const totalCount = allTasks.length || 1;

    const subjects = Array.from(
      new Set(allTasks.map((t) => t.subject).concat(['Math', 'Science', 'English']))
    );
    const subject_aggregates = subjects.map((sub) => {
      const subTasks = allTasks.filter((t) => t.subject === sub);
      const doneSub = subTasks.filter((t) => t.status === 'done');
      const compRate =
        subTasks.length > 0 ? Math.round((doneSub.length / subTasks.length) * 100) : 100;
      return {
        subject: sub,
        avg_lag_days: 0,
        completion_rate: compRate,
        tasks_count: subTasks.length,
      };
    });

    return {
      cohort_name: 'My Study Squad',
      total_students: students.length,
      active_students_7d: students.length,
      cohort_completion_rate_7d:
        allTasks.length > 0
          ? Math.round((completedTasks.length / allTasks.length) * 100)
          : 100,
      cohort_completion_rate_30d:
        allTasks.length > 0
          ? Math.round((completedTasks.length / allTasks.length) * 100)
          : 100,
      total_tasks_completed: completedTasks.length,
      voice_vs_typed_ratio: {
        voice_percentage: Math.round((voiceCount / totalCount) * 100) || 0,
        typed_percentage: Math.round((typedCount / totalCount) * 100) || 100,
      },
      subject_aggregates,
      streak_distribution: [
        { streak_range: '3+ days', student_count: students.length },
      ],
    };
  }

  // Reset/Clear local data
  public static resetAllData() {
    localStorage.removeItem(STORAGE_STUDENTS_KEY);
    localStorage.removeItem(STORAGE_TASKS_KEY);
    localStorage.removeItem(STORAGE_REFLECTIONS_KEY);
    localStorage.removeItem(STORAGE_CURRENT_STUDENT_KEY);
  }
}
