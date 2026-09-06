import { jsPDF } from 'jspdf';
import { Quiz, QuizAttempt } from '../types';

/**
 * Generates and downloads a clean, printable PDF of the Quiz for students (Exam Paper)
 */
export function exportStudentQuizPDF(quiz: Quiz, institutionName: string = 'Lembaga Pendidikan'): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(institutionName.toUpperCase(), pageWidth / 2, y + 7, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229);
  doc.text(quiz.title, pageWidth / 2, y + 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const faseStr = quiz.fase ? `  |  ${quiz.fase}` : '';
  doc.text(`Mata Pelajaran: ${quiz.subject}${faseStr}  |  Alokasi Waktu: ${quiz.estimatedMinutes} Menit  |  Jumlah Soal: ${quiz.questions.length} Butir`, pageWidth / 2, y + 19, { align: 'center' });

  // Student Identity Fields
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Nama Siswa : _______________________', margin + 4, y + 25);
  doc.text('Kelas/No.Absen : _________________', margin + 70, y + 25);
  doc.text('Tanggal : ______________', margin + 130, y + 25);

  y += 34;

  // Instructions
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Petunjuk: Pilihlah satu jawaban yang paling tepat dengan memberi tanda silang (X) atau menghitamkan bulatan.', margin, y);
  y += 6;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Loop Questions
  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  quiz.questions.forEach((q, idx) => {
    // Check page height space
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`${quiz.title} - Halaman Lanjutan`, margin, y);
      y += 8;
    }

    // Question Number & Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    
    const qPrefix = `${idx + 1}. `;
    const qLines = doc.splitTextToSize(qPrefix + q.question, contentWidth);
    doc.text(qLines, margin, y);
    y += (qLines.length * 4.5) + 2;

    // Options
    if (q.options && q.options.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      q.options.forEach((opt, optIdx) => {
        const optLetter = optionLetters[optIdx] || `${optIdx + 1}`;
        const optText = `${optLetter}.  ${opt}`;
        const optLines = doc.splitTextToSize(optText, contentWidth - 8);

        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin + 5;
        }

        doc.text(optLines, margin + 4, y);
        y += (optLines.length * 4.2) + 1;
      });
    } else {
      // Short Answer blank space
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Jawaban: ____________________________________________________________________', margin + 4, y);
      y += 6;
    }

    y += 4; // spacing between questions
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Dihasilkan oleh QuizGen Guru AI  |  Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  const safeTitle = quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  doc.save(`Soal_Ujian_${safeTitle}.pdf`);
}

/**
 * Generates Teacher Answer Key & Explanations PDF
 */
