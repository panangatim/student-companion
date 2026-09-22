/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  BrainCircuit,
  Send,
  Sparkles,
  Mic,
  MicOff,
  BookOpen,
  GraduationCap,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Award,
} from 'lucide-react';
import { Student, Task, Exam, ChatMessage } from '../types';

interface AiBuddyViewProps {
  student: Student;
  tasks: Task[];
  exams: Exam[];
  initialPrompt?: string;
  onStartStudySession: (subject: string, topic: string) => void;
}

export const AiBuddyView: React.FC<AiBuddyViewProps> = ({
  student,
  tasks,
  exams,
  initialPrompt,
  onStartStudySession,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_0',
      sender: 'buddy',
      text: `Hi ${student.name.split(' ')[0]}! 🚀 I'm Buddy, your personal AI school companion. Ask me what to study next, get concept explanations, or launch an interactive quiz!`,
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTutorMode, setIsTutorMode] = useState(false);
  const [tutorTopic, setTutorTopic] = useState('Photosynthesis');
  const [tutorStep, setTutorStep] = useState(1);
  const [tutorAnswer, setTutorAnswer] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/buddy-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          studentName: student.name.split(' ')[0],
          tasks,
          exams,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || "I'm right here with you! Let's check off another quest!";
        setMessages((prev) => [
          ...prev,
          {
            id: `buddy_${Date.now()}`,
            sender: 'buddy',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('Endpoint error');
      }
    } catch {
      // Offline fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `buddy_${Date.now()}`,
          sender: 'buddy',
          text: `You've got this, ${student.name.split(' ')[0]}! Starting with your pending homework quests is the quickest way to build study momentum today! 🌟`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Tutor mode step progress
  const handleTutorNext = async () => {
    setIsLoading(true);
    try {
      const nextStep = tutorStep + 1;
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: tutorTopic,
          step: nextStep,
          studentAnswer: tutorAnswer,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `tutor_${Date.now()}`,
            sender: 'buddy',
            text: `[Step ${nextStep}] ${data.text}`,
            timestamp: 'Tutor',
            mode: 'tutor',
            step: nextStep,
          },
        ]);
        setTutorStep(nextStep > 5 ? 1 : nextStep);
        setTutorAnswer('');
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider font-heading mb-1.5">
            <BrainCircuit className="w-3.5 h-3.5" />
            AI Companion &amp; Tutor
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Meet Buddy 🤖
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Your friendly companion who knows your pending quests, exams, and study streak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsTutorMode(!isTutorMode);
              if (!isTutorMode) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `tut_${Date.now()}`,
                    sender: 'buddy',
                    text: `🎓 Welcome to AI Tutor Mode! Let's master "${tutorTopic}" step-by-step: Understand → Example → Practice → Check → Improve!`,
                    timestamp: 'Tutor Mode',
                  },
                ]);
              }
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 font-heading ${
              isTutorMode
                ? 'bg-purple-600 text-white shadow-purple-200'
                : 'bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{isTutorMode ? 'Exit Tutor Mode' : 'AI Tutor Mode'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          'What should I study now?',
          'Help me prepare for Friday’s test',
          'What homework is pending?',
          'Explain photosynthesis',
          'Quiz me on Science',
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => handleSendMessage(chip)}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs font-bold text-slate-700 hover:text-indigo-900 whitespace-nowrap transition-all shadow-2xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isBuddy = m.sender === 'buddy';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-xl ${isBuddy ? '' : 'ml-auto flex-row-reverse'}`}
              >
                {isBuddy && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    🤖
                  </div>
                )}

                <div
                  className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm font-semibold leading-relaxed shadow-2xs ${
                    isBuddy
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-sm'
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <span
                    className={`block text-[10px] mt-1.5 font-bold ${
                      isBuddy ? 'text-slate-400' : 'text-indigo-200'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs font-extrabold text-slate-400 animate-pulse">
              <div className="w-8 h-8 rounded-2xl bg-indigo-100 flex items-center justify-center text-sm">
                🤖
              </div>
              <span>Buddy is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Tutor Flow Mini Controller if in Tutor Mode */}
        {isTutorMode && (
          <div className="bg-purple-50 p-3 border-t border-purple-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-purple-900">
                Tutor Flow: Step {tutorStep}/5
              </span>
              <input
                type="text"
                placeholder="Type your answer to Buddy's question..."
                value={tutorAnswer}
                onChange={(e) => setTutorAnswer(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-purple-200 text-xs bg-white focus:outline-none w-52 sm:w-64"
              />
            </div>
            <button
              onClick={handleTutorNext}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black"
            >
              Verify &amp; Next Step →
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Buddy a question or what to do next..."
            className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none bg-white text-xs sm:text-sm font-semibold"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 font-heading shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
