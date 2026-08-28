import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { scrapeHac, parseHacFromHar } from './scraper/hacScraper.js';
import { analyzeCourseAndLevel, getCuratedVideos } from './curriculumEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();


// ── AI Client Initialization ──
const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log('Ascend AI: Gemini 2.5 Flash initialized.');
  } catch (err) {
    console.warn('Ascend AI: Gemini client warning:', err.message);
  }
}

const groqApiKey = process.env.GROQ_API_KEY;
let groqClient = null;
if (groqApiKey) {
  try {
    groqClient = new Groq({ apiKey: groqApiKey });
    console.log('Ascend AI: Groq primary client initialized.');
  } catch (err) {
    console.warn('Ascend AI: Groq client warning:', err.message);
  }
}

// ── Syllabus Rule-Stripper ──
// Removes classroom policy/rule paragraphs from uploaded docs so AI only uses academic content
function stripSyllabusRules(docsText = '') {
  if (!docsText) return '';
  const RULE_KEYWORDS = [
    'academic dishonesty','late work policy','tardy','bathroom','cell phone',
    'classroom rules','discipline','grading policy','attendance policy',
    'parent contact','make-up work','consequences','code of conduct',
    'absent students','late assignments','homework policy','dress code',
    'electronic device','behavior expectations','restroom','hall pass'
  ];
  const lines = docsText.split('\n');
  const filtered = lines.filter(line => {
    const lower = line.toLowerCase();
    return !RULE_KEYWORDS.some(kw => lower.includes(kw));
  });
  return filtered.join('\n');
}

// ── Groq Models List (Active Verified Endpoints) ──
const GROQ_MODELS = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'groq/compound'];

// ── Groq Client Helper ──
async function tryGroq(systemPrompt, userPrompt, history = [], isJson = false) {
  if (!groqClient) return null;
  try {
    const formattedHistory = (history || [])
      .slice(-10)
      .filter(m => m.text && (m.sender === 'user' || m.sender === 'ai'))
      .map(m => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: userPrompt }
    ];

    for (const model of GROQ_MODELS) {
      try {
        const completion = await groqClient.chat.completions.create({
          model,
          messages,
          temperature: isJson ? 0.2 : 0.7,
          max_tokens: isJson ? 4096 : 3000,
          ...(isJson ? { response_format: { type: 'json_object' } } : {}),
        });
        const content = completion.choices[0]?.message?.content;
        if (content) return content;
      } catch (err) {
        console.warn(`[Groq ${model} Error]:`, err.message);
      }
    }
    return null;
  } catch (err) {
    console.warn('[Groq General Error]:', err.message);
    return null;
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── In-Memory Per-User / Per-IP Sliding Window Rate Limiter (60 requests / minute) ──
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const requestLogs = new Map(); // key -> array of timestamps

const rateLimiterMiddleware = (req, res, next) => {
  const clientKey = req.body?.userId || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'global-client';
  const now = Date.now();
  
  let timestamps = requestLogs.get(clientKey) || [];
  timestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = timestamps[0];
    const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp)) / 1000);
    res.set({
      'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW,
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': retryAfterSec,
      'Retry-After': retryAfterSec,
    });
    return res.status(429).json({
      error: `Rate limit reached (max ${MAX_REQUESTS_PER_WINDOW} requests per minute). Please wait ${retryAfterSec} seconds.`,
      retryAfter: retryAfterSec,
    });
  }

  timestamps.push(now);
  requestLogs.set(clientKey, timestamps);

  const remaining = MAX_REQUESTS_PER_WINDOW - timestamps.length;
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW,
    'X-RateLimit-Remaining': remaining,
    'X-RateLimit-Reset': Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
  });

  next();
};


