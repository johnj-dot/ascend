/**
 * Ascend AI Course & Level Curriculum Intelligence Engine
 * Dynamically detects the course subject AND academic level (Level 1, 2, 3, AB, BC, AP, Honors, etc.)
 * and injects official curriculum standards, pacing milestones, and authentic study materials.
 */

export function analyzeCourseAndLevel(query, studentClasses = [], uploadedDocs = []) {
  const text = (query || '').toLowerCase();

  // 1. Identify Subject
  let subject = null;
  if (/span|espan|lengua|castellano/i.test(text)) subject = 'Spanish';
  else if (/calc|calculus/i.test(text)) subject = 'Calculus';
  else if (/alg|algebra/i.test(text)) subject = 'Algebra';
  else if (/geom|geometry/i.test(text)) subject = 'Geometry';
  else if (/phys|physics/i.test(text)) subject = 'Physics';
  else if (/chem|chemistry/i.test(text)) subject = 'Chemistry';
  else if (/bio|biology|cellular|life sci/i.test(text)) subject = 'Biology';
  else if (/comp|cs|computer|programming|coding|java|python/i.test(text)) subject = 'Computer Science';
  else if (/geo|geography|aphg|human geo/i.test(text)) subject = 'Human Geography';
  else if (/history|apush|whap|us history|world history|civics|gov/i.test(text)) subject = 'History';
  else if (/eng|english|lit|literature|rhetoric|ela/i.test(text)) subject = 'English';
  else if (/stat|statistics/i.test(text)) subject = 'Statistics';
  else if (/econ|economics|micro|macro/i.test(text)) subject = 'Economics';
  else if (/psych|psychology/i.test(text)) subject = 'Psychology';

  // 2. Identify Level
  let level = 'Standard / General';
  if (/\b(bc)\b/i.test(text)) level = 'BC (AP Calculus BC)';
  else if (/\b(ab)\b/i.test(text)) level = 'AB (AP Calculus AB)';
  else if (/\b(physics c|phys c|mechanics|e&m)\b/i.test(text)) level = 'AP Physics C';
  else if (/\b(csa|computer science a|java)\b/i.test(text)) level = 'AP CSA (Java)';
  else if (/\b(csp|principles)\b/i.test(text)) level = 'AP CSP (Principles)';
  else if (/\b(iii|3|three|advanced)\b/i.test(text)) level = 'Level 3 (Advanced / Third Year)';
  else if (/\b(iv|4|four|ap language|ap lit)\b/i.test(text)) level = 'Level 4 / AP';
  else if (/\b(ii|2|two|honors|tag)\b/i.test(text)) level = 'Level 2 / Honors';
  else if (/\b(i|1|one|intro|introductory)\b/i.test(text)) level = 'Level 1 (Introductory)';
  else if (/\b(ap|tag)\b/i.test(text)) level = 'AP / Honors';

  // If no subject in prompt, try matching against enrolled classes
  if (!subject && studentClasses.length > 0) {
    for (const c of studentClasses) {
      const cName = (c.name || '').toLowerCase();
      if (/span|espan/i.test(cName)) { subject = 'Spanish'; level = 'Level 3 (Advanced / Third Year)'; }
      else if (/comp|cs/i.test(cName)) { subject = 'Computer Science'; level = 'AP CSP (Principles)'; }
      else if (/geo|aphg/i.test(cName)) { subject = 'Human Geography'; level = 'AP (College Board CED)'; }
      else if (/bio/i.test(cName)) { subject = 'Biology'; level = 'Honors / Advanced'; }
      else if (/alg/i.test(cName)) { subject = 'Algebra'; level = 'Level 2 / Honors'; }
      else if (/eng/i.test(cName)) { subject = 'English'; level = 'Level 1 / Honors'; }
      if (subject) break;
    }
  }

  return {
    subject: subject || 'General Academic',
    level,
    curriculumGuide: getCurriculumPacingGuide(subject, level)
  };
}

