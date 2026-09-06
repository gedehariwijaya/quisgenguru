import React, { useState, useEffect } from 'react';
import { Sidebar, TopHeader, MobileDrawer } from './components/Navbar';
import { QuizGenerator } from './components/QuizGenerator';
import { ExamScriptViewer } from './components/ExamScriptViewer';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResults } from './components/QuizResults';
import { QuizLibrary } from './components/QuizLibrary';
import { UserProfileView } from './components/UserProfileView';
import { 
  Quiz, QuizAttempt, UserProfile, NavigationTab 
} from './types';
import { 
  loadQuizzes, saveQuizzes, loadAttempts, saveAttempt, 
  loadUserProfile, saveUserProfile 
} from './utils/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  logoutFirebase, 
  saveQuizToFirestore, 
  deleteQuizFromFirestore, 
  saveProfileToFirestore, 
  subscribeToQuizzes 
} from './lib/firebase';

export const App: React.FC = () => {
  // Navigation state
  const [activeTab, setActiveTab] = useState<NavigationTab>('generator');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Application Data state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile());

  // Firebase state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Active session state
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedQ = loadQuizzes();
    const loadedA = loadAttempts();
    const loadedP = loadUserProfile();
    setQuizzes(loadedQ);
    setAttempts(loadedA);
    setUserProfile(loadedP);
  }, []);

  // Firebase Authentication & Cloud Firestore Subscription
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync profile details
        setUserProfile((prev) => {
          const updated: UserProfile = {
            ...prev,
            name: user.displayName || prev.name,
            email: user.email || prev.email,
            avatar: user.photoURL || prev.avatar,
          };
          saveUserProfile(updated);
          saveProfileToFirestore(user.uid, {
            name: updated.name,
            email: updated.email,
            institution: updated.institution,
          }).catch(console.error);
          return updated;
        });

        // Real-time subscribe to Cloud Firestore
        setIsSyncing(true);
        unsubscribeFirestore = subscribeToQuizzes(
          user.uid,
          (remoteQuizzes) => {
            setIsSyncing(false);
            if (remoteQuizzes && remoteQuizzes.length > 0) {
              setQuizzes(remoteQuizzes);
              saveQuizzes(remoteQuizzes);
            } else {
              // Upload existing local quizzes to Firestore so nothing is lost
              const local = loadQuizzes();
              if (local && local.length > 0) {
                local.forEach((q) => {
                  saveQuizToFirestore(user.uid, q).catch(console.error);
                });
              }
            }
          },
          (err) => {
            setIsSyncing(false);
            console.warn('Firestore subscription fallback:', err);
          }
        );
      } else {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  // Update storage when quizzes change
  const handleUpdateQuizzes = (newQuizzes: Quiz[]) => {
    setQuizzes(newQuizzes);
    saveQuizzes(newQuizzes);
  };

  // Google Login & Logout handlers
  const handleLoginGoogle = async () => {
    try {
      setIsSyncing(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Handle newly generated quiz -> Immediately show the Exam Script (Naskah Soal) & save to Cloud Firestore
  const handleQuizGenerated = async (newQuiz: Quiz) => {
    const updated = [newQuiz, ...quizzes];
    handleUpdateQuizzes(updated);
    setCurrentQuiz(newQuiz);
    setActiveTab('script_view');

    // Save to Cloud Firestore
    if (currentUser) {
      try {
        setIsSyncing(true);
        await saveQuizToFirestore(currentUser.uid, newQuiz);
      } catch (err) {
        console.error('Failed to save to Firestore:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Open Exam Script
  const handleOpenExamScript = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setActiveTab('script_view');
  };

  // Handle quiz start if needed
  const handleStartQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setActiveTab('player');
  };

  // Handle quiz completion
  const handleFinishQuiz = (attempt: QuizAttempt) => {
    saveAttempt(attempt);
    setAttempts(prev => [attempt, ...prev]);
    setCurrentAttempt(attempt);
    setActiveTab('results');
  };

  // Retake quiz
  const handleRetakeQuiz = (quizId?: string) => {
    const target = quizId ? quizzes.find(q => q.id === quizId) : currentQuiz;
    if (target) {
      setCurrentQuiz(target);
      setCurrentAttempt(null);
      setActiveTab('player');
    }
  };

  // Handle 1-Click Remedial Quiz creation from weak areas
  const handleRemedialGenerated = (remedialQuiz: Quiz) => {
    const updated = [remedialQuiz, ...quizzes];
    handleUpdateQuizzes(updated);
    setCurrentQuiz(remedialQuiz);
    setActiveTab('script_view');

    if (currentUser) {
      saveQuizToFirestore(currentUser.uid, remedialQuiz).catch(console.error);
    }
  };

  // Quiz CRUD in Library with Cloud Firestore persistence
  const handleDeleteQuiz = async (quizId: string) => {
    const filtered = quizzes.filter(q => q.id !== quizId);
    handleUpdateQuizzes(filtered);
    if (currentQuiz?.id === quizId) {
      setCurrentQuiz(null);
      setActiveTab('library');
    }

    if (currentUser) {
      try {
        await deleteQuizFromFirestore(currentUser.uid, quizId);
      } catch (err) {
        console.error('Failed to delete from Firestore:', err);
      }
    }
  };

  const handleDuplicateQuiz = (quiz: Quiz) => {
    const duplicated: Quiz = {
      ...quiz,
      id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${quiz.title} (Salinan)`,
      createdAt: new Date().toISOString(),
    };
    handleUpdateQuizzes([duplicated, ...quizzes]);

    if (currentUser) {
      saveQuizToFirestore(currentUser.uid, duplicated).catch(console.error);
    }
  };

  const handleUpdateSingleQuiz = (updatedQuiz: Quiz) => {
    const updatedList = quizzes.map(q => q.id === updatedQuiz.id ? updatedQuiz : q);
    handleUpdateQuizzes(updatedList);
    setCurrentQuiz(updatedQuiz);

    if (currentUser) {
      saveQuizToFirestore(currentUser.uid, updatedQuiz).catch(console.error);
    }
  };

  // Profile update
  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    saveUserProfile(updated);
    if (currentUser) {
      saveProfileToFirestore(currentUser.uid, {
        name: updated.name,
        email: updated.email,
        institution: updated.institution,
      }).catch(console.error);
    }
  };

  const handleRestoreData = (newQ: Quiz[], newA: QuizAttempt[], newP: UserProfile) => {
    setQuizzes(newQ);
    saveQuizzes(newQ);
    setAttempts(newA);
    localStorage.setItem('quiz_gen_attempts', JSON.stringify(newA));
    setUserProfile(newP);
    saveUserProfile(newP);

    if (currentUser) {
      newQ.forEach(q => {
        saveQuizToFirestore(currentUser.uid, q).catch(console.error);
      });
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] font-sans text-slate-800 overflow-hidden select-none sm:select-auto">
      {/* Sleek Left Sidebar for Desktop */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        savedQuizzesCount={quizzes.length}
        attemptsCount={attempts.length}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onLogout={handleLogout}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        savedQuizzesCount={quizzes.length}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Sleek Top Header Bar */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userProfile={userProfile}
          savedQuizzesCount={quizzes.length}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          currentUser={currentUser}
          onLoginGoogle={handleLoginGoogle}
          onLogout={handleLogout}
          isSyncing={isSyncing}
        />

        {/* Scrollable View Area */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'generator' && (
              <QuizGenerator
                onQuizGenerated={handleQuizGenerated}
                userProfile={userProfile}
                savedQuizzes={quizzes}
                onOpenExamScript={handleOpenExamScript}
                onNavigateLibrary={() => setActiveTab('library')}
              />
            )}

            {/* Exam Script Viewer: Student Paper, Teacher Key, AI Visual Prompts, Blueprint */}
            {activeTab === 'script_view' && currentQuiz && (
              <ExamScriptViewer
                quiz={currentQuiz}
                userName={userProfile.name}
                institutionName={userProfile.institution}
                onBackToGenerator={() => setActiveTab('generator')}
                onUpdateQuiz={handleUpdateSingleQuiz}
              />
            )}

            {activeTab === 'player' && currentQuiz && (
              <QuizPlayer
                quiz={currentQuiz}
                onFinishQuiz={handleFinishQuiz}
                onExit={() => setActiveTab('script_view')}
              />
            )}

            {activeTab === 'results' && currentQuiz && currentAttempt && (
              <QuizResults
                quiz={currentQuiz}
                attempt={currentAttempt}
                userName={userProfile.name}
                institutionName={userProfile.institution}
                onRetake={() => handleRetakeQuiz(currentQuiz.id)}
                onNewQuiz={() => setActiveTab('generator')}
                onRemedialQuizGenerated={handleRemedialGenerated}
              />
            )}

            {activeTab === 'library' && (
              <QuizLibrary
                quizzes={quizzes}
                attempts={attempts}
                onSelectQuiz={handleStartQuiz}
                onOpenExamScript={handleOpenExamScript}
                onDeleteQuiz={handleDeleteQuiz}
                onDuplicateQuiz={handleDuplicateQuiz}
                onUpdateQuiz={handleUpdateSingleQuiz}
                onCreateNew={() => setActiveTab('generator')}
                institutionName={userProfile.institution}
                currentUser={currentUser}
                onLoginGoogle={handleLoginGoogle}
              />
            )}

            {activeTab === 'profile' && (
              <UserProfileView
                profile={userProfile}
                quizzes={quizzes}
                attempts={attempts}
                onUpdateProfile={handleUpdateProfile}
                onRestoreData={handleRestoreData}
                currentUser={currentUser}
                onLoginGoogle={handleLoginGoogle}
                onLogout={handleLogout}
                isSyncing={isSyncing}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;

