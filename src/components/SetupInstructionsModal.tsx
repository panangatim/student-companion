/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Database, Cloud, ShieldAlert, Terminal } from 'lucide-react';

interface SetupInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupInstructionsModal: React.FC<SetupInstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const sqlSchemaSnippet = `-- Run this in Supabase SQL Editor:
-- Found in /supabase/schema.sql of this repository

-- 1. Create tables: students, tasks, reflections
-- 2. Create behavior_stats VIEW and get_pilot_cohort_aggregates() function
-- 3. Enable Row Level Security (RLS) on all tables (scoped to auth.uid())
-- 4. Seed demo data for Edify School Tirupati pilot`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(
      `-- See supabase/schema.sql in the repo for the complete production SQL migration.`
    );
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 relative my-auto max-h-[90vh] overflow-y-auto">
        <button
          id="close-setup-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 mb-2">
            <Database className="w-3.5 h-3.5" /> Pilot Infrastructure Guide
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Supabase &amp; Cloudflare Pages Deployment
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Production setup for the Edify School Tirupati pilot (15–30 students).
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-700">
          {/* Section 1: Supabase Setup */}
          <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-700" />
                1. Supabase Postgres &amp; RLS Configuration
              </h3>
              <span className="text-[11px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                supabase/schema.sql
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              In your Supabase Dashboard, open the <strong>SQL Editor</strong> and execute the script inside{' '}
              <code className="font-mono text-teal-800">/supabase/schema.sql</code>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Creates <code className="font-mono">students</code>, <code className="font-mono">tasks</code>, and <code className="font-mono">reflections</code> tables.</li>
              <li>Enables <strong>Row Level Security (RLS)</strong> on every table so each student can only access their own rows.</li>
              <li>Configures the dynamic <code className="font-mono">behavior_stats</code> view for streak &amp; lag calculation.</li>
              <li>Installs <code className="font-mono">get_pilot_cohort_aggregates()</code> for anonymous teacher analytics.</li>
            </ul>
          </div>

          {/* Section 2: Cloudflare Pages Deploy */}
          <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-700" />
              2. Cloudflare Pages Git-Integration Deploy
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Connect this GitHub repository to Cloudflare Pages for automatic push-to-deploy:
            </p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] space-y-1">
              <div><strong>Framework Preset:</strong> Vite</div>
              <div><strong>Build Command:</strong> npm run build</div>
              <div><strong>Build Output Directory:</strong> dist</div>
              <div><strong>Root Directory:</strong> /</div>
            </div>
            <p className="text-slate-600">
              In Cloudflare Pages Settings &gt; <strong>Environment Variables</strong>, configure:
            </p>
            <div className="bg-white border border-slate-200 p-2.5 rounded-lg font-mono text-[11px] space-y-1">
              <div>GEMINI_API_KEY = &quot;your-gemini-api-key&quot;</div>
              <div>VITE_SUPABASE_URL = &quot;https://your-project.supabase.co&quot;</div>
              <div>VITE_SUPABASE_ANON_KEY = &quot;eyJhbGciOi...&quot;</div>
            </div>
          </div>

          {/* Section 3: Minors Data & School Consent Notice */}
          <div className="space-y-2 p-4 rounded-xl border border-amber-200 bg-amber-50/70">
            <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              3. Minor Data Privacy &amp; Consent Requirement
            </h3>
            <div className="text-amber-900 leading-relaxed space-y-1.5 text-xs">
              <p>
                <strong>Parental / School Consent:</strong> Because this pilot involves school students (minors) at Edify School Tirupati, parental and institutional consent must be formally obtained before issuing login usernames and PINs.
              </p>
              <p>
                <strong>No Third-Party Trackers:</strong> Zero advertising SDKs, behavioral cookies, or commercial analytics are included. All student rows are locked by Supabase RLS.
              </p>
              <p>
                <strong>Strict AI Guardrails:</strong> Gemini is strictly restricted to parsing homework timestamps and factual trend lines. It never acts as a tutor or syllabus instructor.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            id="close-setup-footer-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