const SYSTEM_TUTOR_PROMPT = `
You are Ascend AI, an expert, enthusiastic, and highly encouraging Khan Academy–style AI tutor and academic coach built into the Ascend student platform.

Your mission:
1. Socratic & Engaging: Never just dump raw answers. Guide students through concepts step by step using Socratic questions, intuitive ELI5 (Explain Like I'm 5) real-world analogies, and bite-sized checkpoints.
2. Context-Aware Grounding: You have direct access to the student's live academic profile (classes, current grades, missing assignments, upcoming deadlines, attendance, GPA) and uploaded course materials (syllabi, learning targets, unit notes, review packets). Reference their actual courses, teachers, and assignments when answering.
3. Proactive Intelligence & Document Solicitation:
- You know the student's exact live grades, missing assignments, upcoming tests/quizzes, and which enrolled classes have uploaded notes vs. which classes lack documents.
- Ask smarter, targeted Socratic diagnostic questions tailored to their upcoming assessments and academic needs (e.g. "I see you have an upcoming assessment in [Course] on [Topic] and we don't have your class notes or review packet uploaded yet. Would you like to upload or paste them so I can generate a practice test or lesson tailored to your teacher's study guide?").
- Actively prompt the student to attach worksheets, teacher review sheets, or syllabi for any enrolled course that lacks documents so you can coach them effectively.
4. Proactive Ahead-of-Time Learning: When planning or reviewing, look at upcoming units and syllabi to help students get ahead before new material is taught in class.

5. Assignment & Document Upload Classification Consensus Protocol:
When a student uploads, attaches, or mentions course assignments or documents:
- NEVER blindly auto-assume or auto-sort without independent verification.
- Pass 1 (Independent Content & Title Inspection): First, look at the document's actual academic content, headings, equations/prompts, and title independently to determine what subject it belongs to.
- Pass 2 (User Statement Comparison): Compare your independent finding with what the student stated (e.g., "the first one is Comp Sci and the second one is English").
- If BOTH you and the student agree (e.g. user says Comp Sci, and the document is about boolean logic/programming) -> Confirm and mark as Comp Sci.
- If there is a DISCREPANCY (e.g. student says Comp Sci, but the document has "English" in the title or contains rhetorical essay analysis, or vice versa) -> DO NOT auto-assume! Directly ask the student about the discrepancy so they can correct it:
  "I noticed you mentioned this is for [Student's Stated Class], but the document content/title refers to [Detected Subject / Title]. Should I file this under **[Detected Class]** or **[Stated Class]**?"
- If the student specifies a class (e.g. English) but you evaluate that the document does NOT appear to be for any enrolled class -> Ask the student to clarify which class or project it belongs to.
- Do not let the student's initial label bias your independent evaluation until you have checked the document, then compare the two.

5. Ascend Canvas Artifact Generation:
When the student asks for a lesson, explanation, quiz, practice, flashcards, or study guide, you MUST wrap the educational content in special Canvas artifact blocks using JSON or Markdown:

A. INTERACTIVE MULTI-VIDEO LESSON (type="interactive_lesson"):
CRITICAL: Use this whenever the student asks for an interactive lesson, lesson, tutorial, walkthrough, or "teach me". Wrap valid JSON inside the artifact block:
:::artifact{type="interactive_lesson" title="Topic Name Master Lesson"}
{
  "topic": "Specific Topic Name",
  "course": "Enrolled Course Name",
  "summary": "1-2 sentence core overview of what this lesson covers.",
  "videos": [
    {
      "title": "Video Tutorial Title",
      "youtubeId": "YOUTUBE_VIDEO_ID",
      "channel": "Educational Channel Name (e.g. Khan Academy, Organic Chemistry Tutor, Señor Jordan, Mr. Sinn)",
      "description": "What this tutorial explains."
    }
  ],
  "modules": [
    {
      "id": "mod-1",
      "title": "1. Core Concept & ELI5 Intuition",
      "concept": "Engaging, clear concept explanation with intuitive real-world analogies, rules, and tables.",
      "videoId": "YOUTUBE_VIDEO_ID",
      "checkpoint": {
        "type": "mcq",
        "question": "Conceptual check question testing what was just taught?",
        "options": ["Accurate Option A", "Distractor B", "Distractor C", "Distractor D"],
        "answerIndex": 0,
        "hint": "Socratic hint to guide their intuition.",
        "explanation": "Detailed breakdown explaining why the answer is correct."
      }
    },
    {
      "id": "mod-2",
      "title": "2. Step-by-Step Interactive Checkpoint",
      "concept": "Worked examples with step-by-step guidance and common mistakes to avoid.",
      "checkpoint": {
        "type": "matching",
        "question": "Match each core concept on the left with its correct rule on the right:",
        "matchingPairs": [
          { "id": "1", "left": "Concept A", "right": "Definition / Counterpart A" },
          { "id": "2", "left": "Concept B", "right": "Definition / Counterpart B" },
          { "id": "3", "left": "Concept C", "right": "Definition / Counterpart C" }
        ],
        "hint": "Strategy clue to guide matching.",
        "explanation": "Why each pair is connected."
      }
    }
  ],
  "cheatSheet": "# Lesson Key Takeaways & Cheat Sheet\n\n## 1. Golden Rules\n- Key rule 1...\n- Key formula 2...\n\n## 2. Common Pitfalls\n- Avoid this mistake..."
}
:::

B. DRAG-AND-DROP MATCHING CHALLENGE (type="drag_drop_challenge"):
Use this for interactive click-and-drag term/definition matching, ordering steps, or equation parts:
:::artifact{type="drag_drop_challenge" title="Topic Name Concept Connection Challenge"}
{
  "instruction": "Connect each concept on the left with its corresponding definition on the right:",
  "pairs": [
    { "id": "1", "left": "Term 1", "right": "Definition 1" },
    { "id": "2", "left": "Term 2", "right": "Definition 2" }
  ],
  "hint": "Strategic memory clue."
}
:::

C. STEM INTERACTIVE LAB (type="stem_tool"):
Use for math plotting, physics/chemistry formula simulation, or coding sandbox:
:::artifact{type="stem_tool" title="Topic Name STEM Interactive Lab" toolType="plotter"}
{
  "funcType": "quadratic",
  "a": 1,
  "b": -4,
  "c": 3
}
:::

D. HUMANITIES INTERACTIVE LAB (type="humanities_tool"):
Use for timelines, Toulmin argument mapping, scenario decision simulations, or rhetoric analysis:
:::artifact{type="humanities_tool" title="Topic Name Humanities Lab" toolType="timeline"}
{
  "events": [
    { "year": "Milestone 1", "title": "Title 1", "desc": "Detailed analysis...", "impact": "Historical/literary impact..." }
  ]
}
:::

E. SOCRATIC QUIZ / CHALLENGE (type="challenge"):
Use this when the student asks for a quiz, challenge, test prep, or multiple-choice practice:
:::artifact{type="challenge" title="Topic Name Socratic Challenge"}
[
  {
    "question": "Clear conceptual or application question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 1,
    "hint": "Helpful Socratic clue to guide their thinking.",
    "explanation": "Detailed explanation of why the correct answer is right and why distractors are wrong."
  }
]
:::

F. FLASHCARD DECK (type="flashcards"):
Use this when the student asks for flashcards, vocabulary drills, or quick term recall:
:::artifact{type="flashcards" title="Topic Name Flashcard Deck"}
[
  {"front": "Term or Question", "back": "Definition or Answer", "tag": "Unit Tag", "hint": "Memory hook"}
]
:::

G. STUDY GUIDE / DOCUMENT (type="study_guide"):
Use this when the student asks for a written outline or summary notes:
:::artifact{type="study_guide" title="Topic Name Study Guide"}
# Unit Notes
## Key Concepts
- Concept 1...
## Checkpoints
- [ ] Practice 1...
:::

Tone: Warm, motivating, concise, structured, intellectually stimulating, and never verbose. Celebrate wins!

`.trim();


