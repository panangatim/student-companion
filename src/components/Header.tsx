/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Star,
  Flame,
  PlusCircle,
  ChevronDown,
  LayoutDashboard,
  BookOpen,
  BookCheck,
  Calendar,
  Award,
  Trophy,
  BrainCircuit,
  MoreHorizontal,
  Shield,
  Layers,
  Target,
} from 'lucide-react';
import { Student } from '../types';

export type PrimaryTab =
  | 'home'
  | 'diary'
  | 'homework'
  | 'calendar'
  | 'exams'
  | 'progress'
  | 'buddy';

interface HeaderProps {
  currentStudent: Student | null;
  currentStreak: number;
  activeTab: PrimaryTab;
  onSelectTab: (tab: PrimaryTab) => void;
  onOpenSwitchProfile: () => void;
  onOpenNewProfile: () => void;
  onOpenParentView: () => void;
  onOpenSubjects: () => void;
  onOpenGoals: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStudent,
  currentStreak,
  activeTab,
  onSelectTab,
  onOpenSwitchProfile,
  onOpenNewProfile,
  onOpenParentView,
  onOpenSubjects,
  onOpenGoals,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const NAV_ITEMS: { key: PrimaryTab; label: string; icon: any }[] = [
    { key: 'home', label: 'Home', icon: LayoutDashboard },
    { key: 'diary', label: 'My Diary', icon: BookOpen },
    { key: 'homework', label: 'Homework', icon: BookCheck },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'exams', label: 'Exams', icon: Award },
    { key: 'progress', label: 'Progress', icon: Trophy },
    { key: 'buddy', label: 'Buddy 🤖', icon: BrainCircuit },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b-2 border-slate-100 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0 cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200 text-lg sm:text-xl group-hover:scale-105 transition-transform">
            🎒
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none font-heading">
                Study Buddy
              </h1>
              <span className="hidden xl:inline-flex items-center text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.2 rounded-full font-heading">
                AI SCHOOL COMPANION
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold truncate hidden sm:block">
              Plan · Learn · Complete · Reflect
            </p>
          </div>
        </div>

        {/* Desktop Primary Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/80">
          {NAV_ITEMS.map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.key;
            return (
              <button
                key={nav.key}
                onClick={() => onSelectTab(nav.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 font-heading ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-2xs scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{nav.label}</span>
              </button>
            );
          })}

          {/* More Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 flex items-center gap-1 font-heading"
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isMoreOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-40 space-y-1 animate-star-pop"
                onMouseLeave={() => setIsMoreOpen(false)}
              >
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenParentView();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Parent View</span>
                </button>
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenSubjects();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>My Subjects</span>
                </button>
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenGoals();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2"
                >
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Goals &amp; Habits</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right Section: Stars, Streak & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {currentStudent && (
            <>
              {/* Star Counter */}
              <div
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-900 shadow-2xs"
                title="Your earned learning stars!"
              >
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400" />
                <span className="text-xs sm:text-sm font-extrabold font-heading">
                  {currentStudent.stars || 0}
                </span>
                <span className="text-[10px] text-amber-700 hidden xl:inline font-bold">
                  stars
                </span>
              </div>

              {/* Streak Badge */}
              <div
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-200 text-orange-900 shadow-2xs"
                title={`${currentStreak} day study streak!`}
              >
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 fill-orange-400" />
                <span className="text-xs sm:text-sm font-extrabold font-heading">
                  {currentStreak}d
                </span>
              </div>

              {/* Active Profile Button */}
              <button
                id="header-profile-button"
                onClick={onOpenSwitchProfile}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all text-left group"
                title="Switch buddy or view profile"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center text-base sm:text-xl shadow-2xs group-hover:scale-105 transition-transform">
                  {currentStudent.avatar || '🚀'}
                </div>
                <div className="hidden md:block min-w-0 text-left">
                  <div className="text-xs font-black text-slate-800 truncate max-w-[90px]">
                    {currentStudent.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 truncate">
                    {currentStudent.class}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>
            </>
          )}

          {!currentStudent && (
            <button
              onClick={onOpenNewProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Profile</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
