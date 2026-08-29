import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emitAppEvent, APP_EVENTS } from '../utils/appEvents';

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function cleanExtractText(rawText, fileName = '', courseName = '') {
  if (!rawText || typeof rawText !== 'string') {
    return `Course syllabus and learning materials for ${courseName || 'this course'}.`;
  }

  // Remove raw PDF binary tokens, object headers, and stream dictionaries
  let clean = rawText
    .replace(/%PDF-[0-9.]+/gi, '')
    .replace(/<<[\s\S]*?>>/gi, '')
    .replace(/\b\d+\s+\d+\s+obj\b/gi, '')
    .replace(/\bendobj\b/gi, '')
    .replace(/stream[\s\S]*?endstream/gi, '')
    .replace(/xref[\s\S]*?trailer/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If text is binary garbage or too short after stripping PDF markers, generate clean semantic summary
  const hasTooManySymbols = (clean.match(/[^a-zA-Z0-9\s.,!?:;'"()-]/g) || []).length > clean.length * 0.3;
  if (clean.length < 30 || hasTooManySymbols) {
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Course Document';
    return `Course reference document for ${courseName || 'enrolled course'} (${baseName}).`;
  }

  return clean.slice(0, 8000);
}

// ── Smart Multi-Domain Auto-Classifier ─────────────────────────────────────────
export function classifyDocumentToClass(fileData, enrolledClasses = []) {
  const rawText = `${fileData.fileName || ''} ${fileData.title || ''} ${(fileData.content || '').slice(0, 800)}`;
  
  const normalized = rawText
    .toLowerCase()
    .replace(/([a-z])([0-9])/g, '$1 $2 ')
    .replace(/([0-9])([a-z])/g, ' $1 $2')
    .replace(/[-_./\\(),:]/g, ' ');

  const fileWords = normalized.split(/\s+/).filter(w => w.length > 0);
  const fileWordSet = new Set(fileWords);
  const fullText = normalized.replace(/\s+/g, ' ');

  let bestClass = null;
  let bestScore = 0;

  for (const cls of enrolledClasses) {
    const rawName = (cls.name || '').toLowerCase();
    const cleanName = rawName
      .replace(/tag\/advanced|tag\/ap|ap|honors|cp|gt|tag\//gi, ' ')
      .replace(/[-_./\\(),:]/g, ' ')
      .trim();

    const classWords = cleanName.split(/\s+/).filter(w => w.length > 1);
    let score = 0;

    for (const cw of classWords) {
      if (['and', 'the', 'for', 'intro', 'tag', 'advanced'].includes(cw)) continue;
      if (fileWordSet.has(cw)) {
        score += 50;
      } else {
        for (const fw of fileWords) {
          if (fw.length >= 3 && cw.length >= 3) {
            if (fw === cw || fw.startsWith(cw) || cw.startsWith(fw)) score += 35;
            else if (fw.length >= 4 && cw.length >= 4 && levenshtein(fw, cw) <= 1) score += 40;
          }
        }
      }
    }

    if (/comp|cs|computer|code/i.test(rawName)) {
      if (/computer|science|principles|compsci|\bcs\b|programming|coding|java|python|binary|logic gate/i.test(fullText)) {
        score += 60;
      }
    }

    if (/bio|biology/i.test(rawName)) {
      if (/biology|\bbio\b|cellular|cells|genetics|dna|photosynthesis|respiration|organism/i.test(fullText)) {
        score += 60;
      }
    }

    if (/alg|algebra|math/i.test(rawName)) {
      if (/algebra|\balg\b|quadratic|polynomial|linear|equation|matrices/i.test(fullText)) {
        score += 60;
      }
    }

    if (/eng|english|ela|lit/i.test(rawName)) {
      if (/english|\beng\b|literature|\blit\b|essay|paragraph|thesis|rhetorical|reading/i.test(fullText)) {
        score += 60;
      }
    }

    if (/span|spanish|espan/i.test(rawName)) {
      if (/spanish|spoansh|\bspan\b|espanol|español|lengua|vocabulario|gramatica/i.test(fullText)) {
        score += 60;
      } else {
        for (const fw of fileWords) {
          if (fw.length >= 4 && levenshtein(fw, 'spanish') <= 2) score += 60;
        }
      }
    }

    if (/geo|geography|aphg|history/i.test(rawName)) {
      if (/aphg|geography|\bgeo\b|migration|population|demographic|urban|agriculture|history/i.test(fullText)) {
        score += 60;
      }
    }

    if (/engineer|ied|cad/i.test(rawName)) {
      if (/engineering|\bied\b|\bcad\b|3d|modeling|inventor|prototype|dimensioning/i.test(fullText)) {
        score += 60;
      }
    }

    if (/fitness|wellness|pe|health/i.test(rawName)) {
      if (/fitness|wellness|\bpe\b|health|workout|cardio/i.test(fullText)) {
        score += 60;
      }
    }

    if (score > 0) {
      if (/\b(iii|3)\b/i.test(rawName) && (fileWordSet.has('iii') || fileWordSet.has('3') || fullText.includes('3'))) score += 15;
      if (/\b(ii|2)\b/i.test(rawName) && (fileWordSet.has('ii') || fileWordSet.has('2') || fullText.includes('2'))) score += 15;
      if (/\b(i|1)\b/i.test(rawName) && (fileWordSet.has('i') || fileWordSet.has('1') || fullText.includes('1'))) score += 15;
    }

    if (score > bestScore) {
      bestScore = score;
      bestClass = cls;
    }
  }

  const targetClass = bestScore > 0 ? bestClass : { id: 'general', name: 'General Academic' };
  const docType = rawText.includes('syllabus') ? 'syllabus' : rawText.includes('target') ? 'learning_target' : 'notes';

  return { matchedClass: targetClass, type: docType };
}

export const useDocStore = create(
  persist(
    (set, get) => ({
      documents: [],
      dailyNotes: [],

      addDocument: (doc) => {
        const sanitizedContent = cleanExtractText(doc.content, doc.fileName || doc.title, doc.className);
        const newDoc = {
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          dateAdded: new Date().toISOString().split('T')[0],
          ...doc,
          content: sanitizedContent
        };
        set((state) => {
          // Remove any previous doc with identical title, fileName, and classId to prevent duplicate stacking
          const remaining = (state.documents || []).filter(
            d => !(d.classId === newDoc.classId && d.title?.trim().toLowerCase() === newDoc.title?.trim().toLowerCase() && d.fileName === newDoc.fileName)
          );
          return { documents: [newDoc, ...remaining] };
        });
        return newDoc;
      },

      autoClassifyAndAddDocument: (fileData, enrolledClasses = []) => {
        const { matchedClass, type } = classifyDocumentToClass(fileData, enrolledClasses);
        const sanitizedContent = cleanExtractText(fileData.content, fileData.fileName || fileData.title, matchedClass.name);

        const newDoc = {
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          dateAdded: new Date().toISOString().split('T')[0],
          classId: matchedClass.id,
          className: matchedClass.name,
          title: fileData.title || fileData.fileName?.replace(/\.[^/.]+$/, '') || 'Course Document',
          unit: fileData.unit || 'General',
          type: fileData.type || type,
          content: sanitizedContent,
          fileName: fileData.fileName || 'document.pdf'
        };

        set((state) => {
          const remaining = (state.documents || []).filter(
            d => !(d.classId === newDoc.classId && d.title?.trim().toLowerCase() === newDoc.title?.trim().toLowerCase() && d.fileName === newDoc.fileName)
          );
          return { documents: [newDoc, ...remaining] };
        });

        emitAppEvent(APP_EVENTS.DOC_ADDED, newDoc);

        return { doc: newDoc, matchedClass };
      },

      classifyFileForPreview: (fileData, enrolledClasses = []) => {
        return classifyDocumentToClass(fileData, enrolledClasses);
      },

      removeDocument: (id) => set((state) => {
        emitAppEvent(APP_EVENTS.DOC_DELETED, { id });
        return {
          documents: (state.documents || []).filter(d => d.id !== id)
        };
      }),

      clearAllDocuments: () => {
        emitAppEvent(APP_EVENTS.DOC_DELETED, { all: true });
        set({ documents: [] });
      },

      updateDocument: (id, updates) => set((state) => {
        emitAppEvent(APP_EVENTS.DOC_ADDED, { id, ...updates });
        return {
          documents: (state.documents || []).map(d => d.id === id ? { ...d, ...updates } : d)
        };
      }),

      addDailyNote: (note) => {
        const newNote = {
          id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          dateAdded: new Date().toISOString().split('T')[0],
          ...note
        };
        set((state) => ({
          dailyNotes: [newNote, ...(state.dailyNotes || [])]
        }));
        return newNote;
      },

      removeDailyNote: (id) => set((state) => ({
        dailyNotes: (state.dailyNotes || []).filter(n => n.id !== id)
      })),

      getDocsForClass: (classNameOrId) => {
        const docs = get().documents || [];
        if (!classNameOrId) return docs;
        return docs.filter(d => 
          (d.classId && d.classId === classNameOrId) ||
          (d.className && d.className.toLowerCase().includes(classNameOrId.toLowerCase()))
        );
      },

      getAllDocsContext: () => {
        const { documents, dailyNotes } = get();
        let context = '';

        if (documents && documents.length > 0) {
          context += documents.slice(0, 10).map(d => `
=== COURSE DOCUMENT: ${d.title} ===
Class: ${d.className} | Unit: ${d.unit} | Type: ${d.type}
Content Summary:
${(d.content || '').slice(0, 3000)}
`).join('\n\n');
        }

        if (dailyNotes && dailyNotes.length > 0) {
          context += '\n\n=== RECENT DAILY STUDY NOTES ===\n';
          context += dailyNotes.slice(0, 10).map(n => `
[${n.dateAdded}] Class: ${n.className} | Topic: ${n.topic}
Notes: ${(n.content || '').slice(0, 1000)}
`).join('\n');
        }

        return context;
      }
    }),
    {
      name: 'ascend-docs-store-v2',
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          if (item) return JSON.parse(item);
          // Check legacy key and migrate
          const legacy = localStorage.getItem('ascend-docs-store');
          if (legacy) {
            localStorage.setItem(name, legacy);
            localStorage.removeItem('ascend-docs-store');
            return JSON.parse(legacy);
          }
          return null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    }
  )
);