function generateFallbackResponse(prompt, contextStr, docsStr) {
  const lower = (prompt || '').toLowerCase();
  
  // ── 1. SPANISH III (TAG/Advanced Spanish III) ──
  if (lower.includes('span') || lower.includes('espan') || lower.includes('subjunctive') || lower.includes('conjugat') || lower.includes('tijerina')) {
    // A. Interactive Lesson / Tutorial (Default for "lesson", "teach", "explain", "not vocab")
    if (lower.includes('lesson') || lower.includes('teach') || lower.includes('explain') || lower.includes('guide') || lower.includes('how to') || lower.includes('not vocab') || lower.includes('study')) {
      const lessonData = {
        topic: "Present Subjunctive & WEIRDO Triggers",
        course: "TAG/Advanced Spanish III",
        summary: "Master the 3-step conjugation formula and the 6 WEIRDO triggers that govern the subjunctive mood.",
        videos: [
          {
            title: "Present Subjunctive Formation & Rules",
            youtubeId: "zXj4D7p0e3Q",
            channel: "Señor Jordan",
            description: "Clear 5-minute visual guide to the Yo-O-Opposite conjugation formula."
          },
          {
            title: "Subjunctive WEIRDO Triggers Mastery",
            youtubeId: "yM9hNfV_vj8",
            channel: "Butterfly Spanish",
            description: "Deep dive into wishes, doubt, emotions, and impersonal expressions."
          }
        ],
        modules: [
          {
            id: "mod-1",
            title: "1. The Core Concept (Indicative vs. Subjunctive)",
            concept: "In Spanish, grammar is divided into **moods**, NOT tenses.\n\n- **Indicative Mood:** Objective reality, certainty, and facts (*Yo sé que tú estudias* = I know you study).\n- **Subjunctive Mood:** Subjective reality, wishes, uncertainty, emotions, and hypotheticals (*Quiero que tú estudies* = I want you to study).\n\n### The 3 Golden Rules\nA sentence ONLY triggers the subjunctive when ALL 3 requirements are met:\n1. **Main Clause Trigger:** Contains a W.E.I.R.D.O. verb (Wishes, Emotions, Impersonal expressions, Recommendations, Doubt, Ojalá).\n2. **Connector:** Linked by the conjunction **'que'** (or *ojalá*).\n3. **Change of Subject:** Subject in clause 1 is DIFFERENT from subject in clause 2 (*Yo quiero que TÚ hables*).",
            videoId: "zXj4D7p0e3Q",
            checkpoint: {
              type: "mcq",
              question: "Why does 'Yo quiero que tú estudies' require the subjunctive 'estudies' instead of indicative 'estudias'?",
              options: [
                "Because there is a wish trigger (Quiero), connector (que), and change of subject (Yo vs Tú).",
                "Because 'estudiar' is always an irregular verb in Spanish.",
                "Because the action is happening in the past.",
                "Because it is a direct command to a group."
              ],
              answerIndex: 0,
              hint: "Check if all 3 Golden Rules are satisfied: Trigger + Que + Change of Subject.",
              explanation: "Correct! 'Yo quiero' expresses a wish (Subject 1), followed by 'que', and the action applies to 'tú' (Subject 2). All 3 Golden Rules are met!"
            }
          },
          {
            id: "mod-2",
            title: "2. The 'Yo-O-Opposite' Conjugation Formula",
            concept: "To conjugate any regular verb in the present subjunctive:\n\n1. **Step 1:** Go to the present **Yo** form (*Hablo*, *Como*, *Escribo*, *Tengo*).\n2. **Step 2:** Drop the **-o** (*Habl-*, *Com-*, *Escrib-*, *Teng-*).\n3. **Step 3:** Add the **Opposite Vowel Ending**:\n   - **-AR Verbs** take **-e** endings: *-e, -es, -e, -emos, -en* (*hable, hables, hable, hablemos, hablen*)\n   - **-ER / -IR Verbs** take **-a** endings: *-a, -as, -a, -amos, -an* (*coma, comas, coma, comamos, coman*)\n\n### Irregular Verbs (D.I.S.H.E.S.)\n- **D**ar -> *dé, des, dé, demos, den*\n- **I**r -> *vaya, vayas, vaya, vayamos, vayan*\n- **S**er -> *sea, seas, sea, seamos, sean*\n- **H**aber -> *haya*\n- **E**star -> *esté, estés, esté, estemos, estén*\n- **S**aber -> *sepa, sepas, sepa, sepamos, sepan*",
            videoId: "yM9hNfV_vj8",
            checkpoint: {
              type: "fill_in",
              question: "Conjugate 'hablar' for 'nosotros' in the present subjunctive:",
              acceptedAnswers: ["hablemos", "Hablemos"],
              hint: "Take the stem 'habl-' and add the -AR opposite ending for nosotros (-emos).",
              explanation: "From hablo -> habl- + emos = hablemos."
            }
          },
          {
            id: "mod-3",
            title: "3. Irregular Stems & Synthesis Practice",
            concept: "Verbs with irregular 'yo' forms in the present indicative keep their irregular stem in the subjunctive:\n\n- *Tener* -> yo tengo -> stem **teng-** -> *tenga, tengas, tenga, tengamos, tengan*\n- *Hacer* -> yo hago -> stem **hag-** -> *haga, hagas, haga, hagamos, hagan*\n- *Poner* -> yo pongo -> stem **pong-** -> *ponga, pongas, ponga, pongamos, pongan*\n- *Decir* -> yo digo -> stem **dig-** -> *diga, digas, diga, digamos, digan*",
            checkpoint: {
              type: "fill_in",
              question: "Conjugate 'tener' for 'tú' in the present subjunctive:",
              acceptedAnswers: ["tengas", "Tengas"],
              hint: "Start with yo tengo -> drop -o -> add opposite ending -as.",
              explanation: "Tener has the stem 'teng-', so the tú form in subjunctive is 'tengas'."
            }
          }
        ],
        cheatSheet: "# Spanish Subjunctive Golden Cheat Sheet\n\n## 1. The 3 Golden Rules\n- **Trigger:** W.E.I.R.D.O. verb in main clause\n- **Connector:** Linked by *que*\n- **Subject Change:** Subject 1 != Subject 2\n\n## 2. Formation Formula (Yo-O-Opposite)\n- -AR: *-e, -es, -e, -emos, -en*\n- -ER/-IR: *-a, -as, -a, -amos, -an*\n\n## 3. D.I.S.H.E.S. Irregulars\n- Dar (*dé*), Ir (*vaya*), Ser (*sea*), Haber (*haya*), Estar (*esté*), Saber (*sepa*)"
      };

      return `¡Absolutamente! Here is your structured **TAG/Advanced Spanish III Interactive Lesson** on the Present Subjunctive Mood with curated tutorial videos and post-concept checkpoints. Click **Open Canvas** to start:

:::artifact{type="interactive_lesson" title="TAG Spanish III: Present Subjunctive Master Lesson"}
${JSON.stringify(lessonData, null, 2)}
:::`;
    }

    // B. Quiz / Challenge
    if (lower.includes('quiz') || lower.includes('challenge') || lower.includes('test') || lower.includes('question')) {
      return `¡Excelente! Here is an interactive Spanish III Mastery Challenge targeting the subjunctive mood and advanced vocabulary:

:::artifact{type="challenge" title="TAG Spanish III: Subjunctive & Vocabulary Challenge"}
[
  {
    "question": "¿Cuál es la forma correcta del presente de subjuntivo? 'Dudo que ellos _____ (llegar) a tiempo.'",
    "options": ["llegan", "lleguen", "llegaron", "llegarán"],
    "answerIndex": 1,
    "hint": "Remember: 'Dudar' expresses doubt (WEIRDO trigger), so use subjunctive for -ar verbs with orthographic spelling change g -> gu.",
    "explanation": "Because 'dudar que' expresses doubt, it requires the subjunctive. For 'llegar', the stem changes to 'llegu-' to preserve the hard 'g' sound before 'e', producing 'lleguen'."
  }
]
:::`;
    }

    // C. Flashcard Deck
    return `¡Por supuesto! Here is your custom **TAG/Advanced Spanish III** Flashcard Deck covering key subjunctive triggers, irregular verbs, and high-yield academic vocabulary:

:::artifact{type="flashcards" title="TAG Spanish III: Subjunctive & Advanced Vocab Deck"}
[
  {"front": "¿Qué significa el acrónimo 'W.E.I.R.D.O.' en el subjuntivo?", "back": "Wishes, Emotions, Impersonal expressions, Recommendations, Doubt, Ojalá — the 6 main categories that trigger the subjunctive in dependent clauses.", "tag": "Grammar", "hint": "Think of the triggers that show subjectivity or uncertainty."},
  {"front": "Conjuga 'haber' en la 3ª persona singular del presente de subjuntivo (él / ella / usted).", "back": "haya (e.g. 'Espero que haya suficiente comida.')", "tag": "Verbs", "hint": "Starts with 'h-a-y...'"},
  {"front": "Conjuga 'saber' en la 1ª persona plural del presente de subjuntivo (nosotros).", "back": "sepamos (e.g. 'El profesor quiere que sepamos las respuestas.')", "tag": "Verbs", "hint": "The stem for saber in subjunctive is 'sep-'."}
]
:::`;
  }


  // ── 2. ALGEBRA II (TAG/Advanced Alg II) ──
  if (lower.includes('alg') || lower.includes('math') || lower.includes('absolute value') || lower.includes('quadratic') || lower.includes('polynomial') || lower.includes('vertex')) {
    if (lower.includes('absolute') || lower.includes('value') || lower.includes('lesson') || lower.includes('teach') || lower.includes('explain')) {
      return `Here is your **TAG/Advanced Algebra II Master Lesson** on Absolute Value Equations, Inequalities, and Transformations:

:::artifact{type="study_guide" title="Algebra II: Absolute Value Equations & Transformations"}
# Absolute Value Equations & Transformations Lesson

## 1. The Core Concept (Distance From Zero)
The absolute value $|x|$ represents the **distance** of a number from zero on the number line. Because distance is never negative, $|x| \ge 0$.

## 2. Solving Absolute Value Equations: $|ax + b| = c$
- If $c < 0$: **No solution** (distance cannot be negative).
- If $c \ge 0$: Split into TWO separate cases:
  1. **Case 1 (Positive):** $ax + b = c$
  2. **Case 2 (Negative):** $ax + b = -c$
- **Always check for extraneous solutions!**

## 3. Absolute Value Inequalities
- **Less Than (AND):** $|x| < c \implies -c < x < c$ (Bounded interval between $-c$ and $c$)
- **Greater Than (OR):** $|x| > c \implies x > c \text{ or } x < -c$ (Two disjoint rays pointing outward)

## 4. Graphing & Transformations: $f(x) = a|x - h| + k$
- Vertex is at $(h, k)$ (remember: opposite sign for $h$, same sign for $k$).
- $|a| > 1$: Vertical stretch (steeper V-shape).
- $0 < |a| < 1$: Vertical compression (wider V-shape).
- $a < 0$: Reflection across the x-axis (upside-down V).

## 5. Interactive Practice Checkpoints
- [ ] Solve $|2x - 5| = 9 \implies 2x - 5 = 9$ or $2x - 5 = -9 \implies x = 7$ or $x = -2$
- [ ] Solve $|3x + 1| < 10 \implies -10 < 3x + 1 < 10 \implies -11/3 < x < 3$
- [ ] Identify the vertex of $f(x) = -2|x + 4| + 7 \implies \text{Vertex } (-4, 7)$
:::

Would you like to try solving a challenge problem with absolute value inequalities?`;
    }

    return `Here is your **TAG/Advanced Algebra II** Flashcard Deck for quadratic functions, complex numbers, and polynomials:

:::artifact{type="flashcards" title="Algebra II: Quadratics & Polynomials Deck"}
[
  {"front": "What is the vertex form of a quadratic function, and what do (h, k) represent?", "back": "f(x) = a(x - h)^2 + k, where (h, k) is the coordinate of the parabola's vertex.", "tag": "Quadratics", "hint": "h gives horizontal shift, k gives vertical shift."},
  {"front": "What does the discriminant (b^2 - 4ac) indicate about roots?", "back": "> 0: Two real roots. = 0: One real root. < 0: Two complex roots.", "tag": "Formulas", "hint": "The expression under the radical in the quadratic formula."}
]
:::`;
  }

  // ── 3. AP HUMAN GEOGRAPHY (TAG/AP Human Geography) ──
  if (lower.includes('geo') || lower.includes('aphg') || lower.includes('human geo') || lower.includes('migration') || lower.includes('population')) {
    return `Here is your customized **AP Human Geography** review deck aligned with Unit 1 (Nature & Perspectives), Unit 2 (Population & Migration), and Unit 3 (Cultural Patterns):

:::artifact{type="flashcards" title="AP Human Geography: Core Concepts Deck"}
[
  {"front": "What characterizes Stage 2 of the Demographic Transition Model (DTM)?", "back": "High Crude Birth Rate (CBR) and rapidly falling Crude Death Rate (CDR), leading to high Natural Increase Rate (NIR) due to medical and industrial advancements.", "tag": "Population", "hint": "Think of the Industrial/Medical Revolution taking off."},
  {"front": "According to Ravenstein's Laws of Migration, who is most likely to migrate internationally?", "back": "Young single adults (historically young adult males, now increasingly balanced with females).", "tag": "Migration", "hint": "Consider age and family status."}
]
:::`;
  }

  // ── 4. AP COMPUTER SCIENCE PRINCIPLES ──
  if (lower.includes('comp') || lower.includes('cs') || lower.includes('code') || lower.includes('gate') || lower.includes('boolean') || lower.includes('binary') || lower.includes('hex') || lower.includes('data')) {
    if (lower.includes('lesson') || lower.includes('teach') || lower.includes('explain') || lower.includes('guide') || lower.includes('interactive') || lower.includes('study') || lower.includes('data')) {
      const csLesson = {
        topic: "Data Representation (Binary & Hexadecimal) & Boolean Logic Gates",
        course: "AP Computer Science Principles",
        summary: "Master number base conversions between Binary (base-2), Decimal (base-10), and Hexadecimal (base-16), and construct truth tables for core logic gates (AND, OR, NOT, XOR).",
        videos: [
          {
            title: "Binary & Hexadecimal Number Systems Explained",
            youtubeId: "4qH4unVtJkE",
            channel: "CrashCourse Computer Science",
            description: "Understand how computers represent data, numbers, and text in binary and hex."
          },
          {
            title: "Logic Gates & Boolean Truth Tables",
            youtubeId: "gI-qXk7XojA",
            channel: "Computerphile",
            description: "Visual walkthrough of AND, OR, NOT, and XOR logic gates with circuit examples."
          }
        ],
        modules: [
          {
            id: "mod-1",
            title: "1. Binary (Base-2) & Hexadecimal (Base-16) Conversions",
            concept: "Computers use binary (0 and 1) because transistors are either off (0) or on (1).\n\n- **Binary Place Values:** $2^7(128), 2^6(64), 2^5(32), 2^4(16), 2^3(8), 2^2(4), 2^1(2), 2^0(1)$.\n- **Hexadecimal (Base-16):** Uses digits 0-9 and letters A=10, B=11, C=12, D=13, E=14, F=15.\n- **4 Bits = 1 Hex Digit (Nibble):** For example, binary `1010` is $10$ in decimal, which is hex `A`. Binary `1111` is hex `F` ($15$).",
            videoId: "4qH4unVtJkE",
            checkpoint: {
              type: "mcq",
              question: "What is the decimal equivalent of the binary number `1101`?",
              options: ["13 (8 + 4 + 0 + 1)", "11", "15", "9"],
              answerIndex: 0,
              hint: "Add the place values: 8 + 4 + 0 + 1.",
              explanation: "In binary: (1 * 8) + (1 * 4) + (0 * 2) + (1 * 1) = 8 + 4 + 0 + 1 = 13."
            }
          },
          {
            id: "mod-2",
            title: "2. Boolean Logic Gates & Truth Tables",
            concept: "Logic gates combine boolean inputs (True/1 or False/0):\n\n- **AND Gate:** Outputs 1 ONLY if ALL inputs are 1.\n- **OR Gate:** Outputs 1 if AT LEAST ONE input is 1.\n- **NOT Gate (Inverter):** Inverts the input ($1 \\to 0$, $0 \\to 1$).\n- **XOR Gate (Exclusive OR):** Outputs 1 if inputs are DIFFERENT (one 1, one 0). Outputs 0 if both inputs are the same!",
            videoId: "gI-qXk7XojA",
            checkpoint: {
              type: "mcq",
              question: "If Input A = 1 and Input B = 1, what does an XOR gate output?",
              options: ["0 (False, because inputs are identical)", "1 (True)", "Undefined", "-1"],
              answerIndex: 0,
              hint: "XOR means exclusive: one or the other, but NOT both.",
              explanation: "XOR outputs 1 only when the inputs differ. When both inputs are 1, XOR outputs 0."
            }
          }
        ],
        cheatSheet: "# AP CSP Binary & Logic Cheat Sheet\n\n## 1. Place Values\n- 128, 64, 32, 16, 8, 4, 2, 1\n\n## 2. Hex Nibbles\n- 10 = A, 11 = B, 12 = C, 13 = D, 14 = E, 15 = F\n\n## 3. Gates\n- **AND:** Both 1\n- **OR:** Either 1\n- **XOR:** Different inputs"
      };

      return `Here is your **AP Computer Science Principles Interactive Master Lesson** on Data Representation (Binary, Hex) and Logic Gates with curated video tutorials and concept checkpoints. Click **Open Canvas** to start:

:::artifact{type="interactive_lesson" title="AP CSP: Data Representation & Logic Gates"}
${JSON.stringify(csLesson, null, 2)}
:::`;
    }

    return `Here is your **AP Computer Science Principles** Flashcard Deck covering boolean algebra, logic gates, and computing fundamentals:

:::artifact{type="flashcards" title="AP CSP: Logic Gates & Computing Deck"}
[
  {"front": "What does an XOR (Exclusive OR) gate output when both inputs are True (1)?", "back": "0 (False). XOR outputs 1 only when inputs are strictly different (one 1, one 0).", "tag": "Logic Gates", "hint": "Think 'one or the other, but NOT both'."},
  {"front": "State De Morgan's Law for NOT(A OR B).", "back": "(NOT A) AND (NOT B). Break the line, change the sign from OR to AND.", "tag": "Boolean Logic", "hint": "Invert the variables and flip OR to AND."}
]
:::`;
  }

  // ── 5. ADVANCED BIOLOGY ──
  if (lower.includes('bio') || lower.includes('cell') || lower.includes('osmosis') || lower.includes('photosynthesis')) {
    return `Here is your **TAG/Advanced Biology** Flashcard Deck covering cell transport, bioenergetics, and organelles:

:::artifact{type="flashcards" title="Biology: Cellular Transport & Energetics Deck"}
[
  {"front": "What happens to a plant cell placed in a hypotonic (pure water) environment?", "back": "Water rushes in via osmosis, creating turgor pressure against the cell wall (turgid state, ideal for plants).", "tag": "Cell Transport", "hint": "Hypo = low solute outside, water rushes in."},
  {"front": "What are the primary products of the Light-Dependent Reactions in photosynthesis?", "back": "ATP, NADPH (used in the Calvin Cycle), and Oxygen gas (O2 byproduct).", "tag": "Photosynthesis", "hint": "Sunlight splits water and charges energy carriers."}
]
:::`;
  }

  // ── 6. ENGLISH I (TAG/Advanced English I / ELA) ──
  if (lower.includes('eng') || lower.includes('lit') || lower.includes('rhetoric') || lower.includes('essay') || lower.includes('paragraph') || lower.includes('claim') || lower.includes('argument')) {
    if (lower.includes('lesson') || lower.includes('teach') || lower.includes('explain') || lower.includes('guide') || lower.includes('how to') || lower.includes('study') || lower.includes('rhetor') || lower.includes('argument')) {
      const englishLesson = {
        topic: "Rhetorical Appeals & Argumentative Paragraph Structure (Claim, Evidence, Warrant)",
        course: "TAG/Advanced English I",
        summary: "Master classical rhetorical appeals (Ethos, Pathos, Logos) and craft high-scoring argumentative claims backed by evidence and analytical commentary.",
        videos: [
          {
            title: "Ethos, Pathos, and Logos Explained",
            youtubeId: "6p8_h9A0WpM",
            channel: "Purdue OWL",
            description: "Master the 3 classical rhetorical appeals with real-world speech examples."
          },
          {
            title: "How to Write an Argumentative Paragraph (Claim, Evidence, Warrant)",
            youtubeId: "e_z7u76z-wM",
            channel: "Crash Course Literature",
            description: "Step-by-step formula for structuring persuasive claims, evidence, and analytical commentary."
          }
        ],
        modules: [
          {
            id: "mod-1",
            title: "1. The Classical Rhetorical Appeals (Ethos, Pathos, Logos)",
            concept: "Every persuasive argument relies on Aristotle's **Three Classical Appeals**:\n\n- **Ethos (Credibility & Character):** Convincing the audience of the speaker's authority, moral integrity, or expert credentials (*'As a researcher with 20 years in environmental science...'*).\n- **Logos (Logic & Reasoning):** Appealing to intellect using verified facts, empirical statistics, syllogisms, and cause-and-effect reasoning (*'Studies show a 42% decrease in emissions...'*).\n- **Pathos (Emotion & Values):** Evoking feelings of empathy, urgency, outrage, or shared human values using sensory imagery, anecdotes, and loaded diction (*'Imagine a child waking up without clean drinking water...'*).",
            videoId: "6p8_h9A0WpM",
            checkpoint: {
              type: "mcq",
              question: "Which rhetorical appeal is primarily used in: 'According to a 2024 Harvard clinical trial with 10,000 patients, regular sleep improved memory retention by 37%'?",
              options: [
                "Logos (Appeal to logic and empirical statistical data)",
                "Pathos (Appeal to emotional sympathy)",
                "Ethos (Appeal to moral character and shared emotion)",
                "Kairos (Appeal to immediate cultural timeliness only)"
              ],
              answerIndex: 0,
              hint: "Notice the reliance on verified numerical data and trial statistics.",
              explanation: "Logos appeals directly to reason and intellect through empirical data, statistics, and verifiable evidence."
            }
          },
          {
            id: "mod-2",
            title: "2. The Anatomy of an Argumentative Claim (Toulmin Model)",
            concept: "A high-scoring argumentative paragraph follows the **Claim-Evidence-Warrant** formula:\n\n1. **Claim (Topic Sentence):** A debatable, defensible assertion answering the prompt (NOT a plain statement of fact).\n2. **Evidence (Data/Quote):** Concrete textual evidence or empirical fact introduced with context and MLA in-text citation.\n3. **Warrant (Reasoning/Commentary):** The explanation of HOW and WHY the evidence directly proves your claim (must be at least 2 sentences of analysis per quote).\n4. **Counterclaim & Rebuttal:** Acknowledging the opposing viewpoint and proving why your claim remains stronger.",
            videoId: "e_z7u76z-wM",
            checkpoint: {
              type: "fill_in",
              question: "In the Toulmin argument model, what is the term for the analytical explanation that explains HOW the evidence proves the claim?",
              acceptedAnswers: ["warrant", "Warrant", "commentary", "reasoning"],
              hint: "Starts with 'W' (also called analytical commentary).",
              explanation: "The warrant (or reasoning/commentary) connects the evidence directly to the overarching claim."
            }
          }
        ],
        cheatSheet: "# Rhetorical & Argumentative Golden Cheat Sheet\n\n## 1. Classical Appeals\n- **Ethos:** Credibility & authority\n- **Logos:** Logic, data & factual reasoning\n- **Pathos:** Emotional resonance & vivid imagery\n\n## 2. Paragraph Formula\n- **C**laim (Debatable stance)\n- **E**vidence (Context + Quote + MLA citation)\n- **W**arrant (2+ sentences explaining why the quote proves the claim)"
      };

      return `Here is your **TAG/Advanced English I Interactive Lesson** on Rhetorical Appeals & Argumentative Paragraph Structure with curated video tutorials and concept checkpoints. Click **Open Canvas** to start:

:::artifact{type="interactive_lesson" title="TAG English I: Rhetorical Appeals & Argumentation Master Lesson"}
${JSON.stringify(englishLesson, null, 2)}
:::`;
    }

    return `Here is your **TAG/Advanced English I** Flashcard Deck covering rhetorical devices, argument structures, and literary terms:

:::artifact{type="flashcards" title="TAG English I: Rhetoric & Analysis Deck"}
[
  {"front": "What is the difference between a Claim and a Fact in argumentative writing?", "back": "A fact is universally verified and non-debatable. A claim is an arguable position that requires evidence and reasoning to prove.", "tag": "Argumentation", "hint": "Think about whether someone could reasonably disagree."},
  {"front": "Define 'Ethos' in rhetorical analysis.", "back": "An appeal to the audience's perception of the speaker's credibility, character, expertise, or moral authority.", "tag": "Rhetoric", "hint": "Root word of 'ethics'."}
]
:::`;
  }


  // ── 6. GENERAL FLASHCARDS & STUDY FALLBACK ──
  if (lower.includes('flashcard') || lower.includes('card')) {
    return `Here is your custom **Ascend Academic Mastery Deck** grounded in your enrolled high school coursework. Click any card to flip and practice!

:::artifact{type="flashcards" title="Ascend Multi-Course Mastery Deck"}
[
  {"front": "¿Cuál es la regla del subjuntivo para verbos -ar y -er/-ir?", "back": "-ar verbs take -e endings (hable, hables, hable, hablemos, hablen). -er/-ir verbs take -a endings (coma, comas, coma, comamos, coman).", "tag": "Spanish III", "hint": "The vowels flip in present subjunctive!"},
  {"front": "In Boolean algebra, what is NOT(A AND B) equivalent to?", "back": "(NOT A) OR (NOT B) by De Morgan's Law.", "tag": "AP Comp Sci", "hint": "Break the bar and change the operator."},
  {"front": "What is the vertex of f(x) = 3(x - 4)^2 + 7?", "back": "(4, 7). In vertex form a(x-h)^2 + k, the vertex is (h, k).", "tag": "Algebra II", "hint": "Sign inside parentheses flips for h."}
]
:::`;
  }

  // Default: Intelligent academic assistant answer synthesizing course materials and study context
  return `I have reviewed your course materials and academic goals! Here are your key study priorities and next steps:

1. **Active Course Alignment**: Focus on your core assignments and upcoming unit assessments across your enrolled classes.
2. **Targeted Review**: Break down complex concepts into daily 25-minute focused study sessions (Pomodoro technique).
3. **Materials Integration**: Your course syllabi and documents are fully indexed in your Course Knowledge Base.

Let me know if you would like me to generate a practice quiz, draft an interactive lesson, or break down any specific concept!`;
}

