import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Award, Clock, Target, CheckCircle2, 
  XCircle, Brain, Calendar, ArrowUpRight, RotateCcw, FileDown, 
  Sparkles, Layers, BookOpen, AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Legend 
} from 'recharts';
import { Quiz, QuizAttempt } from '../types';
import { exportStudentReportPDF } from '../utils/pdfExport';

interface AnalyticsDashboardProps {
  attempts: QuizAttempt[];
  quizzes: Quiz[];
  onReviewAttempt: (attempt: QuizAttempt) => void;
  onRetakeQuiz: (quizId: string) => void;
  onGenerateRemedial: (weakTopics: string[]) => void;
  userName: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  attempts,
  quizzes,
  onReviewAttempt,
  onRetakeQuiz,
  onGenerateRemedial,
  userName,
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Filter attempts
  const filteredAttempts = attempts.filter((att) => {
    if (selectedSubjectFilter === 'all') return true;
    return att.subject === selectedSubjectFilter;
  });

  // Calculate summary metrics
  const totalAttempts = filteredAttempts.length;
  const averageScore = totalAttempts > 0 
    ? Math.round(filteredAttempts.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts) 
    : 0;

  const totalQuestionsAnswered = filteredAttempts.reduce((acc, curr) => acc + curr.totalQuestions, 0);
  const totalCorrectAnswered = filteredAttempts.reduce((acc, curr) => acc + curr.correctCount, 0);
  const overallAccuracy = totalQuestionsAnswered > 0 
    ? Math.round((totalCorrectAnswered / totalQuestionsAnswered) * 100) 
    : 0;

  const totalTimeSeconds = filteredAttempts.reduce((acc, curr) => acc + curr.totalTimeSeconds, 0);
  const totalTimeMinutes = Math.round(totalTimeSeconds / 60);

