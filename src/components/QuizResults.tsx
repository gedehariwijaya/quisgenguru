import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, RotateCcw, FileDown, Share2, Sparkles, CheckCircle2, 
  XCircle, Clock, Target, ArrowRight, Bot, Download, Filter, 
  HelpCircle, ChevronRight, BookOpen, Layers
} from 'lucide-react';
import { Quiz, QuizAttempt, Question } from '../types';
import { exportStudentQuizPDF, exportTeacherAnswerKeyPDF, exportStudentReportPDF } from '../utils/pdfExport';
import { ShareModal } from './ShareModal';
import { AiTutorModal } from './AiTutorModal';

interface QuizResultsProps {
  quiz: Quiz;
  attempt: QuizAttempt;
  userName: string;
  institutionName: string;
  onRetake: () => void;
  onNewQuiz: () => void;
  onRemedialQuizGenerated: (quiz: Quiz) => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  quiz,
  attempt,
  userName,
  institutionName,
  onRetake,
  onNewQuiz,
  onRemedialQuizGenerated,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [activeTutorQuestion, setActiveTutorQuestion] = useState<{ question: Question; selectedAnswer: any } | null>(null);
  const [isGeneratingRemedial, setIsGeneratingRemedial] = useState<boolean>(false);

  // Trigger celebratory confetti on score >= 70
  useEffect(() => {
    if (attempt.score >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [attempt.score]);

  const accuracy = Math.round((attempt.correctCount / attempt.totalQuestions) * 100);

  // Get wrong questions for remedial analysis
  const wrongQuestions = quiz.questions.filter((q) => {
    const ans = attempt.answers.find(a => a.questionId === q.id);
    return !ans?.isCorrect;
  });

  const weakTopics = Array.from(new Set(wrongQuestions.map(q => q.subtopic || quiz.subject)));

  // Generate Adaptive Remedial Quiz
  const handleGenerateRemedial = async () => {
    if (wrongQuestions.length === 0) return;
    setIsGeneratingRemedial(true);
    try {
      const response = await fetch('/api/quiz/generate-remedial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weakTopics,
          wrongQuestions,
          targetLevel: quiz.targetLevel || 'SMA / SMK',
          language: quiz.language || 'id',
        }),
      });

      const data = await response.json();
      if (data.success && data.quiz) {
        const remedialQuiz: Quiz = {
          id: `remedial_${Date.now()}`,
          title: data.quiz.title || `Kuis Remedial: ${quiz.title}`,
          description: data.quiz.description || 'Kuis penguatan konsep yang dirancang adaptif berdasarkan butir soal yang belum dikuasai.',
          subject: data.quiz.subject || quiz.subject,
          targetLevel: quiz.targetLevel,
          language: quiz.language,
          createdAt: new Date().toISOString(),
          sourceType: 'template',
          estimatedMinutes: Math.max(5, Math.ceil((data.quiz.questions?.length || 5) * 1.5)),
          tags: ['Remedial', 'Adaptif', quiz.subject],
          questions: data.quiz.questions.map((q: any, i: number) => ({
            id: q.id || `rq_${Date.now()}_${i + 1}`,
            question: q.question,
            type: q.type || 'multiple_choice',
            options: q.options || ['A', 'B', 'C', 'D'],
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            explanation: q.explanation || 'Pembahasan remedial.',
            difficulty: q.difficulty || 'easy',
            bloomLevel: q.bloomLevel || 'Memahami (Understand)',
            subtopic: q.subtopic || quiz.subject,
            hint: q.hint || 'Perhatikan konsep dasar.',
          })),
        };

        onRemedialQuizGenerated(remedialQuiz);
      }
    } catch (e) {
      console.error('Failed to generate remedial quiz:', e);
    } finally {
      setIsGeneratingRemedial(false);
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  // Filtered question list
  const filteredQuestions = quiz.questions.filter((q) => {
    const ans = attempt.answers.find(a => a.questionId === q.id);
    if (filterMode === 'wrong') return !ans?.isCorrect;
    if (filterMode === 'correct') return ans?.isCorrect;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Hero Score Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          {/* Left info */}
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Asesmen Selesai</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
              {quiz.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Peserta: <span className="text-white font-semibold">{userName}</span> • {quiz.subject} • Selesai pada {new Date(attempt.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Right big score circle */}
          <div className="flex flex-col items-center">
            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex flex-col items-center justify-center border-2 shadow-2xl transition-transform hover:scale-105 ${
              attempt.score >= 80
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                : attempt.score >= 60
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                : 'bg-rose-500/20 border-rose-400/60 text-rose-300'
            }`}>
              <span className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight text-white">
                {Math.round(attempt.score)}
              </span>
              <span className="text-[11px] uppercase font-bold tracking-wider mt-1 opacity-90">
                Skor Akhir
              </span>
            </div>
            <span className="mt-2 text-xs font-bold px-3 py-0.5 rounded-full bg-white/10 text-slate-200">
              {attempt.score >= 90 ? '🏆 Master Sempurna' : attempt.score >= 75 ? '🎯 Sangat Mahir' : attempt.score >= 60 ? '📚 Cukup Baik' : '💪 Perlu Remedial'}
            </span>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Akurasi Jawaban</p>
            <p className="text-xl font-bold text-white mt-0.5">{accuracy}%</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Soal Benar</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{attempt.correctCount} / {attempt.totalQuestions}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Soal Salah</p>
            <p className="text-xl font-bold text-rose-400 mt-0.5">{attempt.incorrectCount + attempt.skippedCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">Waktu Pengerjaan</p>
            <p className="text-xl font-bold text-indigo-300 mt-0.5">
              {Math.floor(attempt.totalTimeSeconds / 60)}m {attempt.totalTimeSeconds % 60}s
            </p>
          </div>
        </div>
      </div>

      {/* Action Toolbar: PDF Exports & Social Share & Retake */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Share to Social Media */}
            <button
              id="btn-share-social-modal"
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Hasil Kuis</span>
            </button>

            {/* PDF Export Dropdown/Buttons */}
            <button
              onClick={() => exportStudentReportPDF(quiz, attempt, userName)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Unduh Laporan Analisis Skor PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Laporan PDF</span>
            </button>

            <button
              onClick={() => exportStudentQuizPDF(quiz, institutionName)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Unduh Lembar Ujian Siswa Printable PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Soal Ujian PDF</span>
            </button>

            <button
              onClick={() => exportTeacherAnswerKeyPDF(quiz, institutionName)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Unduh Kunci Jawaban & Pembahasan PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kunci Jawaban PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRetake}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ulangi Kuis</span>
            </button>

            <button
              onClick={onNewQuiz}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>Buat Kuis Lain</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Adaptive Remedial Callout if there are mistakes */}
        {wrongQuestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-950">
                  Tersedia Penguatan: {wrongQuestions.length} Butir Soal Terdeteksi Butuh Remedial
                </p>
                <p className="text-[11px] text-amber-800">
                  Topik yang perlu diperkuat: <span className="font-semibold">{weakTopics.join(', ')}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateRemedial}
              disabled={isGeneratingRemedial}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingRemedial ? 'Menyiapkan Soal...' : 'Buat Kuis Remedial AI (1-Klik)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {/* Review Header & Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900">Pembahasan & Evaluasi Jawaban</h2>
            <p className="text-xs text-slate-500">Tinjau setiap butir soal, kunci jawaban, dan minta bantuan Tutor AI.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({quiz.questions.length})
            </button>
            <button
              onClick={() => setFilterMode('wrong')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'wrong' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Salah ({attempt.incorrectCount + attempt.skippedCount})
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'correct' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Benar ({attempt.correctCount})
            </button>
          </div>
        </div>

        {/* Question Cards Review */}
        <div className="space-y-6">
          {filteredQuestions.map((q, idx) => {
            const originalIndex = quiz.questions.findIndex(item => item.id === q.id);
            const userAns = attempt.answers.find(a => a.questionId === q.id);
            const isCorrect = userAns?.isCorrect;
            const selectedVal = userAns?.selectedAnswer;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'bg-white border-slate-200'
                    : 'bg-rose-50/20 border-rose-200'
                }`}
              >
                {/* Header item */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {originalIndex + 1}
                    </span>
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      isCorrect ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{isCorrect ? 'Jawaban Benar' : 'Jawaban Kurang Tepat'}</span>
                    </span>
                    {q.bloomLevel && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100/60 hidden sm:inline-block">
                        {q.bloomLevel}
                      </span>
                    )}
                  </div>

                  {/* Ask AI Tutor Button */}
                  <button
                    onClick={() => setActiveTutorQuestion({ question: q, selectedAnswer: selectedVal })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors border border-indigo-100"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tanya Tutor AI</span>
                  </button>
                </div>

                {/* Question Prompt */}
                <p className="font-semibold text-slate-900 text-sm sm:text-base leading-relaxed mb-4">
                  {q.question}
                </p>

                {/* Choices breakdown */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt, optIdx) => {
                      const isUserChoice = selectedVal === optIdx;
                      const isCorrectChoice = q.correctAnswer === optIdx;

                      let rowClass = 'bg-slate-50 border-slate-200 text-slate-700';
                      if (isCorrectChoice) {
                        rowClass = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400/40';
                      } else if (isUserChoice && !isCorrectChoice) {
                        rowClass = 'bg-rose-50 border-rose-400 text-rose-950 font-semibold ring-1 ring-rose-400/40';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${rowClass}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                              isCorrectChoice
                                ? 'bg-emerald-600 text-white'
                                : isUserChoice
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {optionLetters[optIdx] || optIdx + 1}
                            </span>
                            <span>{opt}</span>
                          </div>

                          <div>
                            {isCorrectChoice && (
                              <span className="text-[10px] uppercase font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100/80">
                                Kunci Benar
                              </span>
                            )}
                            {isUserChoice && !isCorrectChoice && (
                              <span className="text-[10px] uppercase font-bold text-rose-700 px-2 py-0.5 rounded-full bg-rose-100/80">
                                Pilihan Anda
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation Card */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Pembahasan: </span>
                  <span className="leading-relaxed">{q.explanation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          quiz={quiz}
          attempt={attempt}
          userName={userName}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* AI Tutor Modal */}
      {activeTutorQuestion && (
        <AiTutorModal
          question={activeTutorQuestion.question}
          selectedAnswer={activeTutorQuestion.selectedAnswer}
          isOpen={Boolean(activeTutorQuestion)}
          onClose={() => setActiveTutorQuestion(null)}
          language={quiz.language || 'id'}
        />
      )}
    </div>
  );
};
