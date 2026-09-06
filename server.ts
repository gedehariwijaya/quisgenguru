import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Use high body limit for file upload base64 strings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy get Google GenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Resilient Gemini generateContent caller with exponential backoff and model cascade
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    primaryModel?: string;
  }
) {
  // Sequence of high-performance models to try if high demand occurs
  const modelsToTry = [
    params.primaryModel || 'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini API] Attempting generateContent with model: ${model} (attempt ${attempt}/${maxAttempts})`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStatus = err?.status || err?.code;
        const errMsg = err?.message || String(err);
        const isUnavailableOrRateLimited =
          errStatus === 503 ||
          errStatus === 'UNAVAILABLE' ||
          errStatus === 429 ||
          errStatus === 'RESOURCE_EXHAUSTED' ||
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('spikes in demand') ||
          errMsg.includes('overloaded') ||
          errMsg.includes('temporarily');

        console.warn(`[Gemini API] Model ${model} returned error (attempt ${attempt}): ${errMsg}`);

        if (isUnavailableOrRateLimited && attempt < maxAttempts) {
          const delayMs = attempt * 800 + Math.random() * 300;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        // Move to next model in cascade
        break;
      }
    }
  }

  throw lastError;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Generate Quiz / Naskah Soal API
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const {
      content,
      topic,
      fileBase64,
      fileName,
      mimeType,
      questionCount = 10,
      questionTypes = ['multiple_choice'],
      difficulty = 'mixed',
      assessmentFocus = 'hots_tka', // 'standard' | 'hots' | 'tka' | 'hots_tka'
      language = 'id',
      targetLevel = 'SMA / SMK',
      fase = 'Fase E (Kelas 10)',
      focusArea = '',
      includeExplanations = true,
      includeHints = true,
      includeVisualPrompts = true,
    } = req.body;

    const ai = getGenAI();

    const langPrompt = language === 'id' 
      ? 'Bahasa Indonesia yang baku, akademis, jelas, dan edukatif' 
      : 'Clear and academic educational English';

    let assessmentInstructions = '';
    if (assessmentFocus === 'hots') {
      assessmentInstructions = `
FOKUS PENYUSUNAN SOAL: HOTS (Higher Order Thinking Skills)
- Wajib menyusun soal level kognitif tinggi: C4 (Menganalisis/Analyze), C5 (Mengevaluasi/Evaluate), dan C6 (Mencipta/Create).
- Setiap soal HARUS diawali dengan STIMULUS kontekstual (studi kasus nyata, fenomena sains/sosial, kutipan eksperimen, atau skenario pemecahan masalah) yang tidak langsung dapat dijawab hanya dengan menghafal rumus/definisi.
- Pertanyaan menuntut penalaran kritis, sintesis informasi, dan pengambilan kesimpulan.`;
    } else if (assessmentFocus === 'tka') {
      assessmentInstructions = `
FOKUS PENYUSUNAN SOAL: TKA (Tes Kemampuan Akademik)
- Menguji penguasaan materi kurikulum secara mendalam, konsep esensial, penalaran akademik analitis, literasi bacaan saintifik, dan numerasi.
- Soal disusun berstandar ujian masuk perguruan tinggi / asesmen nasional dengan distractor (opsi pengecoh) yang berbasis miskonsepsi umum siswa.`;
    } else if (assessmentFocus === 'hots_tka') {
      assessmentInstructions = `
FOKUS PENYUSUNAN SOAL: KOMBINASI HOTS & TKA
- Kombinasi seimbang antara soal bernalar tinggi HOTS (C4-C6 dengan stimulus dunia nyata) dan penguasaan konsep akademik mendalam TKA.
- Setiap soal harus memiliki nilai uji yang solid dan mengukur pemahaman mendalam bukan hafalan dangkal.`;
    } else {
      assessmentInstructions = `
FOKUS PENYUSUNAN SOAL: STANDAR KURIKULUM LENGKAP
- Meliputi spektrum kognitif berimbang dari pemahaman konsep dasar (LOTS C2/C3) hingga penalaran kritis (HOTS C4/C5).`;
    }

    const visualPromptInstruction = `
KETENTUAN KEBUTUHAN GAMBAR / GRAFIK / DIAGRAM / TABEL:
- Jika sebuah butir soal membutuhkan atau sangat relevan didukung dengan visual (misalnya diagram anatomi, bagan siklus, grafik fungsi matematika/fisika/ekonomi, skema rangkaian listrik, peta geografi, infografis data, tabel observasi):
  1. Set needsVisual = true.
  2. Tentukan visualType ('diagram' | 'chart' | 'graph' | 'illustration' | 'table' | 'map' | 'infographic' | 'schematic').
  3. Berikan visualDescription dalam Bahasa Indonesia: Jelaskan secara spesifik apa yang harus tampak pada gambar tersebut dan bagaimana siswa menggunakannya untuk menjawab.
  4. Berikan visualPrompt dalam Bahasa Inggris: Susun PROMPT AI IMAGE GENERATOR yang sangat detail, profesional, dan presisi (siap langsung di-copy-paste oleh guru ke Midjourney, DALL-E 3, Canva AI, atau ChatGPT). Cantumkan gaya visual (misal: "Educational 2D vector schematic...", "Clear scientific diagram with white background, high contrast, labeled elements...").
  5. PENTING: JANGAN buat gambar langsung, cukup sediakan PROMPT AI yang lengkap dan presisi untuk dibuat guru di AI lain.
- Jika soal tidak memerlukan visual (cukup teks/wacana), set needsVisual = false dan visualType = 'none'.`;

    const systemInstruction = `Anda adalah ahli pengembang kurikulum nasional SMA (Kurikulum Merdeka), pembuat naskah ujian standar, dan spesialis asesmen pendidikan profesional. 
Tugas Anda adalah menyusun NASKAH SOAL UJIAN / ASESMEN TINGKAT SMA LENGKAP berkualitas tinggi, objektif, bebas ambiguitas, dan sesuai dengan standar Taksonomi Bloom berdasarkan dokumen atau topik rujukan yang diberikan.
Gunakan ${langPrompt}.
Tingkat sasaran: Jenjang SMA (Sekolah Menengah Atas) - ${fase}.
Tingkat kesulitan: ${difficulty}.
Tipe soal yang diminta: ${questionTypes.join(', ')}.
Jumlah soal yang harus dihasilkan: Tepat ${questionCount} butir soal.
${focusArea ? `Fokus materi khusus: ${focusArea}` : ''}
${assessmentInstructions}
${visualPromptInstruction}

ATURAN WAJIB BUTIR SOAL SMA:
1. Pertanyaan harus jelas, akademis, tidak ambigu, dan berbasis stimulus kontekstual.
2. WAJIB OPSI A SAMPAI E: Karena ini naskah ujian tingkat SMA, setiap butir soal pilihan ganda (multiple_choice) HARUS memiliki TEPAT 5 PILIHAN JAWABAN (A, B, C, D, dan E). Opsi pengecoh (distractor) harus masuk akal dan bermutu. Nilai correctAnswer adalah index angka (0 untuk A, 1 untuk B, 2 untuk C, 3 untuk D, 4 untuk E).
3. Berikan penjelasan (explanation) komprehensif yang menerangkan kunci jawaban dan rasionalisasi konsep.
4. Berikan stimulus (stimulus) untuk soal bernalar tinggi HOTS/TKA yang memerlukan wacana atau skenario pengantar.`;

    const promptText = `Silakan susun naskah soal ujian sebanyak ${questionCount} butir soal dari materi berikut:
${topic ? `Topik / Judul: ${topic}\n` : ''}
${fileName ? `Nama Dokumen Sumber: ${fileName}\n` : ''}
${content ? `Isi Dokumen / Teks Rujukan:\n"""\n${content.slice(0, 45000)}\n"""\n` : ''}
Pastikan format JSON yang dihasilkan valid sesuai struktur yang diminta.`;

    const contentsPayload: any = [];

    // If PDF or image file base64 is provided directly
    if (fileBase64 && mimeType && (mimeType === 'application/pdf' || mimeType.startsWith('image/'))) {
      contentsPayload.push({
        inlineData: {
          mimeType: mimeType,
          data: fileBase64,
        },
      });
    }

    contentsPayload.push({
      text: promptText,
    });

    const response = await generateContentWithRetryAndFallback(ai, {
      contents: contentsPayload.length === 1 ? contentsPayload[0].text : { parts: contentsPayload },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Judul Naskah Soal Ujian yang formal dan profesional' },
            description: { type: Type.STRING, description: 'Deskripsi cakupan kompetensi dan materi naskah soal' },
            subject: { type: Type.STRING, description: 'Mata pelajaran atau domain keilmuan' },
            estimatedMinutes: { type: Type.INTEGER, description: 'Estimasi alokasi waktu ujian dalam menit' },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Kata kunci kompetensi dasar',
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  stimulus: { type: Type.STRING, description: 'Wacana pengantar, studi kasus, atau skenario stimulus soal' },
                  question: { type: Type.STRING, description: 'Teks pokok pertanyaan' },
                  type: {
                    type: Type.STRING,
                    description: 'multiple_choice | true_false | short_answer | fill_in_the_blank',
                  },
                  categoryType: {
                    type: Type.STRING,
                    description: 'HOTS | TKA | Reguler',
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Tepat 5 butir pilihan jawaban (A, B, C, D, E) untuk tingkat SMA',
                  },
                  correctAnswer: {
                    type: Type.INTEGER,
                    description: 'Index jawaban benar (0=A, 1=B, 2=C, 3=D, 4=E)',
                  },
                  explanation: { type: Type.STRING, description: 'Pembahasan kunci jawaban dan analisis konsep mendalam' },
                  difficulty: { type: Type.STRING, description: 'easy | medium | hard' },
                  bloomLevel: { type: Type.STRING, description: 'Tingkatan Taksonomi Bloom (C1-C6)' },
                  subtopic: { type: Type.STRING, description: 'Konsep atau subtopik spesifik' },
                  hint: { type: Type.STRING, description: 'Petunjuk pengerjaan (scaffolding)' },
                  needsVisual: { type: Type.BOOLEAN, description: 'Apakah soal ini memerlukan gambar/grafik/diagram' },
                  visualType: { type: Type.STRING, description: 'diagram | chart | graph | illustration | table | map | infographic | schematic | none' },
                  visualDescription: { type: Type.STRING, description: 'Deskripsi gambar/grafik/diagram dalam Bahasa Indonesia' },
                  visualPrompt: { type: Type.STRING, description: 'Prompt AI siap pakai untuk Midjourney/DALL-E/Canva dalam Bahasa Inggris' },
                },
                required: ['question', 'type', 'explanation', 'difficulty'],
              },
            },
          },
          required: ['title', 'subject', 'questions'],
        },
      },
    });

    const responseText = response.text || '{}';
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('JSON parsing failed, falling back to cleanup:', parseErr);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    // Ensure questions have valid ids, options, and visual prompt metadata
    const questions = (parsedData.questions || []).map((q: any, idx: number) => {
      let finalOptions = q.options;
      if (q.type === 'multiple_choice' || !q.type) {
        if (!finalOptions || !Array.isArray(finalOptions) || finalOptions.length === 0) {
          finalOptions = ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Pilihan E'];
        } else if (finalOptions.length < 5) {
          const fallbackLetters = ['A', 'B', 'C', 'D', 'E'];
          while (finalOptions.length < 5) {
            finalOptions.push(`Pilihan ${fallbackLetters[finalOptions.length]}`);
          }
        } else if (finalOptions.length > 5) {
          finalOptions = finalOptions.slice(0, 5);
        }
      }

      return {
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        stimulus: q.stimulus || undefined,
        question: q.question || `Pertanyaan ${idx + 1}`,
        type: q.type || 'multiple_choice',
        categoryType: q.categoryType || (assessmentFocus === 'hots' ? 'HOTS' : assessmentFocus === 'tka' ? 'TKA' : 'HOTS'),
        options: finalOptions,
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : (Number(q.correctAnswer) || 0),
        explanation: q.explanation || 'Pembahasan kunci jawaban.',
        difficulty: q.difficulty || 'medium',
        bloomLevel: q.bloomLevel || 'Menganalisis (Analyze)',
        subtopic: q.subtopic || parsedData.subject || 'Umum',
        hint: q.hint || 'Perhatikan stimulus dan kata kunci soal dengan saksama.',
        needsVisual: Boolean(q.needsVisual),
        visualType: q.visualType || (q.needsVisual ? 'diagram' : 'none'),
        visualDescription: q.visualDescription || '',
        visualPrompt: q.visualPrompt || '',
        visualAspectRatio: '16:9',
      };
    });

    const quizResult = {
      id: `quiz_${Date.now()}`,
      title: parsedData.title || (topic ? `Naskah Soal: ${topic}` : 'Naskah Soal Asesmen AI'),
      description: parsedData.description || 'Naskah soal ujian otomatis dengan stimulus HOTS/TKA dan prompt visual.',
      subject: parsedData.subject || (topic || 'Umum'),
      targetLevel: targetLevel || 'SMA / SMK',
      fase: fase || 'Fase E (Kelas 10)',
      language: language || 'id',
      createdAt: new Date().toISOString(),
      sourceType: fileBase64 ? 'file' : (content ? 'text' : 'topic'),
      sourceFileName: fileName || (topic ? `${topic}.txt` : undefined),
      sourceContentPreview: content ? content.slice(0, 300) : (topic || 'Dokumen materi'),
      questions,
      estimatedMinutes: parsedData.estimatedMinutes || (questions.length * 2),
      tags: parsedData.tags || [parsedData.subject || 'Asesmen', 'HOTS', 'TKA', fase || 'Fase E'],
      assessmentFocus: assessmentFocus,
    };

    res.json({ success: true, quiz: quizResult, ...quizResult });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Gagal menyusun naskah soal.',
    });
  }
});

