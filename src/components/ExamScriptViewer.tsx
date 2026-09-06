import React, { useState } from 'react';
import { 
  FileText, Copy, Check, Printer, Download, ArrowLeft, 
  Edit3, Image, Sparkles, BookOpen, Layers, CheckCircle2, 
  Clock, Award, HelpCircle, Eye, EyeOff, Share2, Plus,
  FileDown, ExternalLink, Sliders, ChevronDown, ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Quiz, Question, AssessmentFocus } from '../types';
import { exportStudentQuizPDF, exportTeacherAnswerKeyPDF } from '../utils/pdfExport';
import { QuestionEditorModal } from './QuestionEditorModal';

interface ExamScriptViewerProps {
  quiz: Quiz;
  userName?: string;
  institutionName?: string;
  onBackToGenerator: () => void;
  onUpdateQuiz: (updated: Quiz) => void;
}

export const ExamScriptViewer: React.FC<ExamScriptViewerProps> = ({
  quiz,
  userName = 'Bapak/Ibu Guru',
  institutionName = 'KEMENTERIAN PENDIDIKAN DAN KEBUDAYAAN',
  onBackToGenerator,
  onUpdateQuiz,
}) => {
  // Viewer View Mode
  const [viewMode, setViewMode] = useState<'student' | 'teacher' | 'visuals' | 'blueprint'>('student');
  
  // Copy state feedbacks
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedAllPrompts, setCopiedAllPrompts] = useState(false);

  // Edit Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Filter & Expand options
  const [showOnlyVisualQuestions, setShowOnlyVisualQuestions] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<{ [qId: string]: boolean }>({});

  const visualQuestions = quiz.questions.filter(q => q.needsVisual || Boolean(q.visualPrompt));
  const hotsCount = quiz.questions.filter(q => q.categoryType === 'HOTS' || (q.bloomLevel && (q.bloomLevel.includes('Analyze') || q.bloomLevel.includes('Evaluate') || q.bloomLevel.includes('Create')))).length;
  const tkaCount = quiz.questions.filter(q => q.categoryType === 'TKA').length;

  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  // Handle copying full text script for Word/Google Docs
  const handleCopyFullScript = () => {
    let scriptText = `===========================================================\n`;
    scriptText += `${(quiz.institutionName || institutionName).toUpperCase()}\n`;
    scriptText += `NASKAH SOAL ASESMEN: ${quiz.title.toUpperCase()}\n`;
    scriptText += `Mata Pelajaran: ${quiz.subject} | Fase / Kelas: ${quiz.fase || 'Fase E (Kelas 10)'} | Alokasi Waktu: ${quiz.estimatedMinutes} Menit\n`;
    scriptText += `Tingkat: ${quiz.targetLevel || 'SMA'} | Tipe: ${quiz.assessmentFocus || 'HOTS & TKA'} | Jumlah Soal: ${quiz.questions.length} Butir\n`;
    scriptText += `===========================================================\n\n`;
    scriptText += `PETUNJUK UMUM:\n`;
    scriptText += `1. Periksalah naskah soal dan kelengkapan butir pertanyaan sebelum mengerjakan.\n`;
    scriptText += `2. Berikan tanda silang (X) atau hitamkan bulatan pada salah satu pilihan jawaban yang paling benar.\n`;
    scriptText += `3. Dahulukan menjawab soal-soal yang Anda anggap mudah.\n\n`;
    scriptText += `------------------ LEMBAR PERTANYAAN ------------------\n\n`;

    quiz.questions.forEach((q, idx) => {
      scriptText += `Soal Nomor ${idx + 1} [${q.categoryType || 'HOTS'} - ${q.difficulty.toUpperCase()}]:\n`;
      if (q.stimulus) {
        scriptText += `[STIMULUS WACANA / KASUS]:\n"${q.stimulus}"\n\n`;
      }
      if (q.needsVisual || q.visualPrompt) {
        scriptText += `[GAMBAR / VISUAL ${q.visualType?.toUpperCase() || 'DIAGRAM'}]:\n`;
        scriptText += `Deskripsi Gambar: ${q.visualDescription || 'Gambar ilustrasi soal'}\n`;
        scriptText += `Prompt AI Image: "${q.visualPrompt || ''}"\n\n`;
      }
      scriptText += `${q.question}\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, optIdx) => {
          scriptText += `  ${optionLetters[optIdx]}. ${opt}\n`;
        });
      }
      scriptText += `\n`;
    });

    scriptText += `\n------------------ KUNCI JAWABAN & PEMBAHASAN ------------------\n\n`;
    quiz.questions.forEach((q, idx) => {
      const correctOptText = typeof q.correctAnswer === 'number' && q.options && q.options[q.correctAnswer]
        ? `${optionLetters[q.correctAnswer]}. ${q.options[q.correctAnswer]}`
        : `${q.correctAnswer}`;
      scriptText += `${idx + 1}. Kunci: ${correctOptText}\n`;
      scriptText += `   Level Kognitif: ${q.bloomLevel || 'C4 Menganalisis'} | Materi: ${q.subtopic || quiz.subject}\n`;
      scriptText += `   Pembahasan: ${q.explanation}\n\n`;
    });

    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Copy single visual prompt
  const handleCopyPrompt = (promptText: string, qId: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(qId);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  // Copy all visual prompts
  const handleCopyAllPrompts = () => {
    const allPromptsText = visualQuestions.map((q, idx) => {
      return `--- Soal #${quiz.questions.indexOf(q) + 1} (${q.visualType || 'Diagram'}) ---\nDeskripsi: ${q.visualDescription}\nPrompt AI: ${q.visualPrompt}\n`;
    }).join('\n');

    navigator.clipboard.writeText(allPromptsText);
    setCopiedAllPrompts(true);
    setTimeout(() => setCopiedAllPrompts(false), 2500);
  };

  // Handle direct browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header Bar (Hidden during print) */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToGenerator}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Kembali ke Generator"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                Naskah Soal Ujian
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                {quiz.targetLevel || 'SMA / SMK'}
              </span>
              {visualQuestions.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  {visualQuestions.length} Prompt Gambar
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {quiz.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Copy Script for Word */}
          <button
            onClick={handleCopyFullScript}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Salin Seluruh Naskah Format Word / Google Docs"
          >
            {copiedScript ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copiedScript ? 'Tersalin ke Clipboard!' : 'Salin Naskah (Word)'}</span>
          </button>

          {/* Export Student PDF */}
          <button
            onClick={() => exportStudentQuizPDF(quiz, quiz.institutionName || institutionName)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            title="Unduh Lembar Soal Ujian Siswa (PDF)"
          >
            <Download className="w-4 h-4" />
            <span>PDF Soal</span>
          </button>

          {/* Export Teacher Key PDF */}
          <button
            onClick={() => exportTeacherAnswerKeyPDF(quiz, quiz.institutionName || institutionName)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            title="Unduh Kunci Jawaban & Pembahasan (PDF)"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF Kunci</span>
          </button>

          {/* Browser Print */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            title="Cetak Naskah Langsung (Print Browser)"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Edit Questions Modal */}
          <button
            onClick={() => setIsEditorOpen(true)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-indigo-600 transition-colors"
            title="Edit Butir Soal"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Nav Tabs (Hidden during print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setViewMode('student')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'student'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Lembar Soal Siswa</span>
          </button>

          <button
            onClick={() => setViewMode('teacher')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'teacher'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kunci & Pembahasan Guru</span>
          </button>

          <button
            onClick={() => setViewMode('visuals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'visuals'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Bank Prompt Gambar AI</span>
            {visualQuestions.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                viewMode === 'visuals' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {visualQuestions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode('blueprint')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'blueprint'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kisi-Kisi & Matriks Soal</span>
          </button>
        </div>

        {/* Sub-Filters / Stats */}
        <div className="flex items-center gap-2 px-2 text-xs text-slate-500 font-medium">
          <span className="hidden sm:inline">Total:</span>
          <span className="font-bold text-slate-800">{quiz.questions.length} Butir</span>
          <span>•</span>
          <span className="font-semibold text-indigo-600">HOTS: {hotsCount}</span>
          <span>•</span>
          <span className="font-semibold text-emerald-600">TKA: {tkaCount || quiz.questions.length}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: LEMBAR SOAL SISWA / NASKAH UJIAN CETAK */}
      {/* ========================================================================= */}
      {viewMode === 'student' && (
        <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-3xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none text-slate-900">
          {/* Formal Exam Header / Kop Ujian */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="text-center space-y-1">
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-800">
                {quiz.institutionName || institutionName}
              </h2>
              <h1 className="text-base sm:text-xl font-black uppercase text-indigo-900 tracking-tight">
                {quiz.title}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Mata Pelajaran: <span className="font-bold text-slate-900">{quiz.subject}</span> | 
                Fase / Kelas: <span className="font-bold text-indigo-800">{quiz.fase || 'Fase E (Kelas 10)'}</span> | 
                Alokasi Waktu: <span className="font-bold text-slate-900">{quiz.estimatedMinutes} Menit</span>
              </p>
            </div>

            {/* Student ID Fill-in Box */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Nama Siswa:</span>
                <div className="flex-1 border-b border-dotted border-slate-400 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Nomor Peserta:</span>
                <div className="flex-1 border-b border-dotted border-slate-400 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Hari / Tanggal:</span>
                <div className="flex-1 border-b border-dotted border-slate-400 h-4" />
              </div>
            </div>
          </div>

          {/* General Exam Instructions */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-8 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">PETUNJUK UMUM PENGERJAAN SOAL:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-relaxed">
              <li>Bacalah setiap butir pertanyaan dan stimulus wacana dengan teliti sebelum menentukan jawaban.</li>
              <li>Pilihlah salah satu jawaban yang paling tepat dengan memberi tanda silang (X) pada huruf A, B, C, D, atau E.</li>
              <li>Untuk soal yang memuat keterangan visual/diagram, perhatikan data dan label gambar rujukan.</li>
            </ol>
          </div>

          {/* List of Questions */}
          <div className="space-y-8">
            {quiz.questions.map((q, idx) => {
              const hasVisualPrompt = q.needsVisual || Boolean(q.visualPrompt);

              return (
                <div key={q.id} className="group relative break-inside-avoid">
                  {/* Category & Competency Badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Soal No. {idx + 1}
                    </span>
                    {q.categoryType && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        q.categoryType === 'HOTS' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {q.categoryType}
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-slate-500">
                      {q.bloomLevel || 'C4 Menganalisis'}
                    </span>
                  </div>

                  {/* Stimulus Context Text (If present) */}
                  {q.stimulus && (
                    <div className="mb-3 p-3.5 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl text-xs text-slate-800 leading-relaxed">
                      <span className="font-bold text-indigo-900 block mb-1 uppercase text-[10px] tracking-wider">
                        Wacana / Stimulus Kontekstual:
                      </span>
                      {q.stimulus}
                    </div>
                  )}

                  {/* Visual / Image Requirement Box (Prompt Generator Helper) */}
                  {hasVisualPrompt && (
                    <div className="my-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                          <Image className="w-4 h-4 text-amber-600" />
                          <span>Kebutuhan Visual Soal: {q.visualType?.toUpperCase() || 'DIAGRAM'}</span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-medium">
                          Rasio 16:9 • Siap AI
                        </span>
                      </div>

                      {/* Visual Description in Indonesian */}
                      {q.visualDescription && (
                        <p className="text-slate-700 mb-2.5 text-xs leading-relaxed">
                          <span className="font-semibold text-slate-900">Keterangan Gambar: </span>
                          {q.visualDescription}
                        </p>
                      )}

                      {/* AI Image Prompt in English (Copyable) */}
                      {q.visualPrompt && (
                        <div className="mt-2 bg-white p-3 rounded-xl border border-amber-200 shadow-xs">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              Prompt AI Image Generator (Midjourney / DALL-E / Canva):
                            </span>
                            <button
                              onClick={() => handleCopyPrompt(q.visualPrompt!, q.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold transition-all flex items-center gap-1"
                            >
                              {copiedPromptId === q.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin Prompt AI</span>
                                </>
                              )}
                            </button>
                          </div>
                          <code className="block text-[11px] font-mono text-slate-700 bg-slate-50 p-2 rounded-lg break-words leading-relaxed select-all">
                            {q.visualPrompt}
                          </code>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Question Stem */}
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed mb-3">
                    {q.question}
                  </p>

                  {/* Options (A, B, C, D, E) */}
                  {q.options && q.options.length > 0 ? (
                    <div className="space-y-2 pl-2">
                      {q.options.map((opt, optIdx) => (
                        <div 
                          key={optIdx} 
                          className="flex items-start gap-2.5 text-xs text-slate-800"
                        >
                          <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center font-bold text-[11px] text-slate-700 shrink-0 mt-0.5">
                            {optionLetters[optIdx] || optIdx + 1}
                          </span>
                          <span className="leading-relaxed pt-0.5">{opt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 border-b border-dotted border-slate-400 h-6 text-xs text-slate-400 italic">
                      Lembar jawaban isian singkat...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: LEMBAR KUNCI JAWABAN & PEMBAHASAN GURU */}
      {/* ========================================================================= */}
      {viewMode === 'teacher' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-slate-900 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Pedoman Guru & Rubrik Penilaian
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Kunci Jawaban & Pembahasan Komprehensif
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analisis rasionalisasi konsep, distractor, Taksonomi Bloom, dan pemetaan kompetensi.
                </p>
              </div>

              <button
                onClick={() => exportTeacherAnswerKeyPDF(quiz, quiz.institutionName || institutionName)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh PDF Kunci</span>
              </button>
            </div>
          </div>

          {/* Questions with Explanations */}
          <div className="space-y-6">
            {quiz.questions.map((q, idx) => {
              const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
              const correctLetter = optionLetters[correctIndex] || 'A';
              const correctText = q.options && q.options[correctIndex] ? q.options[correctIndex] : String(q.correctAnswer);

              return (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {q.subtopic || quiz.subject}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-100 text-indigo-700">
                        {q.bloomLevel || 'C4 Menganalisis'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-lg flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Kunci: {correctLetter}. {correctText}
                      </span>
                    </div>
                  </div>

                  {/* Question Stem */}
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                    {q.question}
                  </p>

                  {/* Detailed Explanation Box */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 text-xs space-y-2">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-indigo-900">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Rasionalisasi Konsep & Pembahasan:
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      {q.explanation}
                    </p>

                    {q.hint && (
                      <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-amber-800 text-[11px]">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Petunjuk Scaffolding:</strong> {q.hint}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 3: BANK PROMPT GAMBAR AI (VISUAL HUB) */}
      {/* ========================================================================= */}
      {viewMode === 'visuals' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-slate-900 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Prompt Generator AI Siap Pakai</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Daftar Kebutuhan Gambar, Grafik, & Diagram
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Salin prompt berikut dan tempelkan ke Midjourney, DALL-E, Canva Magic Media, atau ChatGPT untuk membuat visual berkualitas tinggi.
              </p>
            </div>

            {visualQuestions.length > 0 && (
              <button
                onClick={handleCopyAllPrompts}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
              >
                {copiedAllPrompts ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAllPrompts ? 'Semua Prompt Tersalin!' : 'Salin Semua Prompt AI'}</span>
              </button>
            )}
          </div>

          {/* Cards for each question requiring visual */}
          {visualQuestions.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {visualQuestions.map((q) => {
                const questionIndex = quiz.questions.indexOf(q) + 1;

                return (
                  <div 
                    key={q.id}
                    className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs">
                          Soal #{questionIndex}
                        </span>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Tipe: {q.visualType || 'DIAGRAM / GRAFIK'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyPrompt(q.visualPrompt || '', q.id)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        {copiedPromptId === q.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Prompt Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Prompt Ini</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-700">
                      <strong className="text-slate-900">Deskripsi Kebutuhan Gambar: </strong>
                      {q.visualDescription || 'Diagram visual untuk melengkapi stimulus pertanyaan.'}
                    </p>

                    <div className="bg-white p-3.5 rounded-xl border border-amber-200/90 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Prompt Bahasa Inggris (Siap Generate AI):</span>
                        <span className="text-amber-600">Rasio 16:9 • High Quality</span>
                      </div>
                      <code className="text-xs font-mono text-slate-800 break-words leading-relaxed select-all">
                        {q.visualPrompt}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                      <span className="font-semibold text-slate-700">Rekomendasi AI Generator:</span>
                      <span>Canva Magic Media</span> • <span>DALL-E 3 (ChatGPT)</span> • <span>Midjourney</span> • <span>Google Imagen</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
              <Image className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="font-bold text-slate-700">Naskah ini tidak memiliki butir soal yang memerlukan gambar tambahan.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Semua butir soal diformulasikan berbasis stimulus teks kontekstual dan analisis wacana.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 4: KISI-KISI & MATRIKS SOAL */}
      {/* ========================================================================= */}
      {viewMode === 'blueprint' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-slate-900 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              Kisi-Kisi & Matriks Distribusi Butir Soal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemetaan taksonomi kognitif, kompetensi dasar, dan sebaran tingkat kesulitan ujian.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Materi / Subtopik</th>
                  <th className="p-3">Level Kognitif</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Kebutuhan Visual</th>
                  <th className="p-3">Tingkat Kesulitan</th>
                  <th className="p-3">Kunci</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quiz.questions.map((q, idx) => {
                  const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
                  const correctLetter = optionLetters[correctIndex] || 'A';

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">{q.subtopic || quiz.subject}</td>
                      <td className="p-3 text-slate-700">{q.bloomLevel || 'C4 Menganalisis'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.categoryType === 'HOTS' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {q.categoryType || 'HOTS'}
                        </span>
                      </td>
                      <td className="p-3">
                        {q.needsVisual ? (
                          <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                            <Image className="w-3.5 h-3.5 text-amber-600" />
                            {q.visualType?.toUpperCase() || 'DIAGRAM'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Teks murni</span>
                        )}
                      </td>
                      <td className="p-3 capitalize text-slate-600">{q.difficulty}</td>
                      <td className="p-3 font-bold text-emerald-700">{correctLetter}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question Editor Modal */}
      {isEditorOpen && (
        <QuestionEditorModal
          quiz={quiz}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSaveQuiz={(updated) => {
            onUpdateQuiz(updated);
            setIsEditorOpen(false);
          }}
        />
      )}
    </div>
  );
};