  // Score progression data for Area Chart
  const scoreProgressionData = [...filteredAttempts]
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .map((att, idx) => ({
      index: idx + 1,
      date: new Date(att.completedAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
      score: Math.round(att.score),
      title: att.quizTitle,
      accuracy: Math.round((att.correctCount / att.totalQuestions) * 100),
    }));

  // Aggregate Bloom Taxonomy Mastery
  const bloomMap: { [bloom: string]: { correct: number; total: number } } = {};
  filteredAttempts.forEach((att) => {
    if (att.bloomBreakdown) {
      Object.entries(att.bloomBreakdown).forEach(([bName, val]) => {
        const data = val as { correct: number; total: number };
        if (!bloomMap[bName]) bloomMap[bName] = { correct: 0, total: 0 };
        bloomMap[bName].correct += data.correct;
        bloomMap[bName].total += data.total;
      });
    }
  });

  const bloomChartData = Object.entries(bloomMap).map(([name, data]) => ({
    name: name.split(' ')[0], // short label e.g. "Mengingat"
    fullName: name,
    mastery: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    totalQuestions: data.total,
  }));

  // Aggregate Topic Breakdown & Weak Areas
  const topicMap: { [topic: string]: { correct: number; total: number } } = {};
  filteredAttempts.forEach((att) => {
    if (att.topicBreakdown) {
      Object.entries(att.topicBreakdown).forEach(([tName, val]) => {
        const data = val as { correct: number; total: number };
        if (!topicMap[tName]) topicMap[tName] = { correct: 0, total: 0 };
        topicMap[tName].correct += data.correct;
        topicMap[tName].total += data.total;
      });
    }
  });

  const weakTopics = Object.entries(topicMap)
    .filter(([_, data]) => data.total >= 1 && (data.correct / data.total) < 0.7)
    .map(([name, data]) => ({
      name,
      accuracy: Math.round((data.correct / data.total) * 100),
      missed: data.total - data.correct,
      total: data.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  // Available subjects
  const subjects = Array.from(new Set(attempts.map(a => a.subject).filter(Boolean)));

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dasbor Analitik & Perkembangan Belajar</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analisis Performa Asesmen
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data metrik performa komprehensif, penguasaan Taksonomi Bloom, dan diagnosis konsep.
          </p>
        </div>

        {/* Subject Filter */}
        {subjects.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium pl-2">Filter Mapel:</span>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border-0 bg-slate-50 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Kuis Dikerjakan</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">{totalAttempts}</p>
          <p className="text-xs text-slate-500 mt-1">Dari {quizzes.length} paket kuis tersedia</p>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rata-rata Skor</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">{averageScore} <span className="text-sm font-normal text-slate-400">/ 100</span></p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {averageScore >= 75 ? 'Tingkat Ketuntasan Tinggi' : 'Progres Belajar Berkelanjutan'}
          </p>
        </div>

        {/* Global Accuracy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Akurasi Jawaban</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">{overallAccuracy}%</p>
          <p className="text-xs text-slate-500 mt-1">{totalCorrectAnswered} dari {totalQuestionsAnswered} butir benar</p>
        </div>

        {/* Study Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Waktu Belajar Efektif</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">{totalTimeMinutes} <span className="text-sm font-normal text-slate-400">Menit</span></p>
          <p className="text-xs text-slate-500 mt-1">Fokus belajar adaptif</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Progression Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900">Perkembangan Skor Asesmen</h2>
              <p className="text-xs text-slate-500">Tren nilai dari setiap kuis yang diselesaikan</p>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
              Skor Terkini: {scoreProgressionData.length > 0 ? scoreProgressionData[scoreProgressionData.length - 1].score : 0}
            </div>
          </div>

          <div className="h-64 w-full mt-2">
            {scoreProgressionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreProgressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value} Poin`, 'Skor']}
                    labelFormatter={(label, items) => {
                      const item = items?.[0]?.payload;
                      return item ? `${item.title} (${label})` : label;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data pengerjaan kuis.
              </div>
            )}
          </div>
        </div>

        {/* Bloom Taxonomy Mastery Bar Chart (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900">Taksonomi Bloom</h2>
              <p className="text-xs text-slate-500">Penguasaan tingkatan kognitif</p>
            </div>
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="h-64 w-full mt-2">
            {bloomChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bloomChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} width={75} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(value: any) => [`${value}% Kuasai`, 'Akurasi']}
                  />
                  <Bar dataKey="mastery" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center">
                Data Taksonomi Bloom akan muncul setelah menyelesaikan kuis.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weak Areas Diagnostic & 1-Click Remedial */}
      {weakTopics.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-xs bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900">Diagnosis Konsep & Topik Lemah</h2>
                <p className="text-xs text-slate-500">
                  AI mengidentifikasi {weakTopics.length} subtopik yang masih di bawah target ketuntasan (70%).
                </p>
              </div>
            </div>

            <button
              onClick={() => onGenerateRemedial(weakTopics.map(w => w.name))}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Buat Kuis Remedial Otomatis</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {weakTopics.map((wt, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">{wt.name}</span>
                  <span className="text-xs font-extrabold text-amber-600">{wt.accuracy}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${wt.accuracy}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  {wt.missed} butir soal salah dari {wt.total} percobaan
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Attempts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-slate-900">Riwayat Pengerjaan Kuis</h2>
            <p className="text-xs text-slate-500">Daftar lengkap sesi asesmen yang telah diselesaikan</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {filteredAttempts.length} Catatan
          </span>
        </div>

        {filteredAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">Judul Kuis & Mapel</th>
                  <th className="py-3 px-4">Waktu Selesai</th>
                  <th className="py-3 px-4">Skor & Akurasi</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAttempts.map((att) => {
                  const targetQuiz = quizzes.find(q => q.id === att.quizId);
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{att.quizTitle}</p>
                        <p className="text-[11px] text-slate-500">{att.subject}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(att.completedAt).toLocaleString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                            att.score >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : att.score >= 60
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {Math.round(att.score)} Poin
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({att.correctCount}/{att.totalQuestions} Benar)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {Math.floor(att.totalTimeSeconds / 60)}m {att.totalTimeSeconds % 60}s
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onReviewAttempt(att)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors"
                            title="Tinjau Detail Jawaban"
                          >
                            Tinjau
                          </button>
                          {targetQuiz && (
                            <button
                              onClick={() => onRetakeQuiz(targetQuiz.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title="Ulangi Kuis Ini"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {targetQuiz && (
                            <button
                              onClick={() => exportStudentReportPDF(targetQuiz, att, userName)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                              title="Unduh Laporan PDF"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400 text-xs">
            Tidak ada riwayat pengerjaan kuis yang cocok dengan filter.
          </div>
        )}
      </div>
    </div>
  );
};
