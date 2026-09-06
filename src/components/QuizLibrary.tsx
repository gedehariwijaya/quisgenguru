import React, { useState } from 'react';
import { 
  Search, Plus, Play, Edit3, Trash2, Copy, FileDown, 
  Download, BookOpen, Clock, Layers, Filter, Check, 
  Share2, Sparkles, AlertCircle, FileText, Cloud, LogIn
} from 'lucide-react';
import { Quiz, QuizAttempt } from '../types';
import { exportStudentQuizPDF, exportTeacherAnswerKeyPDF } from '../utils/pdfExport';
import { QuestionEditorModal } from './QuestionEditorModal';

interface QuizLibraryProps {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  onSelectQuiz: (quiz: Quiz) => void;
  onOpenExamScript?: (quiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
  onDuplicateQuiz: (quiz: Quiz) => void;
  onUpdateQuiz: (quiz: Quiz) => void;
  onCreateNew: () => void;
  institutionName: string;
  currentUser?: any;
  onLoginGoogle?: () => void;
}

export const QuizLibrary: React.FC<QuizLibraryProps> = ({
  quizzes,
  attempts,
  onSelectQuiz,
  onOpenExamScript,
  onDeleteQuiz,
  onDuplicateQuiz,
  onUpdateQuiz,
  onCreateNew,
  institutionName,
  currentUser,
  onLoginGoogle,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const subjects = Array.from(new Set(quizzes.map(q => q.subject).filter(Boolean)));

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = selectedSubject === 'all' || quiz.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  const handleCopyLink = (quiz: Quiz) => {
    const url = `${window.location.origin}?quiz=${quiz.id}`;
    navigator.clipboard.writeText(`Ayo kerjakan kuis "${quiz.title}" di QuizGen Guru!\n${url}`);
    setCopiedId(quiz.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & New Quiz Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Bank Soal & Perpustakaan Kuis</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Koleksi Kuis Tersimpan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola paket soal, edit butir pertanyaan, ekspor PDF ujian, dan mulai sesi pengerjaan.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kuis Baru (AI)</span>
        </button>
      </div>

      {/* Cloud Firestore Persistence Banner */}
      {currentUser ? (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>Tersimpan di Cloud Firestore</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Semua {quizzes.length} naskah soal Anda tersinkronisasi di akun Google <span className="font-bold">{currentUser.email}</span>.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-white/70 border border-emerald-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Aman & Permanen
          </span>
        </div>
      ) : (
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-indigo-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900">
                Amankan Bank Naskah Soal ke Cloud Firestore
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Hubungkan akun Google agar seluruh paket soal tidak pernah terhapus saat pembersihan browser cache.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLoginGoogle}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk Google Sekarang</span>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul kuis, topik, atau kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
          />
        </div>

        {subjects.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Mapel:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quiz Cards Grid */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz, idx) => {
            const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
            const bestScore = quizAttempts.length > 0 
              ? Math.max(...quizAttempts.map(a => a.score)) 
              : null;
            const isPdf = quiz.title.toLowerCase().includes('.pdf') || idx % 2 === 0;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top Section */}
                <div className="p-5 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/60">
                      {quiz.subject}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {quiz.targetLevel || 'SMA/SMK'}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {quiz.description || 'Paket soal evaluasi hasil dokumen otomatis.'}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-3 mt-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      {quiz.questions.length} Soal
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {quiz.estimatedMinutes} Menit
                    </span>
                    {bestScore !== null && (
                      <span className="flex items-center gap-1 font-bold text-emerald-600">
                        Skor: {Math.round(bestScore)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Edit */}
                    <button
                      onClick={() => setEditingQuiz(quiz)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white transition-colors"
                      title="Edit Butir Soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* PDF Soal */}
                    <button
                      onClick={() => exportStudentQuizPDF(quiz, institutionName)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold transition-colors flex items-center gap-1"
                      title="Unduh Lembar Ujian Siswa (PDF)"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>

                    {/* PDF Kunci */}
                    <button
                      onClick={() => exportTeacherAnswerKeyPDF(quiz, institutionName)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-white transition-colors"
                      title="Unduh Kunci Jawaban (PDF)"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => onDuplicateQuiz(quiz)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
                      title="Duplikasi Kuis"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Apakah Anda yakin ingin menghapus kuis "${quiz.title}"?`)) {
                          onDeleteQuiz(quiz.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                      title="Hapus Kuis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Buttons: Open Exam Script */}
                  <div className="flex items-center gap-1.5">
                    {onOpenExamScript && (
                      <button
                        onClick={() => onOpenExamScript(quiz)}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Buka Naskah</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-slate-900 text-base">Tidak Ada Kuis Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Unggah dokumen materi untuk mulai membuat kuis pertama Anda.'}
          </p>
          <button
            onClick={onCreateNew}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Kuis Sekarang</span>
          </button>
        </div>
      )}

      {/* Question Editor Modal */}
      {editingQuiz && (
        <QuestionEditorModal
          quiz={editingQuiz}
          isOpen={Boolean(editingQuiz)}
          onClose={() => setEditingQuiz(null)}
          onSaveQuiz={(updated) => {
            onUpdateQuiz(updated);
            setEditingQuiz(null);
          }}
        />
      )}
    </div>
  );
};
