/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Shield,
  Users,
  CheckCircle,
  Clock,
  Mic,
  BarChart3,
  Lock,
  FileText,
  School,
} from 'lucide-react';
import { CohortAggregateStats } from '../types';

interface AdminCohortViewProps {
  cohortStats: CohortAggregateStats;
  onExitAdmin: () => void;
}

export const AdminCohortView: React.FC<AdminCohortViewProps> = ({
  cohortStats,
  onExitAdmin,
}) => {
  return (
    <div className="space-y-5">
      {/* Teacher / Pilot Evaluator Banner */}
      <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
              <Shield className="w-3.5 h-3.5" /> Pilot Evaluator View
            </span>
            <span className="text-xs text-amber-800 font-semibold">
              Read-Only Aggregates
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Edify School Tirupati — Cohort Metrics
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Anonymized cohort completion &amp; consistency trends for pilot evaluation (15–30 students).
          </p>
        </div>

        <button
          id="exit-admin-view-btn"
          onClick={onExitAdmin}
          className="self-start sm:self-center px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shrink-0 shadow-xs"
        >
          Return to Student View
        </button>
      </div>

      {/* STRICT PRIVACY ASSURANCE BADGE */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-900 font-semibold">
            Minor Data Privacy Guaranteed by RLS:
          </strong>{' '}
          Individual homework transcripts, personal reflections, student names, and student IDs are
          completely isolated by Postgres Row Level Security. Teachers and evaluators only receive
          cohort mathematical aggregates via the SQL function{' '}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono text-[11px]">
            get_pilot_cohort_aggregates()
          </code>
          .
        </div>
      </div>

      {/* OVERALL PILOT AGGREGATES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Pilot Cohort</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {cohortStats.total_students}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {cohortStats.active_students_7d} active in last 7d
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>7-Day Completion</span>
          </div>
          <div className="text-2xl font-bold text-teal-700">
            {cohortStats.cohort_completion_rate_7d}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            30-day avg: {cohortStats.cohort_completion_rate_30d}%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Tasks Completed</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {cohortStats.total_tasks_completed}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Total logged &amp; verified
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-amber-500" />
            <span>Voice Logging</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {cohortStats.voice_vs_typed_ratio.voice_percentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {cohortStats.voice_vs_typed_ratio.typed_percentage}% typed input
          </div>
        </div>
      </div>

      {/* COHORT SUBJECT LAG & COMPLETION DISTRIBUTION */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Cohort Subject Lag Patterns (Pilot Key Question)
          </h3>
          <p className="text-xs text-slate-500">
            Identifies systemic subject-level friction across the pilot group to guide teacher workload pacing.
          </p>
        </div>

        <div className="space-y-3">
          {cohortStats.subject_aggregates.map((sub) => {
            const isHighLag = sub.avg_lag_days >= 1.5;
            return (
              <div
                key={sub.subject}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{sub.subject}</span>
                    <span className="text-slate-500 font-medium">({sub.tasks_count} tasks tracked)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        isHighLag
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      Avg lag: {sub.avg_lag_days} days
                    </span>
                    <span className="font-bold text-slate-900">{sub.completion_rate}% rate</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sub.completion_rate >= 80 ? 'bg-teal-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${sub.completion_rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STREAK DISTRIBUTION ACROSS COHORT */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900">
          Cohort Behavioral Habit Formation (Streak Distribution)
        </h3>
        <p className="text-xs text-slate-500">
          Shows how consistently students engage in the daily plan → do → reflect cycle.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {cohortStats.streak_distribution.map((item) => (
            <div
              key={item.streak_range}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center"
            >
              <div className="text-xs font-semibold text-slate-500">{item.streak_range}</div>
              <div className="text-xl font-bold text-teal-800 mt-1">
                {item.student_count} students
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
