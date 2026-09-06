import React, { useState } from 'react';
import { 
  User, Mail, School, Award, Sparkles, Settings, 
  Download, Upload, RefreshCcw, Check, ShieldCheck, 
  BookOpen, Trophy, Flame, Bell, Volume2, Cloud, LogIn, LogOut, CheckCircle2
} from 'lucide-react';
import { UserProfile, Quiz, QuizAttempt } from '../types';
import { exportBackupJSON, importBackupJSON } from '../utils/storage';

interface UserProfileViewProps {
  profile: UserProfile;
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  onUpdateProfile: (updated: UserProfile) => void;
  onRestoreData: (quizzes: Quiz[], attempts: QuizAttempt[], profile: UserProfile) => void;
  currentUser?: any;
  onLoginGoogle?: () => void;
  onLogout?: () => void;
  isSyncing?: boolean;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  profile,
  quizzes,
  attempts,
  onUpdateProfile,
  onRestoreData,
  currentUser,
  onLoginGoogle,
  onLogout,
  isSyncing,
}) => {
  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);
  const [role, setRole] = useState<'teacher' | 'student' | 'lecturer' | 'tutor'>(profile.role);
  const [institution, setInstitution] = useState<string>(profile.institution);
  const [bio, setBio] = useState<string>(profile.bio || '');
  const [defaultQuestionCount, setDefaultQuestionCount] = useState<number>(profile.preferences.defaultQuestionCount);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(profile.preferences.soundEffects);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  // Avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  ];

  const [selectedAvatar, setSelectedAvatar] = useState<string>(profile.avatar || avatarPresets[0]);

  const handleSaveProfile = () => {
    const updated: UserProfile = {
      ...profile,
      name,
      email,
      role,
      institution,
      bio,
      avatar: selectedAvatar,
      preferences: {
        ...profile.preferences,
        defaultQuestionCount,
        soundEffects: soundEnabled,
      },
    };
    onUpdateProfile(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const backup = importBackupJSON(text);
        if (backup) {
          onRestoreData(backup.quizzes, backup.attempts, backup.profile);
          alert('Data riwayat dan kuis berhasil dipulihkan!');
        } else {
          alert('Format berkas cadangan tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca berkas cadangan.');
      }
    };
    reader.readAsText(file);
  };

  // Milestone badges logic
  const hasPerfectScore = attempts.some(a => a.score === 100);
  const quizCreatedCount = quizzes.length;
  const attemptsCount = attempts.length;

  const badges = [
    {
      id: 'quiz_creator',
      title: 'Pembuat Soal Aktif',
      desc: 'Telah membuat minimal 3 paket kuis dokumen.',
      unlocked: quizCreatedCount >= 3,
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'perfect_accuracy',
      title: 'Skor Sempurna (100)',
      desc: 'Mendapatkan nilai 100 pada salah satu asesmen.',
      unlocked: hasPerfectScore,
      icon: Trophy,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'assessment_explorer',
      title: 'Pembelajar Adaptif',
      desc: 'Menyelesaikan minimal 5 kali asesmen kuis.',
      unlocked: attemptsCount >= 5,
      icon: Flame,
      color: 'from-rose-500 to-red-600',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
          <User className="w-3.5 h-3.5" />
          <span>Manajemen Profil & Riwayat Belajar</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profil Pengguna & Pengaturan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola identitas pendidik/pelajar, preferensi asesmen kuis, dan pencadangan data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Badges */}
        <div className="space-y-6">
          {/* Main ID Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-xs">
            <div className="relative inline-block mb-3">
              <img
                src={selectedAvatar}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-600 shadow-md mx-auto"
              />
              <span className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            <h3 className="font-heading font-bold text-lg text-slate-900">{name}</h3>
            <p className="text-xs font-semibold text-indigo-600 capitalize">
              {role === 'teacher' ? 'Pendidik / Guru' : role === 'lecturer' ? 'Dosen' : role === 'student' ? 'Siswa / Pelajar' : 'Tutor'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{institution || 'Institusi Pendidikan'}</p>

            {bio && (
              <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 italic leading-relaxed">
                "{bio}"
              </p>
            )}

            {/* Quick Stats in Profile Card */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-left">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Kuis Dibuat</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{quizzes.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Asesmen</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{attempts.length}</p>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h4 className="font-heading font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Lencana & Prestasi Belajar</span>
            </h4>

            <div className="space-y-3">
              {badges.map((b) => {
                const IconComponent = b.icon;
                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      b.unlocked
                        ? 'bg-slate-50/80 border-slate-200 text-slate-900'
                        : 'bg-slate-50/30 border-slate-100 opacity-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${
                        b.unlocked ? b.color : 'from-slate-400 to-slate-500'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold leading-tight truncate">{b.title}</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form & Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="font-heading font-bold text-base text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Informasi Pengguna</span>
            </h3>

            <div className="space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Foto Profil:</label>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {avatarPresets.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`relative rounded-xl overflow-hidden shrink-0 transition-transform ${
                        selectedAvatar === av
                          ? 'ring-2 ring-indigo-600 ring-offset-2 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={av}
                        alt={`Avatar ${idx}`}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Peran Pengguna</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="teacher">Pendidik / Guru</option>
                    <option value="student">Siswa / Pelajar</option>
                    <option value="lecturer">Dosen</option>
                    <option value="tutor">Tutor / Instruktur</option>
                  </select>
                </div>
              </div>

              {/* Institution & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asal Sekolah / Institusi</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Bio Singkat</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Contoh: Guru Matematika SMA, fokus pada pembelajaran bermakna."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Preferences Strip */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Soal Default Saat Generate
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    value={defaultQuestionCount}
                    onChange={(e) => setDefaultQuestionCount(Number(e.target.value) || 5)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 mt-2 sm:mt-0">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Efek Suara Audio</span>
                    <span className="text-[10px] text-slate-500">Bunyi lonceng dan kuis interaktif</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 flex items-center justify-between">
                {savedToast ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>Perubahan profil tersimpan!</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Pembaruan tersimpan di memori lokal.</span>
                )}

                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>

          {/* Cloud Firestore Storage Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-slate-900">
                      Penyimpanan Cloud Firestore
                    </h3>
                    {currentUser ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Terhubung & Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Perlu Login
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Naskah soal otomatis tersimpan permanen di cloud database, aman dari pembersihan browser cache.
                  </p>
                </div>
              </div>

              {currentUser ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun Google</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLoginGoogle}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Hubungkan Akun Google</span>
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-medium text-slate-500 block">Status Database</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${currentUser ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  {currentUser ? 'Cloud Firestore Online' : 'Penyimpanan Lokal'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-medium text-slate-500 block">Total Paket Tersimpan</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                  {quizzes.length} Naskah Soal
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-medium text-slate-500 block">Akun Google Pendidik</span>
                <span className="text-xs font-bold text-slate-800 truncate mt-0.5 block">
                  {currentUser?.email || 'Belum terhubung'}
                </span>
              </div>
            </div>
          </div>

          {/* Backup & Restore Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="font-heading font-bold text-base text-slate-900 mb-2">
              Pencadangan Data & Portabilitas
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Simpan seluruh paket kuis dan riwayat nilai Anda ke file JSON atau pulihkan data dari perangkat lain.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={exportBackupJSON}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Unduh Cadangan (JSON)</span>
              </button>

              <label className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Pulihkan Data (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