export function getCurriculumPacingGuide(subject, level) {
  const s = (subject || '').toLowerCase();
  const l = (level || '').toLowerCase();

  // Spanish
  if (s.includes('span')) {
    if (l.includes('3') || l.includes('advanced') || l.includes('iii')) {
      return {
        course: 'Spanish III (Advanced / Pre-AP)',
        keyUnits: ['Subjunctive Mood (Present & Imperfect)', 'WEIRDO Triggers & Uncertainty', 'Hypothetical "Si" Clauses with Conditional', 'Por vs Para & Preterite vs Imperfect Nuance', 'Advanced Essay Transition Phrases (sin embargo, por lo tanto, a pesar de)'],
        targetCompetency: 'Complex multi-clause discourse, expressing doubt/wishes, literary and cultural text analysis.'
      };
    }
    if (l.includes('2') || l.includes('ii')) {
      return {
        course: 'Spanish II (Intermediate)',
        keyUnits: ['Preterite vs Imperfect Aspect', 'Direct & Indirect Object Pronouns (DOP/IOP)', 'Reflexive Daily Routines & Commands (Tú/Usted)', 'Comparatives & Superlatives'],
        targetCompetency: 'Narrating past events, describing health, travel, and personal experiences.'
      };
    }
    if (l.includes('4') || l.includes('ap')) {
      return {
        course: 'AP Spanish Language & Culture',
        keyUnits: ['Families in Different Societies', 'Language and Identity', 'Beauty and Aesthetics', 'Science and Technology', 'Contemporary Life', 'Global Challenges'],
        targetCompetency: 'Synthesizing audio/print sources, cultural comparison presentations, formal email replies.'
      };
    }
    return {
      course: 'Spanish I (Introductory)',
      keyUnits: ['Present Tense Regular & Stem-Changers', 'Ser vs Estar', 'Gustar and similar verbs', 'Basic Question Words & Daily Vocabulary'],
      targetCompetency: 'Basic conversational exchanges, describing self, school, and family.'
    };
  }

  // Calculus
  if (s.includes('calc')) {
    if (l.includes('bc')) {
      return {
        course: 'AP Calculus BC',
        keyUnits: ['Limits & Continuity', 'Derivatives & Related Rates', 'FTC & Integration Techniques', 'Integration by Parts & Partial Fractions', 'Parametric, Polar, and Vector Functions', 'Infinite Sequences, Taylor & Maclaurin Series'],
        targetCompetency: 'Mastery of differential and integral calculus including power series convergence and polar curves.'
      };
    }
    return {
      course: 'AP Calculus AB',
      keyUnits: ['Limits & Asymptotes', 'Differentiation Rules & Chain Rule', 'Contextual Applications (Velocity/Acceleration)', 'Analytical Applications (MVT, Optimization)', 'Integration & Accumulation (Riemann Sums, FTC)', 'Differential Equations & Slope Fields', 'Volume of Solids (Disk, Washer, Cross-Sections)'],
      targetCompetency: 'Single-variable differential and integral calculus aligned with College Board CED.'
    };
  }

  // Algebra
  if (s.includes('alg')) {
    if (l.includes('2') || l.includes('ii') || l.includes('honors') || l.includes('tag')) {
      return {
        course: 'Algebra II (Honors / TAG)',
        keyUnits: ['Quadratic Functions, Vertex Form & Complex Roots (i)', 'Polynomial Arithmetic & Synthetic Division', 'Rational & Radical Equations', 'Exponential & Logarithmic Growth / Decay', 'Conic Sections & Function Transformations'],
        targetCompetency: 'Advanced algebraic reasoning, analyzing non-linear function behavior, and complex systems.'
      };
    }
    return {
      course: 'Algebra I',
      keyUnits: ['Linear Equations & Inequalities', 'Slope-Intercept & Point-Slope Forms', 'Systems of Equations (Elimination/Substitution)', 'Exponent Rules & Polynomial Operations', 'Factoring Quadratics & Quadratic Formula'],
      targetCompetency: 'Fundamental linear, exponential, and quadratic modeling.'
    };
  }

  // Human Geography
  if (s.includes('geo')) {
    return {
      course: 'AP Human Geography',
      keyUnits: ['Unit 1: Thinking Geographically (Scale, GIS, Spatial Concepts)', 'Unit 2: Population & Migration (DTM Stages 1-5, Ravenstein, Push/Pull)', 'Unit 3: Cultural Patterns (Folk vs Pop, Diffusion Types, Language/Religion)', 'Unit 4: Political Patterns (State, Nation, Borders, Centripetal/Centrifugal)', 'Unit 5: Agriculture (Von Thünen, Green Revolution, Rural Land Use)', 'Unit 6: Cities & Urban Land Use (Burgess, Hoyt, Gentrification)', 'Unit 7: Industrial & Economic Development (Rostow, Wallerstein World Systems)'],
      targetCompetency: 'Spatial analysis, demographic patterns, cultural landscapes, and geopolitical dynamics.'
    };
  }

  // Biology
  if (s.includes('bio')) {
    return {
      course: 'AP / Honors Biology',
      keyUnits: ['Unit 1: Chemistry of Life (Water, Carbon, Macromolecules)', 'Unit 2: Cell Structure & Membrane Transport (Osmosis, Water Potential)', 'Unit 3: Cellular Energetics (Enzymes, Respiration, Photosynthesis)', 'Unit 4: Cell Communication & Cell Cycle (Mitosis, Signal Transduction)', 'Unit 5: Heredity & Genetics (Mendelian Genetics, Punnett Squares)', 'Unit 6: Gene Expression & Regulation (DNA Replication, Transcription, Translation)', 'Unit 7: Natural Selection & Evolution', 'Unit 8: Ecology & Energy Flow'],
      targetCompetency: 'Biological systems, experimental design, biochemical pathways, and evolutionary evidence.'
    };
  }

  // Computer Science
  if (s.includes('comp') || s.includes('cs')) {
    if (l.includes('a') || l.includes('java')) {
      return {
        course: 'AP Computer Science A (Java)',
        keyUnits: ['Primitive Types & Objects', 'Boolean Expressions & if Statements', 'Iteration (Loops & Nested Loops)', 'Class Design & Object-Oriented Programming', '1D & 2D Arrays and ArrayLists', 'Inheritance, Polymorphism & Interfaces', 'Recursion & Searching/Sorting Algorithms (Merge, Binary)'],
        targetCompetency: 'Object-oriented problem solving, rigorous Java algorithm design, and code analysis.'
      };
    }
    return {
      course: 'AP Computer Science Principles',
      keyUnits: ['Creative Development & Collaboration', 'Data & Binary/Hexadecimal Representation', 'Algorithms & Logic Gates (AND, OR, NOT, XOR, NAND)', 'Computer Systems, Internet Protocols (TCP/IP, DNS, Packets)', 'Impact of Computing (Cybersecurity, Bias, Digital Divide)'],
      targetCompetency: 'Computational thinking, internet architecture, data representation, and algorithmic logic.'
    };
  }

  // English / Language Arts
  if (s.includes('eng') || s.includes('lit') || s.includes('rhetoric') || s.includes('ela')) {
    if (l.includes('ap') || l.includes('lang') || l.includes('language')) {
      return {
        course: 'AP English Language & Composition',
        keyUnits: ['Rhetorical Situation (Exigence, Audience, Purpose)', 'Claims, Evidence, and Line of Reasoning', 'Synthesis Essay Structure', 'Rhetorical Analysis (Ethos, Pathos, Logos)', 'Argumentative Style & Rhetorical Devices'],
        targetCompetency: 'Analyzing nonfiction rhetoric, constructing evidence-based arguments, and synthesizing multi-source research.'
      };
    }
    if (l.includes('lit') || l.includes('literature')) {
      return {
        course: 'AP English Literature & Composition',
        keyUnits: ['Short Fiction & Characterization', 'Poetry Structure, Form & Figurative Language', 'Longer Fiction & Thematic Development', 'Literary Argumentation & Thesis Formulation'],
        targetCompetency: 'Close textual analysis of literary form, figurative language, tone, and thematic complexity.'
      };
    }
    return {
      course: 'TAG/Advanced English I',
      keyUnits: ['Rhetorical Appeals (Ethos, Pathos, Logos) & SOAPSTone', 'Argumentative Paragraphs & Claims (Claim, Data, Warrant)', 'Literary Analysis (Theme, Symbolism, Diction, Syntax)', 'MLA 9th Edition In-Text Citations & Works Cited', 'Grammar Mechanics & Sentence Variety (Clauses, Semicolons)'],
      targetCompetency: 'Rhetorical analysis, crafting cohesive argumentative claims with evidence, and literary synthesis.'
    };
  }

  // Default General
  return {
    course: `${subject || 'Academic'} (${level || 'General'})`,
    keyUnits: ['Core Foundations & Key Terminology', 'Analytical Problem-Solving', 'Active Retrieval & Practice Application', 'Integrated Review & Assessment Readiness'],
    targetCompetency: 'Mastery of primary unit concepts, structured recall, and assessment preparation.'

  };
}

