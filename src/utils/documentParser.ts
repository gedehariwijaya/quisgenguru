/**
 * Client-side multi-format document parser & extractor
 * Supports: PDF, DOCX, TXT, MD, CSV, JSON, PPTX text representations
 */

export interface ParsedDocument {
  name: string;
  size: number;
  type: string;
  text: string;
  base64?: string;
  preview: string;
  charCount: number;
  wordCount: number;
}

export async function parseDocumentFile(file: File): Promise<ParsedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const size = file.size;
  const name = file.name;
  let text = '';
  let base64: string | undefined;

  // Read Base64 representation (especially useful for PDF direct AI multimodal analysis)
  const base64Promise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // remove data URL prefix e.g. "data:application/pdf;base64,"
      const base64Data = result.split(',')[1] || result;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  if (extension === 'txt' || extension === 'md' || extension === 'csv' || extension === 'json' || extension === 'html') {
    text = await readFileAsText(file);
    base64 = await base64Promise;
  } else if (extension === 'pdf') {
    base64 = await base64Promise;
    // Extract readable text streams from PDF buffer if available
    try {
      text = await extractTextFromPDF(file);
    } catch (e) {
      console.warn('Text extraction fallback for PDF:', e);
      text = `Dokumen PDF: ${name} (${Math.round(size / 1024)} KB). Konten akan dianalisis langsung oleh model AI multimodal.`;
    }
  } else if (extension === 'docx' || extension === 'doc') {
    base64 = await base64Promise;
    try {
      text = await extractTextFromDocx(file);
    } catch (e) {
      console.warn('Docx extraction fallback:', e);
      text = await readFileAsText(file);
    }
  } else if (extension === 'pptx' || extension === 'ppt') {
    base64 = await base64Promise;
    try {
      text = await extractTextFromDocx(file); // PPTX uses similar zip XML structure
    } catch (e) {
      text = `Presentasi: ${name}.`;
    }
  } else {
    // generic fallback
    text = await readFileAsText(file);
    base64 = await base64Promise;
  }

  const cleanText = text.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, ' ').trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = cleanText.length;
  const preview = cleanText.slice(0, 300) + (cleanText.length > 300 ? '...' : '');

  return {
    name,
    size,
    type: file.type || extension,
    text: cleanText,
    base64,
    preview: preview || `File ${name} siap dianalisis`,
    charCount,
    wordCount,
  };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string || '');
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Basic client-side text extractor from PDF binary stream without heavy external bundles
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const textDecoder = new TextDecoder('latin1');
  const rawString = textDecoder.decode(uint8);

  const textChunks: string[] = [];
  
  // Match standard PDF text operators: (Text) Tj, [(T)(e)(x)(t)] TJ, or BT ... ET blocks
  const btRegex = /BT[\s\S]*?ET/g;
  let btMatch: RegExpExecArray | null;

  while ((btMatch = btRegex.exec(rawString)) !== null) {
    const block = btMatch[0];
    // Find (text) Tj
    const tjRegex = /\((.*?)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      if (tjMatch[1]) textChunks.push(tjMatch[1]);
    }
    // Find [(text)] TJ
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjaMatch: RegExpExecArray | null;
    while ((tjaMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = tjaMatch[1];
      const innerParts = inner.match(/\((.*?)\)/g);
      if (innerParts) {
        textChunks.push(innerParts.map(p => p.slice(1, -1)).join(' '));
      }
    }
  }

  if (textChunks.length > 5) {
    return textChunks.join(' ').replace(/\\([()\\])/g, '$1');
  }

  return `Dokumen PDF: ${file.name} (${Math.round(file.size / 1024)} KB)`;
}

/**
 * Extracts plain text from DOCX (which is a ZIP containing word/document.xml)
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const text = await readFileAsText(file);
  // Remove XML tags and extract text inside <w:t> tags
  const wtMatches = text.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
  if (wtMatches && wtMatches.length > 0) {
    return wtMatches
      .map(match => match.replace(/<[^>]+>/g, ''))
      .join(' ')
      .replace(/\s+/g, ' ');
  }

  // Fallback regex to clean basic tags
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.length > 20 ? stripped : `Dokumen Word: ${file.name}`;
}