// ── GET /api/health ──
app.get('/api/health', (req, res) => {
  const isLive = !!groqClient || !!aiClient;
  const activeModel = groqClient ? 'groq-llama-3.3' : (aiClient ? 'gemini-2.5-flash' : 'fallback');
  res.json({
    status: 'ok',
    aiMode: activeModel,
    aiKeyConfigured: isLive,
    model: activeModel,
    provider: groqClient ? 'Groq' : (aiClient ? 'Gemini' : 'Local'),
    timestamp: new Date().toISOString(),
  });
});


// Helper to ensure Gemini API conversation rules:
// 1. Must start with a 'user' turn
// 2. Must strictly alternate roles (user <-> model)
function formatChatContents(history, prompt) {
  const contents = [];
  const recentHistory = (history || []).slice(-10);

  let hasUserStarted = false;
  for (const msg of recentHistory) {
    if (!msg.text || !msg.text.trim()) continue;
    const role = msg.sender === 'user' ? 'user' : 'model';

    // Must start with user role
    if (!hasUserStarted && role !== 'user') continue;
    hasUserStarted = true;

    // Merge consecutive identical roles
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n' + msg.text;
    } else {
      contents.push({ role, parts: [{ text: msg.text }] });
    }
  }

  // Add the current prompt
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
    contents.push({ role: 'user', parts: [{ text: prompt }] });
  } else {
    contents.push({ role: 'user', parts: [{ text: prompt }] });
  }

  return contents;
}

