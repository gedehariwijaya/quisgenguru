import { Quiz, QuizAttempt, UserProfile } from '../types';
import { initialUserProfile, sampleSavedQuizzes } from '../data/sampleQuizzes';

const STORAGE_KEYS = {
  QUIZZES: 'quizgen_quizzes_v1',
  ATTEMPTS: 'quizgen_attempts_v1',
  PROFILE: 'quizgen_profile_v1',
  FAVORITES: 'quizgen_favorites_v1',
};

export function getStoredQuizzes(): Quiz[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    if (!raw) {
      // Seed with initial high quality samples
      saveQuizzes(sampleSavedQuizzes);
      return sampleSavedQuizzes;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : sampleSavedQuizzes;
  } catch (e) {
    console.error('Failed to load quizzes from storage:', e);
    return sampleSavedQuizzes;
  }
}

export function saveQuizzes(quizzes: Quiz[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  } catch (e) {
    console.error('Failed to save quizzes:', e);
  }
}

export function addQuiz(quiz: Quiz): Quiz[] {
  const current = getStoredQuizzes();
  const updated = [quiz, ...current.filter(q => q.id !== quiz.id)];
  saveQuizzes(updated);
  return updated;
}

export function updateQuiz(quiz: Quiz): Quiz[] {
  const current = getStoredQuizzes();
  const updated = current.map(q => q.id === quiz.id ? { ...quiz, updatedAt: new Date().toISOString() } : q);
  saveQuizzes(updated);
  return updated;
}

export function deleteQuiz(quizId: string): Quiz[] {
  const current = getStoredQuizzes();
  const updated = current.filter(q => q.id !== quizId);
  saveQuizzes(updated);
  return updated;
}

export function getStoredAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!raw) {
      // Create a starter attempt for sample analytics
      const starterAttempt: QuizAttempt = {
        id: 'attempt_starter_1',
        quizId: 'quiz-sample-1',
        quizTitle: 'Kuis Evaluasi Biologi: Sistem Peredaran Darah',
        subject: 'Biologi SMA',
        completedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        score: 80,
        totalQuestions: 5,
        correctCount: 4,
        incorrectCount: 1,
        skippedCount: 0,
        totalTimeSeconds: 145,
        answers: [
          { questionId: 'q1', selectedAnswer: 3, isCorrect: true, timeSpentSeconds: 25 },
          { questionId: 'q2', selectedAnswer: 1, isCorrect: true, timeSpentSeconds: 18 },
          { questionId: 'q3', selectedAnswer: 0, isCorrect: true, timeSpentSeconds: 20 },
          { questionId: 'q4', selectedAnswer: 0, isCorrect: false, timeSpentSeconds: 42 },
          { questionId: 'q5', selectedAnswer: 2, isCorrect: true, timeSpentSeconds: 40 },
        ],
        topicBreakdown: {
          'Anatomi Jantung': { correct: 1, total: 1 },
          'Sirkulasi Darah': { correct: 1, total: 1 },
          'Komponen Darah': { correct: 1, total: 1 },
          'Pembuluh Darah': { correct: 0, total: 1 },
          'Eritrosit': { correct: 1, total: 1 },
        },
        bloomBreakdown: {
          'Mengingat (Remember)': { correct: 3, total: 3 },
          'Memahami (Understand)': { correct: 1, total: 1 },
          'Menganalisis (Analyze)': { correct: 0, total: 1 },
        },
      };
      saveAttempts([starterAttempt]);
      return [starterAttempt];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load attempts:', e);
    return [];
  }
}

export function saveAttempts(attempts: QuizAttempt[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  } catch (e) {
    console.error('Failed to save attempts:', e);
  }
}

export function addAttempt(attempt: QuizAttempt): QuizAttempt[] {
  const current = getStoredAttempts();
  const updated = [attempt, ...current];
  saveAttempts(updated);
  return updated;
}

export function getStoredUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      saveUserProfile(initialUserProfile);
      return initialUserProfile;
    }
    return JSON.parse(raw);
  } catch (e) {
    return initialUserProfile;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

export function exportBackupData(): string {
  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    profile: getStoredUserProfile(),
    quizzes: getStoredQuizzes(),
    attempts: getStoredAttempts(),
  };
  return JSON.stringify(backup, null, 2);
}

export function exportBackupJSON(): void {
  const data = exportBackupData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QuizGen_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackupJSON(jsonString: string): { quizzes: Quiz[]; attempts: QuizAttempt[]; profile: UserProfile } | null {
  try {
    const data = JSON.parse(jsonString);
    if (!data.quizzes || !Array.isArray(data.quizzes)) return null;
    const quizzes = data.quizzes;
    const attempts = data.attempts || [];
    const profile = data.profile || initialUserProfile;
    saveQuizzes(quizzes);
    saveAttempts(attempts);
    saveUserProfile(profile);
    return { quizzes, attempts, profile };
  } catch (e) {
    console.error('Failed to parse backup JSON:', e);
    return null;
  }
}

// Convenient Aliases
export const loadQuizzes = getStoredQuizzes;
export const loadAttempts = getStoredAttempts;
export const loadUserProfile = getStoredUserProfile;
export const saveAttempt = addAttempt;