export function exportTeacherAnswerKeyPDF(quiz: Quiz, institutionName: string = 'Lembaga Pendidikan'): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('KUNCI JAWABAN & PEMBAHASAN LENGKAP', pageWidth / 2, y + 7, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text(quiz.title, pageWidth / 2, y + 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const teacherFaseStr = quiz.fase ? `  |  ${quiz.fase}` : '';
  doc.text(`Mata Pelajaran: ${quiz.subject}${teacherFaseStr}  |  Total Soal: ${quiz.questions.length}  |  ${institutionName}`, pageWidth / 2, y + 19, { align: 'center' });

  y += 30;

  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  quiz.questions.forEach((q, idx) => {
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin;
    }

    // Question Box Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    const correctLetter = typeof q.correctAnswer === 'number' 
      ? optionLetters[q.correctAnswer] || q.correctAnswer 
      : q.correctAnswer;

    const correctText = q.options && typeof q.correctAnswer === 'number' && q.options[q.correctAnswer]
      ? q.options[q.correctAnswer]
      : '';

    const qText = `${idx + 1}. ${q.question}`;
    const qLines = doc.splitTextToSize(qText, contentWidth);
    doc.text(qLines, margin, y);
    y += (qLines.length * 4.5) + 2;

    // Key badge
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(67, 56, 202);
    doc.text(`Kunci Jawaban: [ ${correctLetter} ] ${correctText}`, margin + 3, y + 5);
    y += 9;

    // Metadata tags
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Taksonomi Bloom: ${q.bloomLevel || 'Memahami'}  |  Tingkat: ${q.difficulty.toUpperCase()}  |  Subtopik: ${q.subtopic || 'Umum'}`, margin + 2, y);
    y += 5;

    // Explanation Box
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const expPrefix = 'Pembahasan: ';
    const expLines = doc.splitTextToSize(expPrefix + q.explanation, contentWidth - 4);
    doc.text(expLines, margin + 2, y);
    y += (expLines.length * 4.2) + 5;

    // Subtle divider
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Dokumen Rahasia Pendidik  |  QuizGen Guru AI  |  Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  const safeTitle = quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  doc.save(`Kunci_Jawaban_${safeTitle}.pdf`);
}

/**
 * Generates Student Performance & Analytics Scorecard PDF
 */
export function exportStudentReportPDF(quiz: Quiz, attempt: QuizAttempt, studentName: string = 'Siswa'): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Title Banner
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('LAPORAN HASIL ASESMEN & ANALITIK KUIS', pageWidth / 2, y + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(224, 231, 255);
  doc.text('QuizGen Guru - Adaptive Learning Analytics Engine', pageWidth / 2, y + 16, { align: 'center' });

  y += 28;

  // Score Highlight Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Peserta: ${studentName}`, margin + 5, y + 8);
  doc.text(`Kuis: ${quiz.title}`, margin + 5, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Mata Pelajaran: ${quiz.subject}`, margin + 5, y + 20);
  doc.text(`Tanggal Selesai: ${new Date(attempt.completedAt).toLocaleString('id-ID')}`, margin + 5, y + 26);
  doc.text(`Durasi Pengerjaan: ${Math.floor(attempt.totalTimeSeconds / 60)}m ${attempt.totalTimeSeconds % 60}s`, margin + 5, y + 32);

  // Big Score Circle / Badge on the right
  const scoreX = pageWidth - margin - 32;
  const scoreY = y + 19;
  doc.setFillColor(attempt.score >= 80 ? 16 : (attempt.score >= 60 ? 234 : 239), attempt.score >= 80 ? 185 : (attempt.score >= 60 ? 179 : 68), attempt.score >= 80 ? 129 : (attempt.score >= 60 ? 8 : 68));
  doc.circle(scoreX, scoreY, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`${Math.round(attempt.score)}`, scoreX, scoreY + 2, { align: 'center' });
  doc.setFontSize(7);
  doc.text('SKOR', scoreX, scoreY + 6, { align: 'center' });

  y += 44;

  // Breakdown Statistics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Ringkasan Performa:', margin, y);
  y += 6;

  const statWidth = contentWidth / 4;
  const stats = [
    { label: 'Total Soal', val: `${attempt.totalQuestions}` },
    { label: 'Benar', val: `${attempt.correctCount}` },
    { label: 'Salah', val: `${attempt.incorrectCount}` },
    { label: 'Akurasi', val: `${Math.round((attempt.correctCount / attempt.totalQuestions) * 100)}%` },
  ];

  stats.forEach((s, idx) => {
    const xPos = margin + (idx * statWidth);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(xPos, y, statWidth - 3, 14, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(s.val, xPos + (statWidth - 3) / 2, y + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(s.label, xPos + (statWidth - 3) / 2, y + 11, { align: 'center' });
  });

  y += 20;

  // Bloom Taxonomy Breakdown Table
  if (attempt.bloomBreakdown && Object.keys(attempt.bloomBreakdown).length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Penguasaan Tingkat Kognitif (Taksonomi Bloom):', margin, y);
    y += 5;

    Object.entries(attempt.bloomBreakdown).forEach(([bloom, data]) => {
      const pct = Math.round((data.correct / Math.max(1, data.total)) * 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`${bloom} (${data.correct}/${data.total})`, margin + 2, y);

      // Progress bar background
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(margin + 80, y - 3, 60, 4, 1, 1, 'F');

      // Progress bar fill
      if (pct > 0) {
        doc.setFillColor(pct >= 70 ? 34 : (pct >= 50 ? 234 : 239), pct >= 70 ? 197 : (pct >= 50 ? 179 : 68), pct >= 70 ? 94 : (pct >= 50 ? 8 : 68));
        doc.roundedRect(margin + 80, y - 3, (60 * pct) / 100, 4, 1, 1, 'F');
      }

      doc.text(`${pct}%`, margin + 145, y);
      y += 6;
    });
    y += 4;
  }

  // Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Rekomendasi Tindak Lanjut & Evaluasi:', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const advice = attempt.score >= 85
    ? 'Performa sangat luar biasa! Pemahaman konsep sudah sangat matang. Direkomendasikan untuk mencoba variasi soal tingkat Higher Order Thinking Skills (HOTS) dan materi pengayaan lanjut.'
    : attempt.score >= 65
    ? 'Hasil baik dengan fondasi yang solid. Disarankan untuk meninjau kembali beberapa subtopik yang masih salah serta memanfaatkan fitur Tutor AI untuk pemahaman lebih mendalam.'
    : 'Perlu penguatan konsep dasar. Disarankan mempelajari kembali materi rujukan dan memanfaatkan kuis remedial adaptif untuk melatih konsep-konsep inti.';

  const adviceLines = doc.splitTextToSize(advice, contentWidth);
  doc.text(adviceLines, margin, y);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Diterbitkan secara otomatis oleh QuizGen Guru AI  |  https://quiz-gen-guru.emergent.host`, pageWidth / 2, pageHeight - 8, { align: 'center' });

  const safeTitle = quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  doc.save(`Laporan_Analitik_${safeTitle}_${Math.round(attempt.score)}.pdf`);
}
