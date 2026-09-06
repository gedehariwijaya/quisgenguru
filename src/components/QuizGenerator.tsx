import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Sparkles, CheckCircle2, AlertCircle, 
  FileUp, Hash, Layers, BrainCircuit, Image, Download, 
  ArrowRight, RefreshCw, Check, BookOpen, SlidersHorizontal, Cloud
} from 'lucide-react';
import { Quiz, QuestionType, UserProfile, AssessmentFocus } from '../types';
import { samplePresets } from '../data/sampleQuizzes';
import { parseDocumentFile, ParsedDocument } from '../utils/documentParser';
import { exportStudentQuizPDF } from '../utils/pdfExport';

interface QuizGeneratorProps {
  onQuizGenerated: (quiz: Quiz) => void;
  userProfile: UserProfile;
  savedQuizzes?: Quiz[];
  onOpenExamScript?: (quiz: Quiz) => void;
  onNavigateLibrary?: () => void;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  onQuizGenerated,
  userProfile,
  savedQuizzes = [],
  onOpenExamScript,
  onNavigateLibrary,
}) => {
  // Input Mode
  const [inputMode, setInputMode] = useState<'upload' | 'text' | 'preset'>('upload');

  // File parsing state
  const [uploadedDoc, setUploadedDoc] = useState<ParsedDocument | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text & Topic state
  const [customTopic, setCustomTopic] = useState('');
  const [customContent, setCustomContent] = useState('');

  // SMA Specific: Fase & Kelas
  const [fase, setFase] = useState<string>('Fase E (Kelas 10)');

  // Assessment configurations
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customCountInput, setCustomCountInput] = useState<string>('10');
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [assessmentFocus, setAssessmentFocus] = useState<AssessmentFocus>('hots_tka');
  const [includeVisualPrompts, setIncludeVisualPrompts] = useState<boolean>(true);

  // Generation progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generationSteps = [
    'Menganalisis materi rujukan...',
    'Menyusun stimulus wacana HOTS & TKA...',
    'Merumuskan pertanyaan dengan 5 opsi (A sampai E)...',
    'Menyiapkan prompt visual AI untuk grafik/diagram...',
    'Menyusun kunci jawaban & pembahasan...',
  ];

  // Handle file drop & selection
  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setIsParsingFile(true);
    try {
      const parsed = await parseDocumentFile(file);
      setUploadedDoc(parsed);
      if (!customTopic) {
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setCustomTopic(baseName);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(`Gagal membaca file: ${err?.message || 'Format tidak didukung'}`);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (preset: typeof samplePresets[0]) => {
    setCustomTopic(preset.title);
    setCustomContent(preset.content);
    setInputMode('text');
  };

  // Submit Generation to backend
  const handleGenerateScript = async () => {
    setErrorMessage(null);
    
    let textToSend = customContent;
    let fileBase64ToSend = uploadedDoc?.base64;
    let fileNameToSend = uploadedDoc?.name;
    let mimeTypeToSend = uploadedDoc?.type;

    if (inputMode === 'upload') {
      if (!uploadedDoc) {
        setErrorMessage('Silakan pilih atau unggah dokumen rujukan terlebih dahulu.');
        return;
      }
      textToSend = uploadedDoc.text;
    } else {
      if (!customTopic && !customContent) {
        setErrorMessage('Silakan tuliskan topik atau tempel materi teks naskah soal.');
        return;
      }
    }

    const finalCount = isCustomCount ? (parseInt(customCountInput) || 10) : questionCount;

    setIsGenerating(true);
    setGenerationStep(0);

    const stepInterval = setInterval(() => {
      setGenerationStep(prev => (prev < generationSteps.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textToSend,
          topic: customTopic,
          fileBase64: fileBase64ToSend,
          fileName: fileNameToSend,
          mimeType: mimeTypeToSend,
          questionCount: finalCount,
          questionTypes: ['multiple_choice'],
          difficulty,
          assessmentFocus,
          targetLevel: 'SMA',
          fase,
          language: 'id',
          includeExplanations: true,
          includeHints: false,
          includeVisualPrompts,
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || 'Gagal menyusun naskah soal dengan AI.');
      }

      const data = await response.json();
      const generatedQuiz: Quiz = (data && data.quiz) ? data.quiz : data;
      
      if (!generatedQuiz || !Array.isArray(generatedQuiz.questions) || generatedQuiz.questions.length === 0) {
        throw new Error('Hasil naskah soal dari AI belum lengkap. Silakan coba kembali.');
      }

      onQuizGenerated(generatedQuiz);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Quiz Script Generation failed:', err);
      
      const rawMsg = err?.message || '';
      let displayError = rawMsg;
      if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('overloaded')) {
        displayError = 'Layanan AI sedang sibuk. Silakan tekan tombol "Susun Naskah Soal" kembali.';
      } else if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
        displayError = 'Batas kuota sementara tercapai. Mohon tunggu beberapa detik lalu coba lagi.';
      }
      
      setErrorMessage(displayError || 'Terjadi kendala saat menyusun naskah soal.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Clean Aesthetic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
              SMA • Kurikulum Merdeka
            </span>
            <span className="text-xs text-slate-400">• Pilihan Ganda A–E</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Generator Naskah Soal SMA
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Susun naskah soal asesmen dengan stimulus HOTS/TKA, opsi A sampai E, dan prompt visual AI.
          </p>
        </div>

        {savedQuizzes.length > 0 && (
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-slate-500">Tersimpan: </span>
            <span className="text-xs font-bold text-indigo-600">{savedQuizzes.length} Naskah</span>
          </div>
        )}
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
        {/* SECTION 1: Sumber Materi */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>1. Sumber Materi Soal</span>
            </label>
            
            {/* Minimal Tabs */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  inputMode === 'upload' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  inputMode === 'text' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Topik / Teks
              </button>
              <button
                type="button"
                onClick={() => setInputMode('preset')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  inputMode === 'preset' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Contoh Topik
              </button>
            </div>
          </div>

          {/* Mode 1: File Upload */}
          {inputMode === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragOver ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.pptx,.ppt"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {isParsingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                  <p className="text-xs font-semibold text-slate-700">Membaca dokumen...</p>
                </div>
              ) : uploadedDoc ? (
                <div className="flex items-center space-x-3 w-full max-w-md bg-indigo-50/60 p-3 rounded-xl border border-indigo-200">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{uploadedDoc.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(uploadedDoc.size / 1024).toFixed(1)} KB • {uploadedDoc.charCount.toLocaleString()} karakter
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedDoc(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Tarik file atau <span className="text-indigo-600 underline">klik untuk memilih</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mendukung file PDF, Word (DOCX), PPTX, dan TXT
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Custom Text */}
          {inputMode === 'text' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Mata Pelajaran & Topik (Contoh: Biologi SMA - Sistem Sirkulasi Darah)"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
              <textarea
                rows={3}
                placeholder="Rangkuman materi atau poin kompetensi (opsional)..."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          {/* Mode 3: Presets */}
          {inputMode === 'preset' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {samplePresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span className="font-bold text-indigo-600">{preset.subject}</span>
                    <span>{preset.level}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs truncate">{preset.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Konfigurasi Asesmen SMA */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>2. Pengaturan Naskah Soal</span>
          </label>

          {/* A. FASE & KELAS SMA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Fase / Kelas (SMA):</span>
              <span className="text-[11px] text-indigo-600 font-bold">{fase}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Fase E (Kelas 10)', label: 'Fase E (Kelas 10)' },
                { id: 'Fase F (Kelas 11)', label: 'Fase F (Kelas 11)' },
                { id: 'Fase F (Kelas 12)', label: 'Fase F (Kelas 12)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFase(item.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    fase === item.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* B. FOKUS ASESMEN (HOTS / TKA) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Tipe Asesmen:</span>
              <span className="text-[11px] text-slate-500">
                {assessmentFocus === 'hots_tka' ? 'Kombinasi HOTS + TKA' : assessmentFocus.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'hots_tka', label: 'Kombinasi HOTS + TKA' },
                { id: 'hots', label: 'HOTS (C4–C6)' },
                { id: 'tka', label: 'TKA (Akademik)' },
                { id: 'standard', label: 'Standar Reguler' },
              ].map((af) => (
                <button
                  key={af.id}
                  type="button"
                  onClick={() => setAssessmentFocus(af.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    assessmentFocus === af.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {af.label}
                </button>
              ))}
            </div>
          </div>

          {/* C. JUMLAH SOAL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Jumlah Soal:</span>
              <span className="text-xs font-bold text-indigo-700">
                {isCustomCount ? customCountInput : questionCount} Butir
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[5, 10, 15, 20, 25, 30].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setQuestionCount(cnt);
                    setIsCustomCount(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    !isCustomCount && questionCount === cnt
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cnt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomCount(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  isCustomCount
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Kustom
              </button>

              {isCustomCount && (
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={customCountInput}
                    onChange={(e) => setCustomCountInput(e.target.value)}
                    className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg text-xs font-bold text-center focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400">soal (maks 60)</span>
                </div>
              )}
            </div>
          </div>

          {/* D. TINGKAT KESULITAN & OPSI JAWABAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Difficulty */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">Tingkat Kesulitan:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'mixed', label: 'Campur' },
                  { id: 'easy', label: 'Mudah' },
                  { id: 'medium', label: 'Sedang' },
                  { id: 'hard', label: 'Sukar' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id as any)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all text-center ${
                      difficulty === d.id
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opsi Format A - E Indicator */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">Format Pilihan Ganda:</span>
              <div className="py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Opsi A, B, C, D, E</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  5 Opsi Jawaban
                </span>
              </div>
            </div>
          </div>

          {/* Visual Prompt Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={includeVisualPrompts}
                onChange={(e) => setIncludeVisualPrompts(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 border-slate-300"
              />
              <span>
                Sediakan <strong>prompt visual AI</strong> jika butir soal membutuhkan gambar, grafik, atau diagram.
              </span>
            </label>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateScript}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Susun Naskah Soal SMA</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Naskah soal otomatis tersimpan ke Cloud Firestore</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Naskah Soal Tersimpan (Clean & Simple) */}
      {savedQuizzes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Naskah Soal Tersimpan</h3>
            <button 
              onClick={onNavigateLibrary}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Lihat Semua ({savedQuizzes.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {savedQuizzes.slice(0, 3).map((quiz) => (
              <div key={quiz.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{quiz.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {quiz.questions.length} Butir Soal • {quiz.fase || 'Fase E'} • {quiz.subject}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => exportStudentQuizPDF(quiz, userProfile.institution)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => onOpenExamScript && onOpenExamScript(quiz)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Buka</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimal Generating Progress Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900">Menyusun Naskah Soal SMA...</h3>
              <p className="text-xs text-slate-500 mt-1">
                {generationSteps[generationStep] || 'Memproses naskah...'}
              </p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