/**
 * Returns high-yield curated educational YouTube videos for a subject and topic
 */
export function getCuratedVideos(subject = '', topic = '') {
  const s = (subject || '').toLowerCase();
  const t = (topic || '').toLowerCase();

  // Spanish
  if (s.includes('span') || s.includes('espan')) {
    if (t.includes('subjunctive') || t.includes('weirdo') || t.includes('mood')) {
      return [
        { title: 'Present Subjunctive Formation & Rules', youtubeId: 'zXj4D7p0e3Q', channel: 'Señor Jordan', description: 'Clear 5-minute visual guide to the Yo-O-Opposite conjugation formula.' },
        { title: 'Subjunctive WEIRDO Triggers Mastery', youtubeId: 'yM9hNfV_vj8', channel: 'Butterfly Spanish', description: 'Deep dive into wishes, doubt, emotions, and impersonal expressions.' }
      ];
    }
    if (t.includes('pret') || t.includes('imp') || t.includes('past')) {
      return [
        { title: 'Preterite vs Imperfect Made Simple', youtubeId: 'Yq7a3pW17qU', channel: 'Señor Jordan', description: 'When to use completed actions vs ongoing past descriptions.' }
      ];
    }
    return [
      { title: 'Spanish Grammar & Conversation Essentials', youtubeId: 'zXj4D7p0e3Q', channel: 'Señor Jordan', description: 'Step-by-step grammatical breakdown with authentic pronunciation.' }
    ];
  }

  // Algebra / Math
  if (s.includes('alg') || s.includes('math') || s.includes('calc')) {
    if (t.includes('absolute') || t.includes('value')) {
      return [
        { title: 'Solving Absolute Value Equations Step-by-Step', youtubeId: 'u6Z4L3I8wN0', channel: 'The Organic Chemistry Tutor', description: 'Master positive/negative splitting and checking extraneous roots.' },
        { title: 'Absolute Value Inequalities & Graphing', youtubeId: 'K7jT4Q0x1_A', channel: 'Brian McLogan', description: 'Less than (AND) vs Greater than (OR) on the number line.' }
      ];
    }
    if (t.includes('quad') || t.includes('vertex') || t.includes('parabola')) {
      return [
        { title: 'Graphing Quadratic Functions in Vertex Form', youtubeId: 'rG_J9G4r-6s', channel: 'The Organic Chemistry Tutor', description: 'Finding vertex (h, k), axis of symmetry, and x/y intercepts.' }
      ];
    }
    return [
      { title: 'Algebra II Core Concept Breakdown', youtubeId: 'u6Z4L3I8wN0', channel: 'The Organic Chemistry Tutor', description: 'Complete step-by-step worked examples with practice problems.' }
    ];
  }

  // AP Human Geography
  if (s.includes('geo') || s.includes('aphg') || s.includes('human')) {
    if (t.includes('dtm') || t.includes('demograph') || t.includes('migration') || t.includes('population')) {
      return [
        { title: 'Demographic Transition Model (DTM) Explained', youtubeId: '9LqLwZ3uJpM', channel: 'Mr. Sinn', description: 'Stages 1 through 5 with CBR, CDR, NIR, and real-world country examples.' },
        { title: "Ravenstein's Laws of Migration in 6 Minutes", youtubeId: '8qS3z0eJtqM', channel: 'Mr. Sinn', description: 'Distance decay, urban gravity, and push vs pull factors.' }
      ];
    }
    return [
      { title: 'AP Human Geography Unit Review', youtubeId: '9LqLwZ3uJpM', channel: 'Mr. Sinn', description: 'High-yield spatial analysis, models, and vocabulary.' }
    ];
  }

  // AP Computer Science
  if (s.includes('comp') || s.includes('cs') || s.includes('code')) {
    if (t.includes('logic') || t.includes('gate') || t.includes('boolean')) {
      return [
        { title: 'Logic Gates & Boolean Logic', youtubeId: 'gI-qXk7XojA', channel: 'Crash Course Computer Science', description: 'AND, OR, NOT, XOR, and NAND gates built from transistors.' },
        { title: 'Truth Tables & De Morgan Laws', youtubeId: '4q1Z8Qz4Yxk', channel: 'Khan Academy', description: 'Evaluating compound Boolean expressions with active checkpoints.' }
      ];
    }
    return [
      { title: 'Computer Science Principles Fundamentals', youtubeId: 'gI-qXk7XojA', channel: 'Crash Course', description: 'Core computing logic, binary data representation, and algorithms.' }
    ];
  }

  // Biology
  if (s.includes('bio') || s.includes('cell') || s.includes('life')) {
    return [
      { title: 'Cell Transport & Plasma Membranes', youtubeId: 'Ptmlvtei8hw', channel: 'Amoeba Sisters', description: 'Passive vs active transport, facilitated diffusion, and endocytosis.' },
      { title: 'Osmosis & Water Potential in Animal/Plant Cells', youtubeId: 'dPKvHrD1eS4', channel: 'Amoeba Sisters', description: 'Hypertonic, hypotonic, and isotonic solutions with visual turgor pressure.' }
    ];
  }

  // English / Language Arts
  if (s.includes('eng') || s.includes('lit') || s.includes('rhetoric') || s.includes('ela') || s.includes('essay') || s.includes('writing')) {
    if (t.includes('rhetor') || t.includes('appeal') || t.includes('ethos') || t.includes('pathos') || t.includes('logos')) {
      return [
        { title: 'Ethos, Pathos, and Logos Explained', youtubeId: '6p8_h9A0WpM', channel: 'Purdue OWL', description: 'Master the 3 classical rhetorical appeals with real-world speech examples.' },
        { title: 'Rhetorical Analysis & Devices', youtubeId: 'e_z7u76z-wM', channel: 'Crash Course Literature', description: 'Deconstructing author purpose, tone, diction, and syntax.' }
      ];
    }
    if (t.includes('argument') || t.includes('claim') || t.includes('thesis') || t.includes('paragraph') || t.includes('essay')) {
      return [
        { title: 'How to Write an Argumentative Paragraph (Claim, Evidence, Warrant)', youtubeId: 'e_z7u76z-wM', channel: 'Khan Academy', description: 'Structuring high-scoring argumentative claims, supporting data, and warrants.' },
        { title: 'MLA 9th Edition In-Text Citations & Works Cited', youtubeId: '8p_gYw3zL8w', channel: 'Purdue OWL', description: 'Author-page style parenthetical citations and formatted works cited entries.' }
      ];
    }
    return [
      { title: 'English & Literary Analysis Master Breakdown', youtubeId: 'y3qUe0T4e-g', channel: 'Crash Course Literature', description: 'Close reading, literary devices, and thematic analysis.' }
    ];
  }

  // General Fallback
  return [
    { title: `${topic || 'Academic Concept'} Master Tutorial`, youtubeId: 'u6Z4L3I8wN0', channel: 'Ascend Academic Academy', description: 'Comprehensive concept breakdown with interactive checkpoints.' }
  ];
}


