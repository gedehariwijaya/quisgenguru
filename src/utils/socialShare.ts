import { Quiz, QuizAttempt } from '../types';

export interface ShareData {
  title: string;
  score: number;
  accuracy: number;
  totalQuestions: number;
  subject: string;
  userName?: string;
}

export function generateShareText(data: ShareData): string {
  const emoji = data.score >= 90 ? '🏆' : data.score >= 75 ? '🎯' : '📚';
  return `Saya baru saja menyelesaikan kuis "${data.title}" di QuizGen Guru dan meraih skor ${Math.round(data.score)}/100 (${data.accuracy}% akurasi)! ${emoji}\n\nBuat kuis otomatis dari dokumen Anda dengan AI di QuizGen Guru. Coba sekarang!`;
}

export function getShareUrls(data: ShareData, currentUrl: string = window.location.origin) {
  const shareText = encodeURIComponent(generateShareText(data));
  const url = encodeURIComponent(currentUrl);

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${shareText}%0A${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${shareText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${shareText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  };
}

/**
 * Creates a high resolution downloadable Badge/Certificate PNG on HTML Canvas
 */
export function generateScoreCardImage(quiz: Quiz, attempt: QuizAttempt, userName: string = 'Siswa'): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630; // standard 1.91:1 social card
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // Background Gradient (Sophisticated deep indigo & slate)
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e1b4b');
    gradient.addColorStop(1, '#312e81');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Decorative grid / subtle glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let x = 0; x < 1200; x += 40) {
      ctx.fillRect(x, 0, 1, 630);
    }
    for (let y = 0; y < 630; y += 40) {
      ctx.fillRect(0, y, 1200, 1);
    }

    // Glow circle behind score
    const radialGlow = ctx.createRadialGradient(920, 315, 10, 920, 315, 220);
    radialGlow.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    radialGlow.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(700, 100, 440, 440);

    // Inner Card Border Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1120, 550);

    // App Branding Logo
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('⚡ QuizGen Guru AI', 80, 100);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText('Automated Assessment & Adaptive Analytics', 80, 130);

    // Student Name & Quiz Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px sans-serif';
    
    // Truncate quiz title if too long
    const maxTitleLen = 32;
    const displayTitle = quiz.title.length > maxTitleLen ? quiz.title.slice(0, maxTitleLen) + '...' : quiz.title;
    ctx.fillText(displayTitle, 80, 220);

    ctx.fillStyle = '#c7d2fe';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Pencapaian Asesmen oleh: ${userName}`, 80, 270);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Mata Pelajaran: ${quiz.subject} • Selesai dalam ${Math.floor(attempt.totalTimeSeconds / 60)}m ${attempt.totalTimeSeconds % 60}s`, 80, 315);

    // Stats Badges
    const stats = [
      { label: 'Total Soal', val: `${attempt.totalQuestions}` },
      { label: 'Benar', val: `${attempt.correctCount}` },
      { label: 'Akurasi', val: `${Math.round((attempt.correctCount / attempt.totalQuestions) * 100)}%` },
    ];

    stats.forEach((s, idx) => {
      const bx = 80 + (idx * 170);
      const by = 380;
      // badge background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(bx, by, 150, 80, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(s.val, bx + 20, by + 42);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText(s.label, bx + 20, by + 66);
    });

    // Score Circle on right
    ctx.fillStyle = attempt.score >= 80 ? '#10b981' : attempt.score >= 60 ? '#f59e0b' : '#ef4444';
    ctx.beginPath();
    ctx.arc(920, 315, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(attempt.score)}`, 920, 325);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('SKOR AKHIR', 920, 375);

    // Grade status tag
    const grade = attempt.score >= 90 ? '⭐⭐⭐ MASTER' : attempt.score >= 75 ? '⭐⭐ HEBAT' : '⭐ LULUS';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#e0e7ff';
    ctx.fillText(grade, 920, 415);

    // Footer
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText('Diverifikasi oleh AI Quiz Engine • https://quiz-gen-guru.emergent.host', 80, 545);

    resolve(canvas.toDataURL('image/png'));
  });
}
