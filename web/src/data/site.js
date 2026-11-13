// Default institute profile. Every field here is editable from Portal → Settings
// (stored in the `settings` table), so the official site always reflects the ERP.
export const DEFAULT_SETTINGS = {
  id: 'institute',
  name: 'Students Academy',
  shortName: 'Students Academy',
  tagline: 'A Home for Learning — Since 2005',
  location: 'Nana Chowk, Grant Road (West), Mumbai',
  address: 'Office No. 107, 1st Floor, Vidya Chamber, Plot No. 305, Opp. Orbit Heights Tower, Nana Chowk, Grant Road (W), Mumbai, Maharashtra 400007',
  phone: '+91 77180 88017',
  whatsapp: '917718088017',
  email: 'office.studentsacademy@gmail.com',
  timings: 'All days · 8:00 AM – 8:00 PM',
  mapQuery: 'Students Academy, Vidya Chamber, Nana Chowk, Grant Road West, Mumbai 400007',
  established: '2005',
  // Public Google rating shown on the website (update from the Google Business profile)
  googleRating: '4.9',
  googleReviews: '380',
  smsSignature: '- Students Academy, Grant Road',
  admissionsOpen: true,
  // Social media links (shown in the website header and footer when filled in)
  facebook: '', instagram: '', youtube: '', linkedin: '',
  // Founder & Director (editable in Portal → Settings)
  founderName: 'Mr. Vishal Khandekar Sir',
  founderTitle: 'Founder & Director',
  founderMessage: '',
  founderPhoto: '',
  admissionBanner: 'Admissions open for 2026–27: 8th, 9th & 10th, FYJC/SYJC Science & Commerce, and FY/SY/TY B.Com & BAF.',
}

// Courses offered (as listed by the academy).
export const PROGRAMS = [
  {
    slug: 'school', short: 'Std 8th – 10th', title: 'School Section — 8th, 9th & 10th', icon: 'School',
    standards: ['8th', '9th', '10th'],
    summary: 'English-medium coaching for 8th, 9th and 10th covering all main subjects, with regular tests and SSC board-exam practice.',
    subjects: ['Science 1 & 2', 'Mathematics (Algebra & Geometry)', 'English', 'History & Political Science', 'Geography', 'Hindi / Marathi'],
    highlights: ['English medium', 'Chapterwise notes', 'Weekly chapter tests', 'Board-pattern practice papers'],
  },
  {
    slug: 'science', short: 'FYJC / SYJC Science', title: 'FYJC & SYJC Science (11th & 12th)', icon: 'Atom',
    standards: ['11th Science', '12th Science'],
    summary: 'HSC Science coaching in Physics, Chemistry, Mathematics and Biology with concept-first teaching and regular practice.',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    highlights: ['Concept-first teaching', 'Board question-paper practice', 'Regular tests & analysis', 'Doubt-solving sessions'],
  },
  {
    slug: 'commerce', short: 'FYJC / SYJC Commerce', title: 'FYJC & SYJC Commerce (11th & 12th)', icon: 'BarChart3',
    standards: ['11th Commerce', '12th Commerce'],
    summary: 'HSC Commerce coaching in Accountancy, Economics, OCM, Secretarial Practice and Maths & Statistics.',
    subjects: ['Book Keeping & Accountancy', 'Economics', 'Organisation of Commerce & Management', 'Secretarial Practice', 'Mathematics & Statistics', 'English'],
    highlights: ['Accounts practice problems', 'Answer-writing practice', 'Board question-paper practice', 'Regular tests'],
  },
  {
    slug: 'degree', short: 'B.Com & BAF', title: 'B.Com & BAF (FY, SY, TY)', icon: 'GraduationCap',
    standards: ['FY B.Com', 'SY B.Com', 'TY B.Com', 'FY BAF', 'SY BAF', 'TY BAF'],
    summary: 'University of Mumbai B.Com and BAF coaching for all three years, semester by semester.',
    subjects: ['Financial Accounting', 'Cost Accounting', 'Management Accounting', 'Business Economics', 'Business Law', 'Taxation', 'Auditing'],
    highlights: ['Semester-wise coaching', 'Accounts & taxation practice', 'University exam papers', 'Regular tests'],
  },
]
