import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Flag, HelpCircle, ChevronLeft, ChevronRight, CheckCircle, 
  Sparkles, AlertCircle, Eye, EyeOff, LayoutGrid, X, RotateCcw,
  Volume2, VolumeX, ShieldAlert
} from 'lucide-react';
import { Quiz, QuestionAnswer, QuizAttempt } from '../types';

interface QuizPlayerProps {
  quiz: Quiz;
  onFinishQuiz: (attempt: QuizAttempt) => void;
  onExit: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onFinishQuiz,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string | number }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [key: string]: boolean }>({});
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isStudyMode, setIsStudyMode] = useState<boolean>(false);
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Time tracking
  const [secondsRemaining, setSecondsRemaining] = useState<number>(quiz.estimatedMinutes * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());
  const timePerQuestionRef = useRef<{ [key: string]: number }>({});

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;

  // Sound effects with Web Audio API synthesizer
  const playBeep = (isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      // ignore audio context failures
    }
  };

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Auto submit on timeout
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Track per-question time on change
  const recordQuestionTime = () => {
    const now = Date.now();
    const spent = Math.round((now - questionStartTimeRef.current) / 1000);
    const qId = currentQuestion.id;
    timePerQuestionRef.current[qId] = (timePerQuestionRef.current[qId] || 0) + spent;
    questionStartTimeRef.current = now;
  };

  const handleSelectOption = (indexOrVal: number | string) => {
    recordQuestionTime();
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: indexOrVal,
    }));
    playBeep(true);
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleNext = () => {
    recordQuestionTime();
    setShowHint(false);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowConfirmFinish(true);
    }
  };

  const handlePrev = () => {
    recordQuestionTime();
    setShowHint(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleJumpTo = (index: number) => {
    recordQuestionTime();
    setShowHint(false);
    setCurrentIndex(index);
    setShowPalette(false);
  };

  // Compile final attempt stats
  const handleSubmitQuiz = () => {
    recordQuestionTime();
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const topicStats: { [topic: string]: { correct: number; total: number } } = {};
    const bloomStats: { [bloom: string]: { correct: number; total: number } } = {};

    const answersList: QuestionAnswer[] = quiz.questions.map((q) => {
      const selected = userAnswers[q.id] !== undefined ? userAnswers[q.id] : null;
      let isCorrect = false;

      if (selected !== null) {
        if (typeof q.correctAnswer === 'number') {
          isCorrect = Number(selected) === q.correctAnswer;
        } else {
          isCorrect = String(selected).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        }
      }

      if (selected === null) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      // Aggregate topic breakdown
      const topic = q.subtopic || quiz.subject || 'Umum';
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total++;
      if (isCorrect) topicStats[topic].correct++;

      // Aggregate bloom breakdown
      const bloom = q.bloomLevel || 'Memahami (Understand)';
      if (!bloomStats[bloom]) bloomStats[bloom] = { correct: 0, total: 0 };
      bloomStats[bloom].total++;
      if (isCorrect) bloomStats[bloom].correct++;

      return {
        questionId: q.id,
        selectedAnswer: selected,
        isCorrect,
        timeSpentSeconds: timePerQuestionRef.current[q.id] || 15,
      };
    });

    const score = Math.round((correctCount / totalQuestions) * 100);

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      subject: quiz.subject,
      completedAt: new Date().toISOString(),
      score,
      totalQuestions,
      correctCount,
      incorrectCount,
      skippedCount,
      totalTimeSeconds: elapsedSeconds,
      answers: answersList,
      topicBreakdown: topicStats,
      bloomBreakdown: bloomStats,
    };

    onFinishQuiz(attempt);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6">
      {/* Top Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 mb-4 flex items-center justify-between gap-4">
        {/* Exit & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Keluar dari Kuis"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-heading font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
              {quiz.title}
            </h2>
            <p className="text-xs text-slate-500">{quiz.subject} • {quiz.targetLevel || 'SMA/SMK'}</p>
          </div>
        </div>

        {/* Timer, Palette, Sound */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Timer Display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs sm:text-sm font-bold text-slate-800 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>
              {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Question Palette Trigger */}
          <button
            id="btn-open-palette"
            onClick={() => setShowPalette(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Daftar Soal</span>
            <span className="text-[11px] bg-indigo-200/80 px-1.5 py-0.2 rounded-full">
              {answeredCount}/{totalQuestions}
            </span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-4">
        <div
          className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Question Metadata Row */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
              Soal {currentIndex + 1} dari {totalQuestions}
            </span>
            {currentQuestion.bloomLevel && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {currentQuestion.bloomLevel}
              </span>
            )}
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {currentQuestion.subtopic || 'Umum'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Study Mode Flashcard Switch */}
            <button
              onClick={() => setIsStudyMode(!isStudyMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isStudyMode ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isStudyMode ? 'Mode Belajar: ON' : 'Mode Belajar'}</span>
            </button>

            {/* Flag Button */}
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                flaggedQuestions[currentQuestion.id]
                  ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentQuestion.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{flaggedQuestions[currentQuestion.id] ? 'Ditandai' : 'Ragu-ragu'}</span>
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div className="my-6">
          <h3 className="font-heading font-semibold text-lg sm:text-xl text-slate-900 leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Question Options */}
        {currentQuestion.options && currentQuestion.options.length > 0 ? (
          <div className="space-y-3 my-6">
            {currentQuestion.options.map((optionText, optIdx) => {
              const isSelected = userAnswers[currentQuestion.id] === optIdx;
              const isCorrectInStudy = isStudyMode && optIdx === currentQuestion.correctAnswer;
              const isWrongInStudy = isStudyMode && isSelected && optIdx !== currentQuestion.correctAnswer;

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all text-sm sm:text-base font-medium ${
                    isCorrectInStudy
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                      : isWrongInStudy
                      ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                      : isSelected
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 font-semibold'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isCorrectInStudy
                        ? 'bg-emerald-600 text-white'
                        : isWrongInStudy
                        ? 'bg-rose-600 text-white'
                        : isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {optionLetters[optIdx] || optIdx + 1}
                  </span>
                  <span className="flex-1 mt-0.5 leading-normal">{optionText}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="my-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">Jawaban Anda:</label>
            <input
              type="text"
              placeholder="Tuliskan jawaban singkat Anda di sini..."
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleSelectOption(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        )}

        {/* Study Mode Immediate Explanation */}
        {isStudyMode && userAnswers[currentQuestion.id] !== undefined && (
          <div className="my-4 p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900">
            <p className="font-bold flex items-center gap-1.5 text-indigo-950 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pembahasan Mode Belajar:</span>
            </p>
            <p className="leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Hint Accordion */}
        {currentQuestion.hint && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {!showHint ? (
              <button
                onClick={() => setShowHint(true)}
                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Lihat Petunjuk Soal (Scaffolding Hint)</span>
              </button>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Petunjuk: </span>
                  {currentQuestion.hint}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        {currentIndex === totalQuestions - 1 ? (
          <button
            id="btn-finish-quiz"
            onClick={() => setShowConfirmFinish(true)}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Selesai & Kumpulkan</span>
          </button>
        ) : (
          <button
            id="btn-next-question"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Palette Modal */}
      {showPalette && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-slate-900 text-base">Navigasi Butir Soal</h3>
              <button
                onClick={() => setShowPalette(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-indigo-600" />
                <span>Terjawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-amber-400" />
                <span>Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md border border-slate-300 bg-white" />
                <span>Belum</span>
              </div>
            </div>

            {/* Grid Palette */}
            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
              {quiz.questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlagged = flaggedQuestions[q.id];
                const isCurrent = currentIndex === idx;

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpTo(idx)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'ring-2 ring-indigo-600 ring-offset-2'
                        : ''
                    } ${
                      isFlagged
                        ? 'bg-amber-400 text-slate-900 font-extrabold'
                        : isAnswered
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPalette(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Tutup Navigasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Submit */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="font-heading font-bold text-xl text-slate-900">Kumpulkan Jawaban?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Pastikan Anda telah memeriksa semua butir soal sebelum melihat hasil dan analisis performa.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[11px] text-emerald-700 font-semibold">Sudah Terjawab</p>
                <p className="text-xl font-bold text-emerald-900">{answeredCount} Soal</p>
              </div>
              <div className={`p-3 rounded-xl border ${unansweredCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-[11px] text-slate-600 font-semibold">Belum Dijawab</p>
                <p className="text-xl font-bold text-slate-800">{unansweredCount} Soal</p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="mb-6 p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900 text-left">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Masih ada {unansweredCount} butir soal yang belum Anda jawab. Butir yang kosong akan dianggap salah.</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cek Kembali
              </button>
              <button
                onClick={handleSubmitQuiz}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200"
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
