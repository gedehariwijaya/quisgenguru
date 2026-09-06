import React, { useState } from 'react';
import { 
  Sparkles, BookOpen, BarChart3, User, Plus, Layers, 
  Share2, FileText, Menu, X, ChevronRight, Cloud,
  LogIn, LogOut, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { UserProfile, NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  userProfile: UserProfile;
  savedQuizzesCount: number;
  attemptsCount: number;
  onShareClick?: () => void;
  onNewGenerationClick?: () => void;
  currentUser?: any;
  onLoginGoogle?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  savedQuizzesCount,
  attemptsCount,
  currentUser,
  onLoginGoogle,
  onLogout,
}) => {
  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div 
        id="sidebar-brand-btn"
        onClick={() => setActiveTab('generator')}
        className="p-6 flex items-center space-x-3 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform duration-200 border border-slate-200/80 flex items-center justify-center bg-white shrink-0">
          <img 
            src="/favicon.png" 
            alt="QuizGen Guru Logo" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-slate-900">QuizGuru<span className="text-indigo-600">.ai</span></span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Smart Quiz & Assessment</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto">
        <button
          id="sidebar-nav-generator"
          onClick={() => setActiveTab('generator')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            activeTab === 'generator'
              ? 'bg-indigo-50 text-indigo-700 font-semibold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Sparkles className={`w-5 h-5 ${activeTab === 'generator' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Naskah Soal AI</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100/80 text-indigo-700">
            SMA
          </span>
        </button>

        <button
          id="sidebar-nav-library"
          onClick={() => setActiveTab('library')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            activeTab === 'library'
              ? 'bg-indigo-50 text-indigo-700 font-semibold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <BookOpen className={`w-5 h-5 ${activeTab === 'library' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Bank Naskah Soal</span>
          </div>
          {savedQuizzesCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {savedQuizzesCount}
            </span>
          )}
        </button>

        <button
          id="sidebar-nav-profile"
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            activeTab === 'profile'
              ? 'bg-indigo-50 text-indigo-700 font-semibold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Profil Guru & Sekolah</span>
          </div>
        </button>
      </nav>

      {/* Cloud Firestore Persistence Status Card */}
      <div className="px-4 mb-3">
        {currentUser ? (
          <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-950 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Firestore</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-emerald-800 leading-tight">
              Naskah soal tersimpan otomatis & aman di Google Cloud.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-700">
              <span className="truncate max-w-[120px] font-semibold">{currentUser.email || 'Guru'}</span>
              <button
                type="button"
                onClick={onLogout}
                className="text-[10px] text-rose-600 hover:underline font-bold"
              >
                Keluar
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50/70 border border-indigo-200 text-slate-800 p-3 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Cloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simpan Permanen</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Masuk dengan akun Google agar naskah soal tidak pernah hilang.
            </p>
            <button
              type="button"
              onClick={onLoginGoogle}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Google</span>
            </button>
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-200">
        <div 
          id="sidebar-user-footer-btn"
          onClick={() => setActiveTab('profile')}
          className="flex items-center space-x-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
            <img 
              src={currentUser?.photoURL || userProfile.avatar || 'https://i.pravatar.cc/150?u=a042581f4e29026704d'} 
              alt={userProfile.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-900 truncate">
              {currentUser?.displayName || userProfile.name}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {currentUser?.email || userProfile.institution || 'Guru SMA'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>
    </aside>
  );
};

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  userProfile: UserProfile;
  savedQuizzesCount: number;
  onOpenMobileMenu: () => void;
  currentUser?: any;
  onLoginGoogle?: () => void;
  onLogout?: () => void;
  isSyncing?: boolean;
}

export const TopHeader: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  onOpenMobileMenu,
  currentUser,
  onLoginGoogle,
  onLogout,
  isSyncing,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'generator':
        return 'Generator Naskah Soal SMA';
      case 'library':
        return 'Bank Naskah Soal';
      case 'script_view':
        return 'Naskah Soal & Prompt Visual AI';
      case 'profile':
        return 'Profil Guru & Sekolah';
      case 'player':
        return 'Pratinjau Asesmen Siswa';
      case 'results':
        return 'Evaluasi Jawaban';
      default:
        return 'Generator Naskah Soal SMA';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shadow-xs z-20 shrink-0 sticky top-0">
      {/* Mobile Menu Trigger & Title */}
      <div className="flex items-center space-x-3">
        <button
          id="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-xs flex items-center justify-center bg-white shrink-0">
            <img 
              src="/favicon.png" 
              alt="QuizGen Guru Logo" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <span className="font-bold text-slate-900 text-base">QuizGuru</span>
        </div>

        <h2 className="hidden lg:block text-lg font-semibold text-slate-800">
          {getTabTitle()}
        </h2>
      </div>

      {/* Top Header Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Firestore Sync Badge */}
        {currentUser ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Firestore Aktif</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoginGoogle}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-700 text-xs font-bold transition-all"
          >
            <Cloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simpan ke Firestore</span>
          </button>
        )}

        <button
          id="top-header-new-gen-btn"
          onClick={() => setActiveTab('generator')}
          className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-xs hover:bg-indigo-700 transition-all flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Naskah Soal</span>
        </button>

        {/* Mobile Profile Avatar */}
        <button
          onClick={() => setActiveTab('profile')}
          className="lg:hidden w-8 h-8 rounded-full overflow-hidden border border-slate-300"
        >
          <img
            src={currentUser?.photoURL || userProfile.avatar || 'https://i.pravatar.cc/150?u=a042581f4e29026704d'}
            alt={userProfile.name}
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};

export const MobileDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  userProfile: UserProfile;
  savedQuizzesCount: number;
  currentUser?: any;
  onLoginGoogle?: () => void;
  onLogout?: () => void;
}> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab, 
  userProfile, 
  savedQuizzesCount,
  currentUser,
  onLoginGoogle,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10">
        <div className="p-5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex items-center justify-center bg-white shrink-0">
              <img 
                src="/favicon.png" 
                alt="QuizGen Guru Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <span className="text-lg font-bold text-slate-900">QuizGuru.ai</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('generator'); onClose(); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
              activeTab === 'generator' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Naskah Soal AI</span>
          </button>

          <button
            onClick={() => { setActiveTab('library'); onClose(); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
              activeTab === 'library' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-slate-500" />
              <span>Bank Naskah Soal</span>
            </div>
            {savedQuizzesCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {savedQuizzesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('profile'); onClose(); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
              activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-5 h-5 text-slate-500" />
            <span>Profil Guru & Sekolah</span>
          </button>

          {/* Mobile Cloud Firestore action */}
          <div className="pt-3 border-t border-slate-100">
            {currentUser ? (
              <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cloud Firestore Aktif</span>
                </div>
                <p className="text-[11px] text-emerald-700 truncate">{currentUser.email}</p>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-[10px] text-rose-600 hover:underline font-bold block pt-1"
                >
                  Keluar Akun Google
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLoginGoogle}
                className="w-full py-2 px-3 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Google (Cloud Firestore)</span>
              </button>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div 
            onClick={() => { setActiveTab('profile'); onClose(); }}
            className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl"
          >
            <img 
              src={currentUser?.photoURL || userProfile.avatar || 'https://i.pravatar.cc/150?u=a042581f4e29026704d'} 
              alt={userProfile.name} 
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 truncate">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.displayName || userProfile.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {currentUser?.email || userProfile.institution}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