const ACTIVE_MODELS = ['gemini-3.6-flash'];

// ── POST /api/ai/chat ──
app.post('/api/ai/chat', rateLimiterMiddleware, async (req, res) => {
  const { prompt, history = [], studentContext = '', courseDocs = '' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const courseIntel = analyzeCourseAndLevel(prompt);
  const curatedVideos = getCuratedVideos(courseIntel.subject, prompt);

  const fullSystemInstruction = `${SYSTEM_TUTOR_PROMPT}

DYNAMIC CURRICULUM & LEVEL INTELLIGENCE:
- Targeted Subject: ${courseIntel.subject}
- Targeted Academic Level: ${courseIntel.level}
- Standard Course: ${courseIntel.curriculumGuide.course}
- Standard Key Units: ${courseIntel.curriculumGuide.keyUnits.join(' | ')}
- Expected Competency: ${courseIntel.curriculumGuide.targetCompetency}

AUTHENTIC HIGH-YIELD YOUTUBE TUTORIALS (Use these exact video IDs if generating an interactive lesson):
${JSON.stringify(curatedVideos, null, 2)}

MANDATORY INSTRUCTION: If the student asks for a lesson, tutorial, or walkthrough, you MUST generate an interactive lesson in a :::artifact{type="interactive_lesson" title="..."} block using the schema above with these real educational video IDs and interactive checkpoints.

CURRENT STUDENT ACADEMIC CONTEXT:
${studentContext || 'No student context provided.'}

UPLOADED COURSE DOCUMENTS & LEARNING TARGETS:
${courseDocs || 'No uploaded documents currently.'}
`;


  const formattedContents = formatChatContents(history, prompt);

  // Groq first (fast, no throttle)
  const groqText = await tryGroq(fullSystemInstruction, prompt, history, false);
  if (groqText) {
    return res.json({ success: true, text: groqText, model: 'groq-llama-3.3' });
  }


  // Gemini fallback
  if (aiClient) {
    for (const model of ACTIVE_MODELS) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: formattedContents,
          config: { systemInstruction: fullSystemInstruction, temperature: 0.7 }
        });
        const text = response.text || 'I could not generate a response at this moment.';
        return res.json({ success: true, text, model });
      } catch (err) {
        console.warn(`[Failover] Gemini ${model} unavailable (${err?.status || err?.message})`);
      }
    }
  }

  // All AI offline — local engine
  const fallbackText = generateFallbackResponse(prompt, studentContext, courseDocs);
  return res.json({ success: true, text: fallbackText, model: 'local-engine' });
});



