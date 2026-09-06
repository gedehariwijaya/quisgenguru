export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_the_blank';

export type NavigationTab = 'generator' | 'script_view' | 'library' | 'profile' | 'player';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type AssessmentFocus = 'standard' | 'hots' | 'tka' | 'hots_tka';

export type VisualType = 'diagram' | 'chart' | 'graph' | 'illustration' | 'table' | 'map' | 'infographic' | 'schematic' | 'none';

export type BloomTaxonomy = 'Mengingat (Remember)' | 'Memahami (Understand)' | 'Menerapkan (Apply)' | 'Menganalisis (Analyze)' | 'Mengevaluasi (Evaluate)' | 'Mencipta (Create)';

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // for multiple_choice and true_false
  correctAnswer: string | number; // index for MCQ (e.g. 0, 1, 2, 3) or string for short answer / T/F
  explanation: string;
  difficulty: DifficultyLevel;
  bloomLevel?: string;
  subtopic?: string;
  hint?: string;
  stimulus?: string; // Teks wacana / skenario kontekstual untuk soal HOTS / TKA
  categoryType?: 'HOTS' | 'TKA' | 'Reguler' | 'Campuran';
  needsVisual?: boolean;
  visualType?: VisualType;
  visualDescription?: string; // Penjelasan tentang gambar/grafik/diagram yang dibutuhkan
  visualPrompt?: string; // Prompt siap pakai untuk AI image generator (Midjourney, DALL-E, Canva, ChatGPT)
  visualAspectRatio?: string; // e.g. "16:9", "1:1", "4:3"
  customImageUrl?: string; // Jika guru mengunggah atau menautkan gambar hasil generate AI lain
}

export interface Quiz {
  id: string;
  userId?: string;
  userEmail?: string;
  title: string;
  description: string;
  subject: string;
  targetLevel?: string; // e.g. "SMA / SMK", "SMP", "Universitas", "Umum"
  fase?: string; // e.g. "Fase E (Kelas 10)", "Fase F (Kelas 11)", "Fase F (Kelas 12)"
  language: 'id' | 'en';
  createdAt: string;
  updatedAt?: string;
  sourceType: 'file' | 'text' | 'topic' | 'template';
  sourceFileName?: string;
  sourceContentPreview?: string;
  questions: Question[];
  estimatedMinutes: number;
  tags: string[];
  assessmentFocus?: AssessmentFocus;
  institutionName?: string;
  academicYear?: string;
  examInstructions?: string;
}

export interface QuestionAnswer {
  questionId: string;
  selectedAnswer: string | number | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  completedAt: string;
  score: number; // 0 - 100
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalTimeSeconds: number;
  answers: QuestionAnswer[];
  topicBreakdown?: {
    [topic: string]: { correct: number; total: number };
  };
  bloomBreakdown?: {
    [bloom: string]: { correct: number; total: number };
  };
}

export interface UserProfile {
  name: string;
  email: string;
  role: 'Guru' | 'Dosen' | 'Siswa' | 'Mahasiswa' | 'Tutor' | 'Umum';
  institution: string;
  avatar: string;
  bio?: string;
  joinedDate: string;
  preferences: {
    defaultLanguage: 'id' | 'en';
    defaultQuestionCount: number;
    defaultDifficulty: 'all' | 'easy' | 'medium' | 'hard';
    soundEffects: boolean;
    timerEnabled: boolean;
  };
}

export interface QuizGenerationParams {
  content?: string;
  topic?: string;
  fileBase64?: string;
  fileName?: string;
  mimeType?: string;
  questionCount: number;
  questionTypes: QuestionType[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  language: 'id' | 'en';
  targetLevel: string;
  fase?: string;
  focusArea?: string;
  includeExplanations: boolean;
  includeHints: boolean;
}
