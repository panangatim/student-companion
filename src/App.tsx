/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  BookCheck,
  Calendar,
  Award,
  Trophy,
  BrainCircuit,
  MoreHorizontal,
  Plus,
  Play,
  Shield,
  Layers,
  Target,
  FileText,
  X,
} from 'lucide-react';
import {
  Student,
  Task,
  BehaviorStat,
  Reflection,
  TaskSource,
  Exam,
  StudySession,
  Goal,
  Habit,
} from './types';
import { PilotDataStore, migrateLegacyPlaintextPins } from './lib/supabase';
import { Header, PrimaryTab } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { DiaryView } from './components/DiaryView';
import { HomeworkView } from './components/HomeworkView';
import { LearningCalendarView } from './components/LearningCalendarView';
import { ExamCenterView } from './components/ExamCenterView';
import { ProgressDashboardView } from './components/ProgressDashboardView';
import { AiBuddyView } from './components/AiBuddyView';
import { WeeklyReviewView } from './components/WeeklyReviewView';
import { StudySessionModal } from './components/StudySessionModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { ParentViewModal } from './components/ParentViewModal';
import { SubjectsModal } from './components/SubjectsModal';
import { GoalsHabitsModal } from './components/GoalsHabitsModal';
import { LogTaskModal } from './components/LogTaskModal';
import { LoginModal } from './components/LoginModal';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(
    PilotDataStore.getCurrentStudent()
  );
  const [activeTab, setActiveTab] = useState<PrimaryTab>('home');
  const [buddyInitialPrompt, setBuddyInitialPrompt] = useState<string>('');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState<boolean>(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState<boolean>(false);
  const [isParentViewOpen, setIsParentViewOpen] = useState<boolean>(false);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState<boolean>(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState<boolean>(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState<boolean>(false);

  // Study Session prefill state
  const [studySessionSubject, setStudySessionSubject] = useState('Science');
  const [studySessionTopic, setStudySessionTopic] = useState('Concept Revision');

  // Student State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<BehaviorStat[]>([]);

  // Load student data
  const refreshData = async () => {
    let student = PilotDataStore.getCurrentStudent();
    if (!student) {
      const students = PilotDataStore.getStudents();
      student = students[0] || null;
    }
    setCurrentStudent(student);

    if (student) {
      setTasks(PilotDataStore.getTasks(student.id));
      setExams(PilotDataStore.getExams(student.id));
      setStudySessions(PilotDataStore.getStudySessions(student.id));
      setGoals(PilotDataStore.getGoals(student.id));
      setHabits(PilotDataStore.getHabits(student.id));
      setStats(PilotDataStore.computeBehaviorStats(student.id));

      // Asynchronously sync from Supabase cloud if connected
      const cloudTasks = await PilotDataStore.fetchTasksFromCloud(student.id);
      setTasks(cloudTasks);
      setStats(PilotDataStore.computeBehaviorStats(student.id));
    }
  };

  useEffect(() => {
    migrateLegacyPlaintextPins();
    refreshData();
  }, []);

  useEffect(() => {
    if (currentStudent) {
      refreshData();
    }
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
      title: taskData.description,
      description: taskData.description,
      assigned_date: new Date().toISOString().split('T')[0],
      due_date: taskData.due_date,
      status: 'pending',
      completed_at: null,
      source: taskData.source,
      estimated_minutes: taskData.estimated_minutes,
      priority: 'normal',
      entry_type: 'homework',
    });

    refreshData();
  };

  const handleToggleTaskStatus = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    PilotDataStore.updateTaskStatus(taskId, nextStatus);
    refreshData();
  };

  const handleDeleteTask = (taskId: string) => {
    PilotDataStore.deleteTask(taskId);
    refreshData();
  };

  // Exam actions
  const handleAddExam = (exam: Omit<Exam, 'id' | 'created_at'>) => {
    PilotDataStore.addExam(exam);
    refreshData();
  };

  const handleUpdateExam = (exam: Exam) => {
    PilotDataStore.updateExam(exam);
    refreshData();
  };

  const handleDeleteExam = (examId: string) => {
    PilotDataStore.deleteExam(examId);
    refreshData();
  };

  // Study session actions
  const handleStartStudySession = (subject: string, topic: string) => {
    setStudySessionSubject(subject);
    setStudySessionTopic(topic);
    setIsStudyModalOpen(true);
  };

  const handleSaveStudySession = (session: Omit<StudySession, 'id' | 'completed_at'>) => {
    if (!currentStudent) return;
    PilotDataStore.logStudySession({
      ...session,
      student_id: currentStudent.id,
    });
    refreshData();
  };

  // Goals & Habits actions
  const handleToggleGoal = (goalId: string) => {
    PilotDataStore.toggleGoal(goalId);
    refreshData();
  };

  const handleToggleHabit = (habitId: string) => {
    PilotDataStore.toggleHabit(habitId);
    refreshData();
  };

  // Ask Buddy quick prompt
  const handleAskBuddyPrompt = (promptText: string) => {
    setBuddyInitialPrompt(promptText);
    setActiveTab('buddy');
  };

  // Current streak
  const currentStreak =
    stats.length > 0 && stats[0].current_streak !== undefined ? stats[0].current_streak : 5;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 antialiased selection:bg-indigo-100 font-sans">
      {/* Top Header */}
      <Header
        currentStudent={currentStudent}
        currentStreak={currentStreak}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSwitchProfile={() => setIsProfileModalOpen(true)}
        onOpenNewProfile={() => setIsOnboardingModalOpen(true)}
        onOpenParentView={() => setIsParentViewOpen(true)}
        onOpenSubjects={() => setIsSubjectsModalOpen(true)}
        onOpenGoals={() => setIsGoalsModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-28 lg:pb-12">
        {currentStudent ? (
          <>
            {isWeeklyReviewOpen ? (
              <WeeklyReviewView
                student={currentStudent}
                tasks={tasks}
                exams={exams}
                studySessions={studySessions}
                onBack={() => setIsWeeklyReviewOpen(false)}
                onStartStudySession={handleStartStudySession}
              />
            ) : (
              <>
                {activeTab === 'home' && (
                  <HomeDashboard
                    student={currentStudent}
                    tasks={tasks}
                    exams={exams}
                    studySessions={studySessions}
                    currentStreak={currentStreak}
                    onToggleTask={handleToggleTaskStatus}
                    onOpenLogModal={() => setIsLogModalOpen(true)}
                    onStartStudySession={handleStartStudySession}
                    onNavigateTab={(tab: any) => setActiveTab(tab)}
                    onAskBuddyPrompt={handleAskBuddyPrompt}
                  />
                )}

                {activeTab === 'diary' && (
                  <DiaryView
                    studentId={currentStudent.id}
                    tasks={tasks}
                    onAddTask={(t) => {
                      PilotDataStore.addTask(t);
                      refreshData();
                    }}
                    onDeleteTask={handleDeleteTask}
                    onToggleStatus={handleToggleTaskStatus}
                  />
                )}

                {activeTab === 'homework' && (
                  <HomeworkView
                    tasks={tasks}
                    onToggleStatus={handleToggleTaskStatus}
                    onDeleteTask={handleDeleteTask}
                    onOpenLogModal={() => setIsLogModalOpen(true)}
                  />
                )}

                {activeTab === 'calendar' && (
                  <LearningCalendarView
                    tasks={tasks}
                    exams={exams}
                    studySessions={studySessions}
                    onToggleTask={handleToggleTaskStatus}
                  />
                )}

                {activeTab === 'exams' && (
                  <ExamCenterView
                    studentId={currentStudent.id}
                    exams={exams}
                    onAddExam={handleAddExam}
                    onUpdateExam={handleUpdateExam}
                    onDeleteExam={handleDeleteExam}
                    onStartStudySession={handleStartStudySession}
                  />
                )}

                {activeTab === 'progress' && (
                  <ProgressDashboardView
                    student={currentStudent}
                    tasks={tasks}
                    exams={exams}
                    studySessions={studySessions}
                    stats={stats}
                    currentStreak={currentStreak}
                    onOpenMonthlyReport={() => setIsMonthlyReportOpen(true)}
                    onOpenWeeklyReview={() => setIsWeeklyReviewOpen(true)}
                  />
                )}

                {activeTab === 'buddy' && (
                  <AiBuddyView
                    student={currentStudent}
                    tasks={tasks}
                    exams={exams}
                    initialPrompt={buddyInitialPrompt}
                    onStartStudySession={handleStartStudySession}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-indigo-200 space-y-4 my-8">
            <div className="text-4xl">🎒</div>
            <h2 className="text-2xl font-black text-slate-900 font-heading">
              Welcome to Study Buddy!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Set up your student profile to start tracking your daily school quests and learning progress.
            </p>
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-extrabold text-sm shadow-md hover:bg-indigo-700 transition-all"
            >
              Create My Profile 🚀
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-lg">
        <div className="flex items-center justify-around">
          {[
            { key: 'home', label: 'Home', icon: LayoutDashboard },
            { key: 'diary', label: 'Diary', icon: BookOpen },
            { key: 'homework', label: 'Tasks', icon: BookCheck },
            { key: 'calendar', label: 'Calendar', icon: Calendar },
            { key: 'buddy', label: 'Buddy 🤖', icon: BrainCircuit },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key && !isMobileMoreOpen;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsWeeklyReviewOpen(false);
                  setActiveTab(item.key as PrimaryTab);
                }}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all font-heading min-w-[50px] ${
                  isActive ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}

          {/* More Sheet Trigger on Mobile */}
          <button
            onClick={() => setIsMobileMoreOpen(true)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all font-heading min-w-[50px] ${
              isMobileMoreOpen ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </div>

      {/* Mobile "More" Drawer Modal */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-indigo-200 relative my-auto animate-star-pop space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 font-heading">More Features</h3>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setActiveTab('exams');
                }}
                className="p-3.5 rounded-2xl bg-purple-50 text-purple-900 text-left font-black text-xs space-y-1 hover:bg-purple-100"
              >
                <Award className="w-5 h-5 text-purple-600" />
                <span className="block font-heading">Exam Center 🎯</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setActiveTab('progress');
                }}
                className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 text-left font-black text-xs space-y-1 hover:bg-emerald-100"
              >
                <Trophy className="w-5 h-5 text-emerald-600" />
                <span className="block font-heading">My Progress 🏆</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsStudyModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-blue-50 text-blue-900 text-left font-black text-xs space-y-1 hover:bg-blue-100"
              >
                <Play className="w-5 h-5 text-blue-600" />
                <span className="block font-heading">Study Timer ⏱</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsGoalsModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-amber-50 text-amber-900 text-left font-black text-xs space-y-1 hover:bg-amber-100"
              >
                <Target className="w-5 h-5 text-amber-600" />
                <span className="block font-heading">Goals &amp; Habits 🔥</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsSubjectsModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-900 text-left font-black text-xs space-y-1 hover:bg-indigo-100"
              >
                <Layers className="w-5 h-5 text-indigo-600" />
                <span className="block font-heading">My Subjects 📚</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsParentViewOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-slate-100 text-slate-900 text-left font-black text-xs space-y-1 hover:bg-slate-200"
              >
                <Shield className="w-5 h-5 text-slate-600" />
                <span className="block font-heading">Parent View 🛡</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Dialogs */}
      {currentStudent && (
        <>
          <StudySessionModal
            isOpen={isStudyModalOpen}
            onClose={() => setIsStudyModalOpen(false)}
            initialSubject={studySessionSubject}
            initialTopic={studySessionTopic}
            onSaveSession={handleSaveStudySession}
          />

          <MonthlyReportModal
            isOpen={isMonthlyReportOpen}
            onClose={() => setIsMonthlyReportOpen(false)}
            student={currentStudent}
            tasks={tasks}
            exams={exams}
            studySessions={studySessions}
            currentStreak={currentStreak}
          />

          <ParentViewModal
            isOpen={isParentViewOpen}
            onClose={() => setIsParentViewOpen(false)}
            student={currentStudent}
            tasks={tasks}
            exams={exams}
            studySessions={studySessions}
            currentStreak={currentStreak}
          />

          <SubjectsModal
            isOpen={isSubjectsModalOpen}
            onClose={() => setIsSubjectsModalOpen(false)}
            tasks={tasks}
            exams={exams}
            studySessions={studySessions}
            onStartStudySession={handleStartStudySession}
          />

          <GoalsHabitsModal
            isOpen={isGoalsModalOpen}
            onClose={() => setIsGoalsModalOpen(false)}
            goals={goals}
            habits={habits}
            onToggleGoal={handleToggleGoal}
            onToggleHabit={handleToggleHabit}
          />

          <LogTaskModal
            isOpen={isLogModalOpen}
            onClose={() => setIsLogModalOpen(false)}
            onSaveTask={handleSaveNewTask}
            studentId={currentStudent.id}
          />
        </>
      )}

      <LoginModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSelectStudent={(s) => {
          setCurrentStudent(s);
          setIsProfileModalOpen(false);
        }}
        currentStudentId={currentStudent?.id}
        onOpenCreateNew={() => {
          setIsProfileModalOpen(false);
          setIsOnboardingModalOpen(true);
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        canCancel={Boolean(currentStudent)}
        onClose={() => setIsOnboardingModalOpen(false)}
        onComplete={(newStudent) => {
          setCurrentStudent(newStudent);
          setIsOnboardingModalOpen(false);
          refreshData();
        }}
      />
    </div>
  );
}