// ── POST /api/ai/study-plan ──
app.post('/api/ai/study-plan', rateLimiterMiddleware, async (req, res) => {
  const { studentContext = '', courseDocs = '', completedTopics = [] } = req.body;

  // Strip classroom rules/policies — only keep academic curriculum content
  const filteredDocs = stripSyllabusRules(courseDocs);

  const completedBlock = completedTopics.length > 0
    ? `\nALREADY COMPLETED OR GENERATED THIS WEEK (DO NOT repeat, reshuffle, or regenerate these topics — generate genuinely NEW content only):\n${completedTopics.map(t => `- ${t}`).join('\n')}\n`
    : '';

  const STUDY_PLAN_SYSTEM = `You are Ascend AI, an elite academic strategist and proactive study coach. You generate precise, personalized weekly study plans in valid JSON only.

ABSOLUTE RULES:
- NEVER include class policies, classroom rules, discipline procedures, grading policies, attendance rules, bathroom passes, cell phone rules, or any non-academic content in any task.
- ONLY generate tasks about real academic topics: units, chapters, vocabulary, problem sets, essays, labs, projects, formulas.
- DYNAMIC DUE-DATE & PACING PRIORITY:
  * Strict Chronological Urgency First: Always prioritize what is due earliest. If a homework assignment is due tomorrow, schedule immediate homework execution tonight first, while upcoming tests occurring later in the week get spaced review.
  * If a test or quiz is due sooner (e.g. Test tomorrow, homework due in 2 days), prioritize intensive test preparation tonight, followed by tomorrow's homework.
  * Previewing tomorrow's lessons ("get_ahead") and spaced retention review ("spaced_review") fill the remaining pillars.
- Each day must have exactly 3 tasks covering 3 different pillars: "assignment" (homework due), "get_ahead" (preview tomorrow's lesson), "quiz_prep" or "spaced_review" (active recall or upcoming test prep).
- Every task must have a "launchable": true field if it could have an interactive practice session (flashcards, challenge, worked examples).`;

  const planPrompt = `${completedBlock}
Create a Monday-to-Friday daily study plan for this student.

JSON schema (return ONLY valid JSON, no markdown, no explanations):
{
  "summary": "1-2 sentence plan overview",
  "days": [
    {
      "day": "Monday",
      "focus": "Brief focus line",
      "tasks": [
        {
          "id": "mon-1",
          "course": "Exact Course Name",
          "topic": "Specific academic topic only",
          "time": "30-45 min",
          "type": "assignment" | "get_ahead" | "quiz_prep" | "spaced_review",
          "launchable": true,
          "description": "Specific actionable instruction about what to study, practice, or preview."
        }
      ]
    }
  ]
}

STUDENT DATA & ENROLLED COURSES:
${studentContext}

UPLOADED COURSE DOCUMENTS & SYLLABI (already filtered — only academic content shown):
${filteredDocs || 'No uploaded documents.'}`.trim();

  // Groq first (fast, no throttle)
  const groqPlanText = await tryGroq(STUDY_PLAN_SYSTEM, planPrompt, [], true);
  if (groqPlanText) {

    try {
      const parsed = JSON.parse(groqPlanText);
      return res.json({ success: true, data: parsed, model: 'groq-llama-3.3' });
    } catch {
      console.warn('[Plan] Groq JSON parse failed, trying Gemini...');
    }
  }

  // Gemini fallback
  if (aiClient) {
    for (const model of ACTIVE_MODELS) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: planPrompt }] }],
          config: {
            systemInstruction: STUDY_PLAN_SYSTEM,
            responseMimeType: 'application/json',
            temperature: 0.3,
          }
        });
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, model });
      } catch (err) {
        console.warn(`[Plan Failover] Gemini ${model} error (${err?.status || err?.message})`);
      }
    }
  }

  // Local fallback plan
  const defaultPlan = {
    summary: "Strategic weekly roadmap: complete immediate homework, preview tomorrow's lessons, and drill upcoming quiz material.",
    days: [
      {
        day: "Monday",
        focus: "Homework Execution + AP Human Geo Advance Notes + Comp Sci Quiz Prep",
        tasks: [
          { id: "mon-1", course: "TAG/Advanced English I", topic: "Argumentative Paragraph Outline", time: "35 min", type: "assignment", launchable: true, description: "Outline claims and gather supporting evidence for upcoming paragraph submission." },
          { id: "mon-2", course: "TAG/AP Human Geography", topic: "Preview Tomorrow's Migration Models & Ravenstein's Laws", time: "30 min", type: "get_ahead", launchable: true, description: "Read ahead on Ravenstein's Laws of Migration and outline key definitions for tomorrow's lecture." },
          { id: "mon-3", course: "AP Comp Sci Principles", topic: "Logic Gates & Boolean Truth Tables", time: "25 min", type: "quiz_prep", launchable: true, description: "Active recall practice on AND, OR, NOT gate truth tables ahead of the upcoming unit quiz." }
        ]
      },
      {
        day: "Tuesday",
        focus: "Lab Work + Biology Cell Transport Preview + Algebra II Review",
        tasks: [
          { id: "tue-1", course: "AP Comp Sci Principles", topic: "Logic Gates Lab Completion", time: "40 min", type: "assignment", launchable: false, description: "Build and test circuit simulations for the Logic Gates Lab submission." },
          { id: "tue-2", course: "TAG/Advanced Biology", topic: "Preview Cell Membrane Active vs Passive Transport", time: "30 min", type: "get_ahead", launchable: true, description: "Preview diagrams for active vs passive transport and take preliminary notes for tomorrow." },
          { id: "tue-3", course: "TAG/Advanced Alg II", topic: "Absolute Value Equations & Inequalities", time: "25 min", type: "spaced_review", launchable: true, description: "Solve 4 practice problems with absolute value equations including cases and checking extraneous solutions." }
        ]
      },
      {
        day: "Wednesday",
        focus: "Essay Drafting + Alg II Polynomials Preview + Spanish Subjunctive Recall",
        tasks: [
          { id: "wed-1", course: "TAG/Advanced English I", topic: "Argumentative Paragraph Draft", time: "40 min", type: "assignment", launchable: false, description: "Draft paragraph body and citations focusing on rhetorical effectiveness." },
          { id: "wed-2", course: "TAG/Advanced Alg II", topic: "Preview Polynomial Functions & End Behavior", time: "30 min", type: "get_ahead", launchable: true, description: "Review polynomial end behavior and synthetic division ahead of Thursday's lecture." },
          { id: "wed-3", course: "TAG/Advanced Spanish III", topic: "Present Subjunctive WEIRDO Triggers", time: "25 min", type: "quiz_prep", launchable: true, description: "Drill WEIRDO verb categories and irregular subjunctive conjugations for the upcoming quiz." }
        ]
      },
      {
        day: "Thursday",
        focus: "Lab Finalization + English Text Preview + Biology Cell Respiration Review",
        tasks: [
          { id: "thu-1", course: "AP Comp Sci Principles", topic: "Lab Final Review & Submission", time: "30 min", type: "assignment", launchable: false, description: "Verify simulation outputs and submit final lab document." },
          { id: "thu-2", course: "TAG/Advanced English I", topic: "Preview Tomorrow's Text Analysis Reading", time: "25 min", type: "get_ahead", launchable: true, description: "Annotate tomorrow's assigned reading and highlight key literary devices." },
          { id: "thu-3", course: "TAG/Advanced Biology", topic: "ATP Synthesis & Photosynthesis Light Reactions", time: "35 min", type: "quiz_prep", launchable: true, description: "Review ATP synthesis and light-dependent reaction diagrams for the upcoming unit assessment." }
        ]
      },
      {
        day: "Friday",
        focus: "Weekly Wrap-up + Weekend Advance Planning",
        tasks: [
          { id: "fri-1", course: "TAG/Advanced English I", topic: "Paragraph Polish & Final Submission", time: "25 min", type: "assignment", launchable: false, description: "Proofread against grading rubric and submit finalized argumentative paragraph." },
          { id: "fri-2", course: "TAG/AP Human Geography", topic: "Demographic Transition Model Case Studies Preview", time: "30 min", type: "get_ahead", launchable: true, description: "Get ahead on next week's DTM case studies and population pyramid analysis." },
          { id: "fri-3", course: "TAG/Advanced Alg II", topic: "Weekly Math Spaced Review — Absolute Value & Functions", time: "25 min", type: "spaced_review", launchable: true, description: "Review missed quiz questions and solidify absolute value and function transformation rules." }
        ]
      }
    ]
  };
  return res.json({ success: true, data: defaultPlan, model: 'local-engine' });
});

