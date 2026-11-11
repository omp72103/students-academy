// Default institute profile. Every field here is editable from Portal → Settings
// (stored in the `settings` table), so the official site always reflects the ERP.
export const DEFAULT_SETTINGS = {
  id: 'institute',
  name: 'Students Academy',
  shortName: 'Students Academy',
  tagline: 'A Home for Learning — Since 2012',
  location: 'Grant Road (West), Mumbai',
  address: 'Students Academy, Grant Road (West), Mumbai, Maharashtra 400007',
  phone: '+91 00000 00000',
  whatsapp: '910000000000',
  email: '',
  timings: 'Mon – Sat · 8:00 AM – 9:00 PM',
  mapQuery: 'Students Academy Grant Road West Mumbai',
  established: '2012',
  smsSignature: '- Students Academy, Grant Road',
  admissionsOpen: true,
  // Founder & Director (editable in Portal → Settings → Institute profile)
  founderName: 'Mr. Vishal Khandekar Sir',
  founderTitle: 'Founder & Director',
  founderMessage: '',
  founderPhoto: '',
  admissionBanner: 'Admissions open for 2026–27: SSC 9th & 10th, FYJC/SYJC Science, Commerce & IT, MHT-CET / JEE / NEET.',
}

export const PROGRAMS = [
  {
    slug: 'school', title: 'School Section — 9th & 10th (SSC)', icon: 'School',
    standards: ['9th', '10th'],
    summary: 'Complete Maharashtra State Board coaching for Science 1 & 2, Maths 1 & 2, Social Science and languages.',
    subjects: ['Science 1 (Physics & Chemistry)', 'Science 2 (Biology & Environment)', 'Maths 1 (Algebra)', 'Maths 2 (Geometry)', 'History & Political Science', 'Geography', 'English', 'Marathi / Hindi'],
    highlights: ['Chapterwise notes', 'Board PYQs from 2019–2026', 'Board-pattern practice exams', 'Weekly chapter tests'],
  },
  {
    slug: 'science', title: 'FYJC & SYJC Science (11th–12th)', icon: 'Atom',
    standards: ['11th Science', '12th Science'],
    summary: 'HSC Physics, Chemistry, Mathematics and Biology with a strong board + entrance foundation.',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    highlights: ['Handwritten Physics notes', 'Full question bank solutions', 'Chapterwise formula sheets', 'HSC board papers 2019–2024'],
  },
  {
    slug: 'entrance', title: 'MHT-CET / JEE Main / NEET-UG', icon: 'Target',
    standards: ['JEE / NEET / CET'],
    summary: 'Entrance-oriented problem solving, fast revision notes and flash cards for competitive exams.',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    highlights: ['Physics fast-revision notes', 'Flash cards', 'Timed online mock tests', 'Performance analytics'],
  },
  {
    slug: 'commerce', title: 'FYJC & SYJC Commerce', icon: 'BarChart3',
    standards: ['12th Commerce'],
    summary: 'Accountancy, Economics, Secretarial Practice and Maths & Statistics, plus MAH-CET (BBA / BCA / BMS / BMM) preparation.',
    subjects: ['Book Keeping & Accountancy', 'Economics', 'Secretarial Practice', 'Mathematics & Statistics', 'Information Technology'],
    highlights: ['Memory maps for every subject', 'One-sentence answer banks', 'MAH-CET PYQs'],
  },
  {
    slug: 'it-cs', title: 'Information Technology & Computer Science', icon: 'Monitor',
    standards: ['11th IT', '12th IT', '12th Computer Science'],
    summary: 'HSC IT (Science & Commerce) and Computer Science 1 & 2 — theory, practicals and SOP journals.',
    subjects: ['Advanced Web Designing', 'Digital Marketing', 'Computerised Accounting with GST', 'E-Commerce & E-Governance', 'DBMS', 'C++ / Data Structures'],
    highlights: ['Textbook exercise solutions', 'Practical SOPs', 'Cheat sheets & most-likely questions'],
  },
  {
    slug: 'electronics', title: 'Electronics & Programming', icon: 'Cpu',
    standards: ['12th Electronics', 'Programming'],
    summary: 'HSC Electronics plus hands-on 8085/8086 microprocessors, 8051 microcontroller, Arduino, circuit building, Scratch and web development.',
    subjects: ['HSC Electronics (C2)', '8085 / 8086 Microprocessors', '8051 Microcontroller', 'Arduino IDE', 'Scratch', 'HTML & Web'],
    highlights: ['DIY electronics projects', 'Guess papers', 'Lab-style learning'],
  },
]
