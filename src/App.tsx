/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Trophy,
  BookHeart,
  Plus,
} from 'lucide-react';
import { Student, Task, BehaviorStat, Reflection, TaskSource } from './types';
import { PilotDataStore } from './lib/supabase';
import { Header } from './components/Header';
import { TodaysPlanView } from './components/TodaysPlanView';
import { ProgressView } from './components/ProgressView';
import { WeeklyReflectionView } from './components/WeeklyReflectionView';
import { LogTaskModal } from './components/LogTaskModal';
import { LoginModal } from './components/LoginModal';
import { OnboardingModal } from './components/OnboardingModal';

type ActiveTab = 'plan' | 'progress' | 'reflection';

export default function App() {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(
    PilotDataStore.getCurrentStudent()
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('plan');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(
    !PilotDataStore.getCurrentStudent()
  );

  // Student State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<BehaviorStat[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);

  // Load student data (instant local load + background cloud sync)
  const refreshData = async () => {
    const student = PilotDataStore.getCurrentStudent();
    setCurrentStudent(student);

    if (student) {
      setTasks(PilotDataStore.getTasks(student.id));
      setStats(PilotDataStore.computeBehaviorStats(student.id));
      setReflections(PilotDataStore.getReflections(student.id));

      // Asynchronously sync from Supabase cloud if connected
      const cloudTasks = await PilotDataStore.fetchTasksFromCloud(student.id);
      const cloudRefs = await PilotDataStore.fetchReflectionsFromCloud(student.id);
      setTasks(cloudTasks);
      setStats(PilotDataStore.computeBehaviorStats(student.id));
      setReflections(cloudRefs);
    } else {
      // Check cloud for existing students
      const cloudStudents = await PilotDataStore.fetchStudentsFromCloud();
      if (cloudStudents.length > 0) {
        PilotDataStore.setCurrentStudent(cloudStudents[0]);
        setCurrentStudent(cloudStudents[0]);
      } else {
        setTasks([]);
        setStats([]);
        setReflections([]);
        setIsOnboardingModalOpen(true);
      }
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentStudent?.id]);

  // Task actions
  const handleSaveNewTask = (taskData: {
    subject: string;
    description: string;
    due_date: string;
    estimated_minutes: number;
    source: TaskSource;
  }) => {
    if (!currentStudent) return;

    PilotDataStore.addTask({
      student_id: currentStudent.id,
      subject: taskData.subject,
      description: taskData.description,
      assigned_date: new Date().toISOString().split('T')[0],
      due_date: taskData.due_date,
      status: 'pending',
      completed_at: null,
      source: taskData.source,
      estimated_minutes: taskData.estimated_minutes,
    });

    refreshData();
  };

  const handleToggleTaskStatus = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'pending' : 'done';
    PilotDataStore.updateTaskStatus(taskId, nextStatus);
    refreshData();
  };

  const handleDeleteTask = (taskId: string) => {
    PilotDataStore.deleteTask(taskId);
    refreshData();
  };

  const handleAddReflection = (refData: {
    student_id: string;
    week_start: string;
    prompt_answered: string;
    response_text: string;
    mood?: string;
    source: TaskSource;
  }) => {
    PilotDataStore.addReflection(refData);
    refreshData();
  };

  const handleStudentSwitch = (newStudent: Student) => {
    setCurrentStudent(newStudent);
  };

  const handleOnboardingComplete = (newStudent: Student) => {
    setCurrentStudent(newStudent);
    setIsOnboardingModalOpen(false);
    refreshData();
  };

  // Compute highest streak from stats
  const currentStreak =
    stats.length > 0 && stats[0].current_streak !== undefined
      ? stats[0].current_streak
      : 0;

  const pendingCount = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'late'
  ).length;

  return (
    <div className="min-h-screen flex flex-col antialiased selection:bg-amber-200">
      {/* Top Friendly Header */}
      <Header
        currentStudent={currentStudent}
        currentStreak={currentStreak}
        onOpenSwitchProfile={() => setIsProfileModalOpen(true)}
        onOpenNewProfile={() => setIsOnboardingModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-6 pb-28 sm:pb-12">
        {currentStudent ? (
          <>
            {/* Student Navigation Tabs */}
            <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 border-2 border-amber-100 shadow-2xs mb-4 sm:mb-6">
              <button
                id="tab-plan-btn"
                onClick={() => setActiveTab('plan')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold font-heading transition-all ${
                  activeTab === 'plan'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50/50'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="sm:hidden">Quests</span>
                <span className="hidden sm:inline">Today&apos;s Quests</span>
                {pendingCount > 0 && (
                  <span
                    className={`text-[10px] font-black px-1.5 sm:px-2 py-0.2 rounded-full shrink-0 ${
                      activeTab === 'plan'
                        ? 'bg-white text-orange-600'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                id="tab-progress-btn"
                onClick={() => setActiveTab('progress')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold font-heading transition-all ${
                  activeTab === 'progress'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50/50'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="sm:hidden">Trophies</span>
                <span className="hidden sm:inline">Trophies &amp; Stats</span>
              </button>

              <button
                id="tab-reflection-btn"
                onClick={() => setActiveTab('reflection')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold font-heading transition-all ${
                  activeTab === 'reflection'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50/50'
                }`}
              >
                <BookHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="sm:hidden">Journal</span>
                <span className="hidden sm:inline">Star Journal</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'plan' && (
              <TodaysPlanView
                tasks={tasks}
                stats={stats}
                currentStreak={currentStreak}
                onOpenLogModal={() => setIsLogModalOpen(true)}
                onToggleTaskStatus={handleToggleTaskStatus}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressView
                student={currentStudent}
                tasks={tasks}
                stats={stats}
                currentStreak={currentStreak}
              />
            )}

            {activeTab === 'reflection' && (
              <WeeklyReflectionView
                studentId={currentStudent.id}
                reflections={reflections}
                stats={stats}
                onAddReflection={handleAddReflection}
              />
            )}
          </>
        ) : (
          /* Empty No-Student Greeting State */
          <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-6 sm:p-10 border-2 border-dashed border-amber-200 text-center space-y-4 shadow-sm my-6 sm:my-8">
            <div className="text-4xl sm:text-5xl animate-gentle-bounce">🎒</div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 font-heading">
              Ready to create your Study Buddy profile?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Pick your fun avatar and enter your name to start tracking homework quests and earning stars!
            </p>
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Create My Profile 🚀</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile: Quick Log */}
      {currentStudent && (
        <div className="fixed bottom-4 right-4 sm:hidden z-20">
          <button
            id="mobile-floating-log-btn"
            onClick={() => setIsLogModalOpen(true)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xl flex items-center justify-center active:scale-90 transition-transform border-2 border-white text-2xl"
            title="Log new homework quest"
          >
            🎤
          </button>
        </div>
      )}

      {/* Modals */}
      {currentStudent && (
        <LogTaskModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          onSaveTask={handleSaveNewTask}
          studentId={currentStudent.id}
        />
      )}

      <LoginModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSelectStudent={handleStudentSwitch}
        currentStudentId={currentStudent?.id}
        onOpenCreateNew={() => setIsOnboardingModalOpen(true)}
        onStudentDeleted={refreshData}
      />

      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onComplete={handleOnboardingComplete}
        canCancel={Boolean(currentStudent)}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
    </div>
  );
}
