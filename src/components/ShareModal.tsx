import React, { useState, useEffect } from 'react';
import { 
  X, Share2, Copy, Check, Download, ExternalLink, Sparkles, 
  Send, Award, Image as ImageIcon
} from 'lucide-react';
import { Quiz, QuizAttempt } from '../types';
import { getShareUrls, generateShareText, generateScoreCardImage } from '../utils/socialShare';

interface ShareModalProps {
  quiz: Quiz;
  attempt: QuizAttempt;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  quiz,
  attempt,
  userName = 'Siswa',
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [scoreCardImg, setScoreCardImg] = useState<string>('');
  const [isGeneratingImg, setIsGeneratingImg] = useState<boolean>(true);

  const accuracy = Math.round((attempt.correctCount / attempt.totalQuestions) * 100);
  const shareData = {
    title: quiz.title,
    score: attempt.score,
    accuracy,
    totalQuestions: attempt.totalQuestions,
    subject: quiz.subject,
    userName,
  };

  const shareUrls = getShareUrls(shareData);
  const shareText = generateShareText(shareData);

  useEffect(() => {
    if (isOpen) {
      setIsGeneratingImg(true);
      generateScoreCardImage(quiz, attempt, userName)
        .then((url) => {
          setScoreCardImg(url);
        })
        .finally(() => setIsGeneratingImg(false));
    }
  }, [isOpen, quiz, attempt, userName]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${window.location.origin}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCard = () => {
    if (!scoreCardImg) return;
    const a = document.createElement('a');
    a.href = scoreCardImg;
    const safeTitle = quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20);
    a.download = `Sertifikat_Skor_${safeTitle}_${Math.round(attempt.score)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base">Bagikan Hasil Kuis</h3>
              <p className="text-xs text-indigo-200">Tunjukkan pencapaian & skor belajar Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Certificate Badge Visual Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Kartu Sertifikat Prestasi (PNG)</span>
              </label>
              {scoreCardImg && (
                <button
                  onClick={handleDownloadCard}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Gambar</span>
                </button>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm relative aspect-[1.91/1] flex items-center justify-center">
              {isGeneratingImg ? (
                <div className="text-center text-slate-400 text-xs py-10">
                  <Sparkles className="w-6 h-6 animate-pulse text-indigo-400 mx-auto mb-2" />
                  <span>Membuat kartu pencapaian resolusi tinggi...</span>
                </div>
              ) : scoreCardImg ? (
                <img
                  src={scoreCardImg}
                  alt="Quiz Score Card"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          </div>

          {/* Social Platforms 1-Click Share Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              Bagikan Langsung ke Media Sosial:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* WhatsApp */}
              <a
                href={shareUrls.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-colors"
              >
                <span>💬 WhatsApp</span>
              </a>

              {/* Twitter / X */}
              <a
                href={shareUrls.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                <span>𝕏 Twitter / X</span>
              </a>

              {/* Telegram */}
              <a
                href={shareUrls.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/80 text-xs font-bold transition-colors"
              >
                <span>✈️ Telegram</span>
              </a>

              {/* LinkedIn */}
              <a
                href={shareUrls.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80 text-xs font-bold transition-colors"
              >
                <span>💼 LinkedIn</span>
              </a>

              {/* Facebook */}
              <a
                href={shareUrls.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 text-xs font-bold transition-colors"
              >
                <span>👥 Facebook</span>
              </a>

              {/* Download PNG Button */}
              <button
                onClick={handleDownloadCard}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan Gambar</span>
              </button>
            </div>
          </div>

          {/* Copy Link / Text Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Salin Teks & Tautan:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareText}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-700 select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
