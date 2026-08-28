export const demoProfile = {
  studentName: "Demo Student",
  school: "Round Rock ISD",
  overallAverage: 92.47,
  classes: [
    {
      id: "3929A - 3",
      name: "AP Comp Sci Principles",
      period: "01",
      teacher: "Vudayagiri, Madhavi",
      room: "706",
      days: "A",
      markingPeriods: "MP1, MP2",
      average: 96.5,
      letterGrade: "A",
      assignments: [
        { dateDue: "08/26/2026", dateAssigned: "08/19/2026", name: "Syllabus", category: "Formative", score: "100", totalPoints: 100, weight: 0, missing: false, exempt: false },
        { dateDue: "09/05/2026", dateAssigned: "08/25/2026", name: "Logic Gates Lab", category: "Major", score: "95", totalPoints: 100, weight: 0, missing: false, exempt: false }
      ]
    },
    {
      id: "1115A - 6",
      name: "TAG/Advanced English I",
      period: "06",
      teacher: "Sitran, Susan",
      room: "124",
      days: "B",
      markingPeriods: "MP1, MP2",
      average: 88.3,
      letterGrade: "B",
      assignments: [
        { dateDue: "08/28/2026", dateAssigned: "08/20/2026", name: "Summer Reading Essay", category: "Major", score: "88", totalPoints: 100, weight: 0, missing: false, exempt: false },
        { dateDue: "09/10/2026", dateAssigned: "09/01/2026", name: "Argumentative Paragraph", category: "Minor", score: null, totalPoints: 100, weight: 0, missing: false, exempt: false }
      ]
    },
    {
      id: "3225A - 5",
      name: "TAG/Advanced Alg II",
      period: "03",
      teacher: "Sheen, Amy",
      room: "749",
      days: "A",
      markingPeriods: "MP1, MP2",
      average: 94.0,
      letterGrade: "A",
      assignments: [
        { dateDue: "08/30/2026", dateAssigned: "08/22/2026", name: "Functions Review Quiz", category: "Minor", score: "94", totalPoints: 100, weight: 0, missing: false, exempt: false }
      ]
    },
    {
      id: "4315A - 4",
      name: "TAG/Advanced Biology",
      period: "04",
      teacher: "Ortega, Jacob",
      room: "735",
      days: "A",
      markingPeriods: "MP1, MP2",
      average: 91.5,
      letterGrade: "A",
      assignments: [
        { dateDue: "09/03/2026", dateAssigned: "08/24/2026", name: "Cell Structure Lab", category: "Major", score: "91", totalPoints: 100, weight: 0, missing: false, exempt: false }
      ]
    },
    {
      id: "5839A - 1",
      name: "Intro Engineering Design",
      period: "05",
      teacher: "Lowe, Michael",
      room: "604",
      days: "B",
      markingPeriods: "MP1, MP2",
      average: 85.0,
      letterGrade: "B",
      assignments: [
        { dateDue: "09/07/2026", dateAssigned: "08/28/2026", name: "Bridge Project", category: "Major", score: null, totalPoints: 100, weight: 0, missing: true, exempt: false }
      ]
    },
    {
      id: "2212A - 6",
      name: "TAG/AP Human Geography",
      period: "07",
      teacher: "Ferguson, Jennifer",
      room: "740",
      days: "B",
      markingPeriods: "MP1, MP2",
      average: 90.2,
      letterGrade: "A",
      assignments: [
        { dateDue: "08/26/2026", dateAssigned: "08/19/2026", name: "Syllabus", category: "Formative", score: "100", totalPoints: 100, weight: 0, missing: false, exempt: false }
      ]
    },
    {
      id: "8432A - 9",
      name: "Advanced Spanish III",
      period: "08",
      teacher: "Tijerina, Yakeline",
      room: "112",
      days: "B",
      markingPeriods: "MP1, MP2",
      average: 97.1,
      letterGrade: "A",
      assignments: []
    },
    {
      id: "6026A - 9",
      name: "Lifetime Fitness & Wellness",
      period: "02",
      teacher: "Steele, Levi",
      room: "AxGym",
      days: "A",
      markingPeriods: "MP1, MP2",
      average: 100,
      letterGrade: "A",
      assignments: []
    }
  ],
  upcoming: [
    { dateDue: "09/10/2026", dateAssigned: "09/01/2026", name: "Argumentative Paragraph", class: "TAG/Advanced English I", category: "Minor", score: null, totalPoints: 100, weight: 0, missing: false, exempt: false }
  ],
  missing: [
    { dateDue: "09/07/2026", dateAssigned: "08/28/2026", name: "Bridge Project", class: "Intro Engineering Design", category: "Major", score: null, totalPoints: 100, weight: 0, missing: true, exempt: false }
  ],
  transcript: {
    years: [
      {
        year: "2024-25", grade: "07", building: "Cedar Valley Middle School", totalCredit: 3,
        courses: [
          { courseId: "13036200 - 1", description: "PRAPPENG", sem1: "100", sem2: "99", final: "100", credit: 1 },
          { courseId: "03440100 - 1", description: "SPAN 1",   sem1: "95",  sem2: "97", final: "96",  credit: 1 },
          { courseId: "03100500 - 1", description: "ALG 1",    sem1: "99",  sem2: "100",final: "100", credit: 1 }
        ]
      },
      {
        year: "2025-26", grade: "08", building: "Cedar Valley Middle School", totalCredit: 4,
        courses: [
          { courseId: "03100700 - 1", description: "GEOM",   sem1: "100", sem2: "97",  final: "99",  credit: 1 },
          { courseId: "03440200 - 1", description: "SPAN 2", sem1: "100", sem2: "97",  final: "99",  credit: 1 },
          { courseId: "03500100 - 1", description: "ART 1",  sem1: "100", sem2: "100", final: "100", credit: 1 },
          { courseId: "03580140 - 1", description: "TAFCS",  sem1: "99",  sem2: "100", final: "100", credit: 1 }
        ]
      }
    ],
    gpa: { weighted: 4.28, unweighted: 3.92 }
  },
  attendance: []
};
