/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Student,
  Task,
  BehaviorStat,
  Reflection,
  CohortAggregateStats,
  Exam,
  StudySession,
  Goal,
  Habit,
} from '../types';

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

export const STORAGE_STUDENTS_KEY = 'study_buddy_students_v2';
export const STORAGE_TASKS_KEY = 'study_buddy_tasks_v2';
export const STORAGE_REFLECTIONS_KEY = 'study_buddy_reflections_v2';
export const STORAGE_CURRENT_STUDENT_KEY = 'study_buddy_active_student_v2';
export const STORAGE_EXAMS_KEY = 'study_buddy_exams_v2';
export const STORAGE_STUDY_SESSIONS_KEY = 'study_buddy_study_sessions_v2';
export const STORAGE_GOALS_KEY = 'study_buddy_goals_v2';
export const STORAGE_HABITS_KEY = 'study_buddy_habits_v2';

/**
 * Hashes a 4-digit PIN string using SHA-256 via Web Crypto API
 */
export async function hashPin(pin: string): Promise<string> {
  if (!pin || pin.trim() === '') return '';
  const trimmed = pin.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(trimmed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies entered PIN against stored hash with backward compatibility for legacy plaintext PINs
 */
export async function verifyPin(enteredPin: string, storedPinOrHash?: string): Promise<boolean> {
  if (!storedPinOrHash || storedPinOrHash.trim() === '') return true;
  const trimmedEntered = enteredPin.trim();
  // Backward compatibility: match plaintext directly if not yet upgraded
  if (trimmedEntered === storedPinOrHash) return true;
  const hash = await hashPin(trimmedEntered);
  return hash === storedPinOrHash;
}

/**
 * Migrates any legacy plaintext PINs stored in localStorage to SHA-256 hashes
 */
export async function migrateLegacyPlaintextPins(): Promise<void> {
  try {
    const students = PilotDataStore.getStudents();
    let hasMigration = false;
    const updated = await Promise.all(
      students.map(async (s) => {
        // Plaintext PINs are typically 4 digits (< 32 chars), whereas SHA-256 hex is 64 chars
        if (s.pin && s.pin.length > 0 && s.pin.length < 32) {
          hasMigration = true;
          return { ...s, pin: await hashPin(s.pin) };
        }
        return s;
      })
    );
    if (hasMigration) {
      PilotDataStore.saveStudents(updated);
      console.log('Successfully upgraded legacy student PINs to SHA-256 hashes.');
    }
  } catch (e) {
    console.warn('Migration of legacy PINs skipped:', e);
  }
}

export class PilotDataStore {
  // --- Students Management ---
  public static getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_STUDENTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    }

    // Default Companion Student: Deeksha Panangati (ID / PIN: 2015)
    const deekshaStudent: Student = {
      id: 'student_deeksha_2015',
      name: 'Deeksha Panangati',
      username: 'deeksha',
      pin: '2015', // Automatically migrated to SHA-256 by migrateLegacyPlaintextPins
      class: 'Grade 6',
      school: 'Edify School',
      avatar: '🚀',
      favorite_subject: 'Science',
      stars: 45,
      created_at: new Date().toISOString(),
    };
    this.saveStudents([deekshaStudent]);
    this.setCurrentStudent(deekshaStudent);
    this.seedDeekshaInitialData('student_deeksha_2015');
    return [deekshaStudent];
  }

  public static seedDeekshaInitialData(studentId: string) {
    const existingTasks = this.getTasks(studentId);
    if (existingTasks.length > 0) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const friday = new Date(today);
    friday.setDate(today.getDate() + 3);
    const fridayStr = friday.toISOString().split('T')[0];

    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + 6);
    const nextMondayStr = nextMonday.toISOString().split('T')[0];

    const initialTasks: Task[] = [
      {
        id: 'task_1',
        student_id: studentId,
        subject: 'Mathematics',
        title: 'Maths Exercise 5.2',
        description: 'Maths exercise 5.2: Fractions & Decimals (Q1 - 10)',
        assigned_date: todayStr,
        due_date: todayStr,
        status: 'pending',
        priority: 'high',
        difficulty: 'medium',
        estimated_minutes: 30,
        source: 'typed',
        entry_type: 'homework',
        teacher_name: 'Mrs. Sharma',
      },
      {
        id: 'task_2',
        student_id: studentId,
        subject: 'Science',
        title: 'Read Science Chapter 4',
        description: 'Read Chapter 4: Plant Respiration and write key definitions',
        assigned_date: todayStr,
        due_date: todayStr,
        status: 'pending',
        priority: 'normal',
        difficulty: 'easy',
        estimated_minutes: 25,
        source: 'voice',
        entry_type: 'homework',
        teacher_name: 'Dr. Rao',
      },
      {
        id: 'task_3',
        student_id: studentId,
        subject: 'English',
        title: 'English Creative Story',
        description: 'Write a 250-word story about space exploration',
        assigned_date: todayStr,
        due_date: tomorrowStr,
        status: 'pending',
        priority: 'normal',
        difficulty: 'medium',
        estimated_minutes: 35,
        source: 'typed',
        entry_type: 'homework',
        teacher_name: 'Ms. Elizabeth',
      },
      {
        id: 'task_4',
        student_id: studentId,
        subject: 'Mathematics',
        title: '20-Minute Maths Speed Test',
        description: 'Practice 10 mental multiplication problems',
        assigned_date: todayStr,
        due_date: todayStr,
        status: 'done',
        completed_at: todayStr,
        priority: 'normal',
        difficulty: 'easy',
        estimated_minutes: 20,
        source: 'typed',
        entry_type: 'study',
      },
      {
        id: 'task_5',
        student_id: studentId,
        subject: 'General',
        title: 'Pack School Bag & Geometry Box',
        description: 'Organize notebooks and sharpen pencils for tomorrow',
        assigned_date: todayStr,
        due_date: todayStr,
        status: 'done',
        completed_at: todayStr,
        priority: 'low',
        difficulty: 'easy',
        estimated_minutes: 10,
        source: 'typed',
        entry_type: 'classwork',
      },
      {
        id: 'task_6',
        student_id: studentId,
        subject: 'Computer Science',
        title: 'Python Graphics Lab Assignment',
        description: 'Code a colorful spiral pattern in Python',
        assigned_date: todayStr,
        due_date: nextMondayStr,
        status: 'pending',
        priority: 'normal',
        difficulty: 'medium',
        estimated_minutes: 40,
        source: 'typed',
        entry_type: 'project',
      },
    ];
    this.setStoredTasks(initialTasks);

    // Initial Exams
    const initialExams: Exam[] = [
      {
        id: 'exam_1',
        student_id: studentId,
        title: 'Science Mid-Term Exam',
        subject: 'Science',
        exam_date: fridayStr,
        chapters: [
          { id: 'ch_4', name: 'Chapter 4: Plant Respiration', status: 'completed' },
          { id: 'ch_5', name: 'Chapter 5: Photosynthesis & Chloroplasts', status: 'needs_revision' },
          { id: 'ch_6', name: 'Chapter 6: Cell Organelles & Functions', status: 'not_started' },
        ],
        revision_notes: 'Focus heavily on the light vs dark cycle diagram for Chapter 5.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'exam_2',
        student_id: studentId,
        title: 'Maths Unit Assessment',
        subject: 'Mathematics',
        exam_date: nextMondayStr,
        chapters: [
          { id: 'mch_1', name: 'Fractions & Mixed Numbers', status: 'completed' },
          { id: 'mch_2', name: 'Decimals & Percentages', status: 'needs_revision' },
        ],
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_EXAMS_KEY, JSON.stringify(initialExams));

    // Initial Habits
    const initialHabits: Habit[] = [
      {
        id: 'hab_1',
        student_id: studentId,
        title: 'Read 20 minutes daily',
        emoji: '📖',
        current_streak: 5,
        completed_today: true,
        last_completed_date: todayStr,
      },
      {
        id: 'hab_2',
        student_id: studentId,
        title: 'Complete homework before 7 PM',
        emoji: '✏️',
        current_streak: 6,
        completed_today: false,
      },
      {
        id: 'hab_3',
        student_id: studentId,
        title: 'Practice 10 Maths questions',
        emoji: '🧠',
        current_streak: 4,
        completed_today: true,
        last_completed_date: todayStr,
      },
      {
        id: 'hab_4',
        student_id: studentId,
        title: 'Pack school bag night before',
        emoji: '🎒',
        current_streak: 7,
        completed_today: true,
        last_completed_date: todayStr,
      },
      {
        id: 'hab_5',
        student_id: studentId,
        title: 'Drink water during study',
        emoji: '💧',
        current_streak: 3,
        completed_today: false,
      },
    ];
    localStorage.setItem(STORAGE_HABITS_KEY, JSON.stringify(initialHabits));

    // Initial Goals
    const initialGoals: Goal[] = [
      {
        id: 'goal_1',
        student_id: studentId,
        title: 'Complete all homework on time',
        category: 'daily',
        target_value: 5,
        current_value: 3,
        unit: 'tasks',
        completed: false,
      },
      {
        id: 'goal_2',
        student_id: studentId,
        title: 'Study 4 hours this week',
        category: 'weekly',
        target_value: 240,
        current_value: 220,
        unit: 'mins',
        completed: false,
      },
      {
        id: 'goal_3',
        student_id: studentId,
        title: 'Master Science Chapters 4 to 6',
        category: 'monthly',
        target_value: 3,
        current_value: 1,
        unit: 'chapters',
        completed: false,
      },
    ];
    localStorage.setItem(STORAGE_GOALS_KEY, JSON.stringify(initialGoals));

    // Initial Study Sessions
    const initialSessions: StudySession[] = [
      {
        id: 'sess_1',
        student_id: studentId,
        subject: 'Science',
        topic: 'Plant Respiration Review',
        duration_minutes: 25,
        completed_at: todayStr,
        mood_rating: 'good',
        notes: 'Understood stomata and gas exchange easily.',
      },
      {
        id: 'sess_2',
        student_id: studentId,
        subject: 'Mathematics',
        topic: 'Fractions Problem Solving',
        duration_minutes: 30,
        completed_at: todayStr,
        mood_rating: 'easy',
        notes: 'Practiced 8 textbook questions correctly.',
      },
      {
        id: 'sess_3',
        student_id: studentId,
        subject: 'English',
        topic: 'Grammar: Active vs Passive Voice',
        duration_minutes: 20,
        completed_at: todayStr,
        mood_rating: 'good',
      },
    ];
    localStorage.setItem(STORAGE_STUDY_SESSIONS_KEY, JSON.stringify(initialSessions));
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

  public static saveStudents(students: Student[]) {
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

  // --- Exams Management ---
  public static getExams(studentId: string): Exam[] {
    try {
      const data = localStorage.getItem(STORAGE_EXAMS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed.filter((e: Exam) => e.student_id === studentId);
      }
    } catch (e) {
      console.error('Failed to load exams:', e);
    }
    return [];
  }

  public static addExam(exam: Omit<Exam, 'id' | 'created_at'>): Exam {
    const exams = this.getAllExams();
    const newExam: Exam = {
      ...exam,
      id: 'exam_' + Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString(),
    };
    exams.push(newExam);
    localStorage.setItem(STORAGE_EXAMS_KEY, JSON.stringify(exams));
    return newExam;
  }

  public static updateExam(updated: Exam): void {
    const exams = this.getAllExams().map((e) => (e.id === updated.id ? updated : e));
    localStorage.setItem(STORAGE_EXAMS_KEY, JSON.stringify(exams));
  }

  public static deleteExam(examId: string): void {
    const exams = this.getAllExams().filter((e) => e.id !== examId);
    localStorage.setItem(STORAGE_EXAMS_KEY, JSON.stringify(exams));
  }

  private static getAllExams(): Exam[] {
    try {
      const data = localStorage.getItem(STORAGE_EXAMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Study Sessions Management ---
  public static getStudySessions(studentId: string): StudySession[] {
    try {
      const data = localStorage.getItem(STORAGE_STUDY_SESSIONS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed.filter((s: StudySession) => s.student_id === studentId);
      }
    } catch (e) {
      console.error('Failed to load study sessions:', e);
    }
    return [];
  }

  public static logStudySession(session: Omit<StudySession, 'id' | 'completed_at'>): StudySession {
    const all = this.getAllStudySessions();
    const newSession: StudySession = {
      ...session,
      id: 'sess_' + Math.random().toString(36).substring(2, 10),
      completed_at: new Date().toISOString(),
    };
    all.unshift(newSession);
    localStorage.setItem(STORAGE_STUDY_SESSIONS_KEY, JSON.stringify(all));
    // Reward stars for focused study session!
    const starsEarned = Math.max(5, Math.round(session.duration_minutes / 2));
    this.addStars(session.student_id, starsEarned);
    return newSession;
  }

  private static getAllStudySessions(): StudySession[] {
    try {
      const data = localStorage.getItem(STORAGE_STUDY_SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Goals Management ---
  public static getGoals(studentId: string): Goal[] {
    try {
      const data = localStorage.getItem(STORAGE_GOALS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed.filter((g: Goal) => g.student_id === studentId);
      }
    } catch (e) {
      console.error('Failed to load goals:', e);
    }
    return [];
  }

  public static toggleGoal(goalId: string): void {
    const all = this.getAllGoals().map((g) =>
      g.id === goalId ? { ...g, completed: !g.completed } : g
    );
    localStorage.setItem(STORAGE_GOALS_KEY, JSON.stringify(all));
  }

  private static getAllGoals(): Goal[] {
    try {
      const data = localStorage.getItem(STORAGE_GOALS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Habits Management ---
  public static getHabits(studentId: string): Habit[] {
    try {
      const data = localStorage.getItem(STORAGE_HABITS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed.filter((h: Habit) => h.student_id === studentId);
      }
    } catch (e) {
      console.error('Failed to load habits:', e);
    }
    return [];
  }

  public static toggleHabit(habitId: string): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const all = this.getAllHabits().map((h) => {
      if (h.id === habitId) {
        const nextCompleted = !h.completed_today;
        return {
          ...h,
          completed_today: nextCompleted,
          current_streak: nextCompleted ? h.current_streak + 1 : Math.max(0, h.current_streak - 1),
          last_completed_date: nextCompleted ? todayStr : h.last_completed_date,
        };
      }
      return h;
    });
    localStorage.setItem(STORAGE_HABITS_KEY, JSON.stringify(all));
  }

  private static getAllHabits(): Habit[] {
    try {
      const data = localStorage.getItem(STORAGE_HABITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Reset/Clear local data
  public static resetAllData() {
    localStorage.removeItem(STORAGE_STUDENTS_KEY);
    localStorage.removeItem(STORAGE_TASKS_KEY);
    localStorage.removeItem(STORAGE_REFLECTIONS_KEY);
    localStorage.removeItem(STORAGE_CURRENT_STUDENT_KEY);
    localStorage.removeItem(STORAGE_EXAMS_KEY);
    localStorage.removeItem(STORAGE_STUDY_SESSIONS_KEY);
    localStorage.removeItem(STORAGE_GOALS_KEY);
    localStorage.removeItem(STORAGE_HABITS_KEY);
  }
}