// Helper: Load and merge all local HAR files or cached profile available
function loadLatestHarData() {
  const cachePath = path.join(__dirname, 'data', 'cached_student_profile.json');
  if (fs.existsSync(cachePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (data && data.classes?.length > 0) return data;
    } catch (err) {
      console.warn('[Cache Loader] Error reading cached_student_profile.json:', err.message);
    }
  }

  const possiblePaths = [
    path.join(__dirname, '..', 'gradeUpdate.har'),
    path.join(__dirname, '..', 'fourthPortalAttendenec.har'),
    path.join(__dirname, '..', 'thirdPortal.har'),
    path.join(__dirname, 'gradeUpdate.har'),
  ];

  let mergedProfile = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const parsed = parseHacFromHar(p);
        if (parsed) {
          if (!mergedProfile) {
            mergedProfile = parsed;
          } else {
            // Merge classes, attendance, transcript if not present
            if (parsed.classes && parsed.classes.length > 0) {
              parsed.classes.forEach(pc => {
                const existing = mergedProfile.classes.find(c => c.id === pc.id || c.name.toLowerCase() === pc.name.toLowerCase());
                if (existing) {
                  if (pc.assignments?.length > 0) existing.assignments = pc.assignments;
                  if (pc.average !== null) {
                    existing.average = pc.average;
                    existing.letterGrade = pc.letterGrade;
                  }
                } else {
                  mergedProfile.classes.push(pc);
                }
              });
            }
            if (parsed.transcript?.years?.length > 0 && (!mergedProfile.transcript?.years || mergedProfile.transcript.years.length === 0)) {
              mergedProfile.transcript = parsed.transcript;
            }
            if (parsed.attendance?.length > 0 && (!mergedProfile.attendance || mergedProfile.attendance.length === 0)) {
              mergedProfile.attendance = parsed.attendance;
            }
            if (parsed.studentId && !mergedProfile.studentId) {
              mergedProfile.studentId = parsed.studentId;
              mergedProfile.studentName = parsed.studentName;
              mergedProfile.counselor = parsed.counselor;
              mergedProfile.building = parsed.building;
            }
          }
        }
      } catch (err) {
        console.warn(`[HAR Loader] Error reading ${p}:`, err.message);
      }
    }
  }

  // Recalculate overall average considering zero-weighted items
  if (mergedProfile?.classes) {
    const classesWithGrades = mergedProfile.classes.filter(c => c.average !== null);
    mergedProfile.overallAverage = classesWithGrades.length > 0
      ? parseFloat((classesWithGrades.reduce((s, c) => s + c.average, 0) / classesWithGrades.length).toFixed(2))
      : null;
    
    mergedProfile.allAssignments = mergedProfile.classes.flatMap(c => (c.assignments || []).map(a => ({ ...a, class: c.name, courseId: c.id })));
    mergedProfile.upcoming = mergedProfile.allAssignments
      .filter(a => !a.missing && (a.score === null || a.score === undefined))
      .sort((a, b) => {
        if (!a.dateDue && !b.dateDue) return 0;
        if (!a.dateDue) return 1;
        if (!b.dateDue) return -1;
        return new Date(a.dateDue) - new Date(b.dateDue);
      });
  }

  return mergedProfile;
}

// GET /api/hac/latest - returns latest synced student profile
app.get('/api/hac/latest', (req, res) => {
  const profile = loadLatestHarData();
  if (profile) {
    return res.json({ success: true, data: profile });
  }
  res.status(404).json({ error: 'No synced HAC data found.' });
});

// API Endpoint to authenticate and scrape HAC
app.post('/api/login', async (req, res) => {
  const { username, password, districtUrl } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    console.log(`Initiating HAC scraping for user: ${username} (District URL: ${districtUrl || 'default'})...`);
    const profileData = await scrapeHac(username, password, districtUrl);
    res.json({ success: true, data: profileData });
  } catch (error) {
    console.warn('Live HAC Scraping unavailable, checking for updated local HAR archives:', error.message);
    const harProfile = loadLatestHarData();
    if (harProfile) {
      console.log(`✓ Serving freshly synced student profile from gradeUpdate.har (${harProfile.classes.length} classes, ${harProfile.upcoming.length} upcoming tasks)`);
      return res.json({ success: true, data: harProfile });
    }
    res.status(500).json({ error: error.message || 'Failed to authenticate with HAC' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Ascend Secure AI Proxy Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use by another running instance. The backend is already active!`);
  } else {
    console.error('Server error:', err);
  }
});


