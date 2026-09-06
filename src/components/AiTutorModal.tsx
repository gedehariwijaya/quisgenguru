import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, MessageSquareQuote } from 'lucide-react';
import { Question } from '../types';

interface AiTutorModalProps {
  question: Question;
  selectedAnswer: string | number | null;
  isOpen: boolean;
  onClose: () => void;
  language?: 'id' | 'en';
}

export const AiTutorModal: React.FC<AiTutorModalProps> = ({
  question,
  selectedAnswer,
  isOpen,
  onClose,
  language = 'id',
}) => {
  const [userQuery, setUserQuery] = useState<string>('');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState<boolean>(false);

  if (!isOpen) return null;

  const fetchExplanation = async (customPrompt?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/quiz/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          options: question.options,
          selectedAnswer,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          userQuery: customPrompt || userQuery,
          language,
        }),
      });

      const data = await response.json();
      if (data.success && data.explanation) {
        setAiExplanation(data.explanation);
        setHasFetchedInitial(true);
      }
    } catch (e) {
      console.error('Failed to get AI Tutor explanation:', e);
      setAiExplanation('Maaf, tidak dapat terhubung ke Tutor AI saat ini. Silakan coba beberapa saat lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load on open if not loaded yet
  if (!hasFetchedInitial && !isLoading && !aiExplanation) {
    fetchExplanation('Tolong jelaskan konsep inti soal ini secara mendalam dengan analogi yang mudah dipahami.');
  }

  const quickPrompts = [
    'Berikan analogi dunia nyata untuk konsep ini',
    'Mengapa opsi jawaban lain salah secara rinci?',
    'Apa tips atau jembatan keledai untuk menghafal ini?',
    'Buatkan 1 contoh soal serupa untuk latihan',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base">Tutor Asesmen AI Gemini</h3>
              <p className="text-xs text-indigo-100">Bimbingan belajar personal & penjelasan konsep adaptif</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Question Summary */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <p className="font-bold text-slate-900 mb-1">Butir Soal:</p>
            <p className="italic">"{question.question}"</p>
          </div>

          {/* Quick Prompts */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pertanyaan Cepat:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUserQuery(qp);
                    fetchExplanation(qp);
                  }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors border border-indigo-100/80"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Box */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 min-h-[160px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-600">Tutor AI sedang merumuskan penjelasan...</p>
              </div>
            ) : aiExplanation ? (
              <div className="text-xs text-slate-800 space-y-2 whitespace-pre-line leading-relaxed font-sans">
                {aiExplanation}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Ketikkan pertanyaan atau klik salah satu topik cepat di atas.</p>
            )}
          </div>
        </div>

        {/* Query Input Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Tanyakan hal spesifik tentang konsep atau rumus ini..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userQuery.trim() && !isLoading) {
                fetchExplanation();
              }
            }}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          />
          <button
            onClick={() => fetchExplanation()}
            disabled={!userQuery.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </div>
      </div>
    </div>
  );
};