// Explain question or remedial tutor
app.post('/api/quiz/explain-question', async (req, res) => {
  try {
    const { question, options, selectedAnswer, correctAnswer, explanation, userQuery, language = 'id' } = req.body;
    const ai = getGenAI();

    const prompt = `Anda adalah Tutor Pembelajaran AI yang ramah, jelas, dan sabar.
Pertanyaan Soal: "${question}"
Pilihan Jawaban: ${JSON.stringify(options || [])}
Jawaban yang Dipilih Siswa: ${selectedAnswer !== undefined ? (options ? options[selectedAnswer] : selectedAnswer) : 'Tidak terjawab'}
Jawaban Benar yang Seharusnya: ${correctAnswer !== undefined ? (options ? options[correctAnswer] : correctAnswer) : 'Kunci Jawaban'}
Pembahasan Dasar: "${explanation}"

Pertanyaan / Kebutuhan Siswa: "${userQuery || 'Tolong jelaskan lebih dalam mengapa jawaban ini yang benar dan berikan contoh nyata atau analogi sederhana agar saya mudah mengingatnya.'}"

Bahasa: ${language === 'id' ? 'Bahasa Indonesia' : 'English'}.
Berikan penjelasan terstruktur:
1. Penjelasan Konsep Inti (Intuitif & Mudah Dipahami)
2. Analogi Sederhana / Contoh Sehari-hari
3. Mengapa Opsi Lain Salah (Analisis Distractor)
4. Tips Kilat / Jembatan Keledai untuk Mengingat`;

    const response = await generateContentWithRetryAndFallback(ai, {
      contents: prompt,
    });

    res.json({ success: true, explanation: response.text });
  } catch (error: any) {
    console.error('Error explaining question:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Gagal mendapatkan penjelasan AI.',
    });
  }
});

