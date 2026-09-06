import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Quiz, Question, QuestionType, DifficultyLevel } from '../types';

interface QuestionEditorModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onSaveQuiz: (updatedQuiz: Quiz) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onSaveQuiz,
}) => {
  const [questions, setQuestions] = useState<Question[]>(quiz.questions);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [title, setTitle] = useState<string>(quiz.title);
  const [subject, setSubject] = useState<string>(quiz.subject);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(quiz.estimatedMinutes);

  if (!isOpen) return null;

  const currentQ = questions[selectedQuestionIndex] || questions[0];

  const handleUpdateCurrentQuestion = (field: keyof Question, value: any) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[selectedQuestionIndex] = {
        ...copy[selectedQuestionIndex],
        [field]: value,
      };
      return copy;
    });
  };

  const handleUpdateOption = (optIndex: number, text: string) => {
    const opts = [...(currentQ.options || [])];
    opts[optIndex] = text;
    handleUpdateCurrentQuestion('options', opts);
  };

  const handleAddOption = () => {
    const opts = [...(currentQ.options || []), `Pilihan Baru ${(currentQ.options?.length || 0) + 1}`];
    handleUpdateCurrentQuestion('options', opts);
  };

  const handleRemoveOption = (optIndex: number) => {
    const opts = (currentQ.options || []).filter((_, i) => i !== optIndex);
    handleUpdateCurrentQuestion('options', opts);
    if (typeof currentQ.correctAnswer === 'number' && currentQ.correctAnswer >= opts.length) {
      handleUpdateCurrentQuestion('correctAnswer', Math.max(0, opts.length - 1));
    }
  };

  const handleAddNewQuestion = () => {
    const newQ: Question = {
      id: `q_custom_${Date.now()}`,
      question: 'Tulis pertanyaan baru di sini...',
      type: 'multiple_choice',
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctAnswer: 0,
      explanation: 'Tulis penjelasan kunci jawaban di sini.',
      difficulty: 'medium',
      bloomLevel: 'Memahami (Understand)',
      subtopic: subject || 'Umum',
      hint: 'Petunjuk pengerjaan.',
    };

    setQuestions([...questions, newQ]);
    setSelectedQuestionIndex(questions.length);
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, i) => i !== indexToDelete);
    setQuestions(updated);
    setSelectedQuestionIndex(Math.max(0, indexToDelete - 1));
  };

  const handleSave = () => {
    const updatedQuiz: Quiz = {
      ...quiz,
      title,
      subject,
      estimatedMinutes,
      questions,
      updatedAt: new Date().toISOString(),
    };
    onSaveQuiz(updatedQuiz);
    onClose();
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg">Editor Butir Soal Kuis</h3>
            <p className="text-xs text-slate-400">Sesuaikan pertanyaan, kunci jawaban, dan pembahasan</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz General Settings Strip */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Kuis</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Estimasi Waktu (Menit)</label>
            <input
              type="number"
              min={1}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value) || 5)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Main Editor Body: Left List + Right Form */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Questions List */}
          <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200 p-3 overflow-y-auto max-h-48 md:max-h-none flex md:flex-col gap-1.5">
            <div className="hidden md:flex items-center justify-between pb-2 mb-1 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Daftar Soal ({questions.length})
              </span>
              <button
                onClick={handleAddNewQuestion}
                className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 px-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            {questions.map((q, idx) => {
              const isSelected = selectedQuestionIndex === idx;
              return (
                <button
                  key={q.id || idx}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between gap-2 shrink-0 md:shrink ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span className="truncate flex-1">
                    {idx + 1}. {q.question || 'Tanpa teks'}
                  </span>
                  {questions.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(idx);
                      }}
                      className={`p-1 rounded hover:bg-black/20 ${isSelected ? 'text-white' : 'text-slate-400 hover:text-rose-600'}`}
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={handleAddNewQuestion}
              className="md:hidden p-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shrink-0"
            >
              + Tambah
            </button>
          </div>

          {/* Right Form: Edit Active Question */}
          {currentQ && (
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teks Pertanyaan (Soal {selectedQuestionIndex + 1})
                </label>
                <textarea
                  rows={3}
                  value={currentQ.question}
                  onChange={(e) => handleUpdateCurrentQuestion('question', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
              </div>

              {/* Options Editor */}
              {currentQ.options && currentQ.options.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Pilihan Jawaban (Klik bulatan untuk menandai Kunci Jawaban Benar)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Opsi</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const isCorrect = currentQ.correctAnswer === optIdx;
                      return (
                        <div key={optIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCurrentQuestion('correctAnswer', optIdx)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isCorrect
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Klik untuk jadikan kunci jawaban benar"
                          >
                            {optionLetters[optIdx] || optIdx + 1}
                          </button>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                            className={`flex-1 px-3 py-2 rounded-xl border text-xs ${
                              isCorrect
                                ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950 font-medium'
                                : 'border-slate-300 bg-white'
                            }`}
                          />

                          {currentQ.options!.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(optIdx)}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Metadata Row: Bloom & Difficulty & Subtopic */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Taksonomi Bloom</label>
                  <select
                    value={currentQ.bloomLevel || 'Memahami (Understand)'}
                    onChange={(e) => handleUpdateCurrentQuestion('bloomLevel', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="Mengingat (Remember)">Mengingat (Remember)</option>
                    <option value="Memahami (Understand)">Memahami (Understand)</option>
                    <option value="Menerapkan (Apply)">Menerapkan (Apply)</option>
                    <option value="Menganalisis (Analyze)">Menganalisis (Analyze)</option>
                    <option value="Mengevaluasi (Evaluate)">Mengevaluasi (Evaluate)</option>
                    <option value="Mencipta (Create)">Mencipta (Create)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Kesulitan</label>
                  <select
                    value={currentQ.difficulty || 'medium'}
                    onChange={(e: any) => handleUpdateCurrentQuestion('difficulty', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="easy">Mudah</option>
                    <option value="medium">Sedang</option>
                    <option value="hard">Sukar / HOTS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subtopik / Konsep</label>
                  <input
                    type="text"
                    value={currentQ.subtopic || ''}
                    onChange={(e) => handleUpdateCurrentQuestion('subtopic', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Explanation Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pembahasan Kunci Jawaban Lengkap
                </label>
                <textarea
                  rows={3}
                  value={currentQ.explanation}
                  onChange={(e) => handleUpdateCurrentQuestion('explanation', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
              </div>

              {/* Hint */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Petunjuk Soal (Scaffolding Hint)
                </label>
                <input
                  type="text"
                  value={currentQ.hint || ''}
                  onChange={(e) => handleUpdateCurrentQuestion('hint', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total {questions.length} butir pertanyaan tersimpan
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