// Generate Remedial Quiz from Weak Areas
app.post('/api/quiz/generate-remedial', async (req, res) => {
  try {
    const { weakTopics = [], wrongQuestions = [], targetLevel = 'SMA / SMK', language = 'id' } = req.body;
    const ai = getGenAI();

    const prompt = `Buatkan 5 soal kuis remedial adaptif untuk siswa yang mengalami kesulitan pada topik berikut:
Topik Lemah: ${weakTopics.join(', ')}
Contoh soal yang dijawab salah sebelumnya:
${wrongQuestions.map((q: any, i: number) => `${i + 1}. ${q.question} (Subtopik: ${q.subtopic || 'Umum'})`).join('\n')}

Tingkat: ${targetLevel}
Bahasa: ${language === 'id' ? 'Bahasa Indonesia' : 'English'}
Soal harus bersifat memperkuat konsep dasar (scaffolding), memberikan petunjuk yang membangun pemahaman.`;

    const response = await generateContentWithRetryAndFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            subject: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  type: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  bloomLevel: { type: Type.STRING },
                  subtopic: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ['question', 'type', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['title', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, quiz: parsed, ...parsed });
  } catch (error: any) {
    console.error('Error generating remedial quiz:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Gagal menghasilkan kuis remedial.',
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuizGen Guru server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
