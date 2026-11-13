// Demo seed data — realistic enough to demo every role end-to-end.
// Replace with real data by importing CSVs from the portal or via Supabase.
import { SEED_MATERIALS } from '../data/materials'
import { DEFAULT_SETTINGS } from '../data/site'

const iso = (d) => d.toISOString()
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
const ymd = (d) => d.toISOString().slice(0, 10)

export function buildSeed() {
  const batches = [
    { id: 'b10A', name: '10th SSC — Batch A (Morning)', standard: '10th', stream: 'SSC', timing: '7:30 AM – 10:30 AM', startTime: '07:30', room: 'Room 1', facultyIds: ['u-sai', 'u-hemant'], fee: 32000 },
    { id: 'b10B', name: '10th SSC — Batch B (Evening)', standard: '10th', stream: 'SSC', timing: '5:00 PM – 8:00 PM', startTime: '17:00', room: 'Room 2', facultyIds: ['u-sai', 'u-hemant'], fee: 32000 },
    { id: 'b12S', name: '12th Science — PCM + CET', standard: '12th Science', stream: 'Science', timing: '3:00 PM – 6:00 PM', startTime: '15:00', room: 'Room 3', facultyIds: ['u-sai'], fee: 48000 },
    { id: 'b12C', name: '12th Commerce + IT', standard: '12th Commerce', stream: 'Commerce', timing: '11:00 AM – 2:00 PM', startTime: '11:00', room: 'Room 2', facultyIds: ['u-priya'], fee: 28000 },
  ]

  const users = [
    { id: 'u-admin', role: 'admin', name: 'Vishal Khandekar Sir', email: 'admin@studentsacademy.in', phone: '9000000001', password: 'admin123', designation: 'Founder & Director' },
    { id: 'u-office', role: 'staff', name: 'Front Office', email: 'office@studentsacademy.in', phone: '9000000002', password: 'office123', designation: 'Office Executive', biometricId: '9002', privileges: ['biometric'] },
    { id: 'u-sai', role: 'faculty', name: 'Sai Sir', email: 'sai@studentsacademy.in', phone: '9000000010', password: 'faculty123', biometricId: '9010', designation: 'Head Master — School Section', subjects: ['Physics', 'Science 1', 'Science 2', 'Electronics', 'Computer Science'] },
    { id: 'u-hemant', role: 'faculty', name: 'Hemant Sir', email: 'hemant@studentsacademy.in', phone: '9000000011', password: 'faculty123', biometricId: '9011', designation: 'Faculty — Languages', subjects: ['Hindi', 'Marathi', 'English'] },
    { id: 'u-priya', role: 'faculty', name: 'Priya Ma\'am', email: 'priya@studentsacademy.in', phone: '9000000012', password: 'faculty123', biometricId: '9012', designation: 'Faculty — Commerce', subjects: ['Accountancy', 'Economics', 'Information Technology'] },
  ]

  const names = [
    ['Aarav Shah', 'b10A'], ['Diya Mehta', 'b10A'], ['Ishaan Patil', 'b10A'], ['Sara Khan', 'b10A'],
    ['Vihaan Joshi', 'b10B'], ['Ananya Gupta', 'b10B'], ['Kabir Desai', 'b10B'],
    ['Riya Nair', 'b12S'], ['Arjun Iyer', 'b12S'], ['Meera Kulkarni', 'b12S'],
    ['Zoya Sheikh', 'b12C'], ['Yash Agarwal', 'b12C'],
  ]
  const students = names.map(([name, batchId], i) => {
    const b = batches.find((x) => x.id === batchId)
    return {
      id: 'st' + (i + 1), role: 'student', name, batchId, standard: b.standard,
      rollNo: `SA26-${String(i + 1).padStart(3, '0')}`,
      email: name.split(' ')[0].toLowerCase() + '@student.sa', phone: '98' + String(20000000 + i * 1117).slice(0, 8),
      password: 'student123', parentName: 'Parent of ' + name.split(' ')[0], parentPhone: '97' + String(30000000 + i * 1313).slice(0, 8),
      dob: '2010-0' + ((i % 9) + 1) + '-1' + (i % 9), school: i % 2 ? 'J.D. Bharda High School' : 'St. Columba School',
      admissionDate: ymd(daysAgo(150 - i * 3)), status: 'active', biometricId: String(1001 + i), feeTotal: b.fee, discount: i % 4 === 0 ? 2000 : 0,
    }
  })
  const parents = students.map((s, i) => ({
    id: 'p' + (i + 1), role: 'parent', name: s.parentName, phone: s.parentPhone,
    email: s.name.split(' ')[0].toLowerCase() + '.parent@sa.in', password: 'parent123', childIds: [s.id],
  }))

  // attendance — last 12 class days for each batch
  const attendance = []
  batches.forEach((b) => {
    for (let d = 1; d <= 14; d++) {
      const day = daysAgo(d); if (day.getDay() === 0) continue
      const records = {}
      students.filter((s) => s.batchId === b.id).forEach((s, k) => { records[s.id] = (d + k) % 7 === 0 ? 'A' : (d + k) % 11 === 0 ? 'L' : 'P' })
      attendance.push({ id: `att-${b.id}-${ymd(day)}`, batchId: b.id, date: ymd(day), records, markedBy: b.facultyIds[0], createdAt: iso(day) })
    }
  })

  const q = (text, options, answer, explanation = '') => ({ id: Math.random().toString(36).slice(2, 8), text, options, answer, marks: 1, explanation })
  const tests = [
    {
      id: 't1', title: 'Gravitation — Chapter Test', batchIds: ['b10A', 'b10B'], subject: 'Science 1', durationMin: 15, status: 'published',
      createdBy: 'u-sai', startAt: iso(daysAgo(6)), negative: 0, shuffle: true,
      questions: [
        q('The value of universal gravitational constant G is', ['6.67 × 10⁻¹¹ N m²/kg²', '9.8 m/s²', '6.67 × 10¹¹ N m²/kg²', '3 × 10⁸ m/s'], 0),
        q('The acceleration due to gravity on the Moon is about ___ of that on Earth.', ['1/2', '1/6', '1/4', 'Same'], 1),
        q('Kepler\'s third law states T² is proportional to', ['r', 'r²', 'r³', '1/r'], 2),
        q('Weight of an object is maximum at', ['Equator', 'Poles', 'Centre of Earth', 'Moon'], 1),
        q('Escape velocity from Earth\'s surface is approximately', ['11.2 km/s', '7.9 km/s', '3 km/s', '25 km/s'], 0),
      ],
    },
    {
      id: 't2', title: 'Electrostatics — MHT-CET Practice', batchIds: ['b12S'], subject: 'Physics', durationMin: 20, status: 'published',
      createdBy: 'u-sai', startAt: iso(daysAgo(3)), negative: 0, shuffle: false,
      questions: [
        q('SI unit of electric charge is', ['Volt', 'Coulomb', 'Ampere', 'Farad'], 1),
        q('Electric field inside a charged conducting sphere is', ['Maximum', 'Zero', 'Infinite', 'Depends on radius'], 1),
        q('Capacitance of a parallel plate capacitor increases when', ['Plate separation increases', 'A dielectric is inserted', 'Plate area decreases', 'Charge decreases'], 1),
        q('1 μF equals', ['10⁻³ F', '10⁻⁶ F', '10⁻⁹ F', '10⁻¹² F'], 1),
      ],
    },
    {
      id: 't3', title: 'Book Keeping — Basics Quiz', batchIds: ['b12C'], subject: 'Accountancy', durationMin: 10, status: 'draft',
      createdBy: 'u-priya', startAt: iso(daysAgo(0)), negative: 0, shuffle: false,
      questions: [q('Partnership deed is also called', ['Articles of Partnership', 'Memorandum', 'Prospectus', 'Charter'], 0)],
    },
  ]
  const attempts = []
  students.filter((s) => ['b10A', 'b10B'].includes(s.batchId)).forEach((s, i) => {
    const score = 2 + (i % 4)
    attempts.push({ id: 'a-t1-' + s.id, testId: 't1', studentId: s.id, answers: {}, score, total: 5, percent: Math.round((score / 5) * 100), submittedAt: iso(daysAgo(5)), timeTakenSec: 400 + i * 30 })
  })
  students.filter((s) => s.batchId === 'b12S').forEach((s, i) => {
    const score = 2 + i
    attempts.push({ id: 'a-t2-' + s.id, testId: 't2', studentId: s.id, answers: {}, score: Math.min(score, 4), total: 4, percent: Math.round((Math.min(score, 4) / 4) * 100), submittedAt: iso(daysAgo(2)), timeTakenSec: 600 })
  })

  const fees = []
  students.forEach((s, i) => {
    fees.push({ id: 'f' + i + 'a', studentId: s.id, amount: Math.round(s.feeTotal * 0.4), mode: i % 2 ? 'UPI' : 'Cash', date: ymd(daysAgo(120)), receiptNo: 'SA/26/' + (1000 + i * 2), note: 'Admission instalment' })
    if (i % 3 !== 0) fees.push({ id: 'f' + i + 'b', studentId: s.id, amount: Math.round(s.feeTotal * 0.3), mode: 'UPI', date: ymd(daysAgo(40)), receiptNo: 'SA/26/' + (1001 + i * 2), note: '2nd instalment' })
  })

  const notices = [
    { id: 'n1', title: 'Unit Test 2 results declared for 10th SSC', body: 'Results are available in the student and parent portal under Exam Marks. Parents also receive scores on SMS / WhatsApp.', audience: 'all', publishOnWebsite: true, pinned: true, createdAt: iso(daysAgo(4)), createdBy: 'u-admin' },
    { id: 'n2', title: 'Diwali vacation: classes resume Monday', body: 'The academy will remain closed during the Diwali break. Regular batches resume as per the timetable.', audience: 'all', publishOnWebsite: true, createdAt: iso(daysAgo(10)), createdBy: 'u-admin' },
    { id: 'n3', title: '10th Prelim Exam schedule', body: 'Prelim exams for 10th SSC batches begin in the first week of December. Detailed timetable will be shared in the portal.', audience: 'students', batchId: '', publishOnWebsite: false, createdAt: iso(daysAgo(2)), createdBy: 'u-sai' },
    { id: 'n4', title: 'Parent–Teacher Meeting', body: 'PTM for all 10th SSC parents on Saturday, 11:00 AM at the academy.', audience: 'parents', publishOnWebsite: false, createdAt: iso(daysAgo(1)), createdBy: 'u-admin' },
  ]

  const enquiries = [
    { id: 'e1', name: 'Rahul Verma', phone: '9811122233', email: '', standard: '10th', message: 'Want details of evening batch fees.', status: 'new', source: 'Website', createdAt: iso(daysAgo(1)) },
    { id: 'e2', name: 'Sneha Pawar', phone: '9822233344', email: 'sneha@example.com', standard: '12th Science', message: 'CET crash course availability?', status: 'contacted', source: 'WhatsApp', followUp: ymd(daysAgo(-2)), createdAt: iso(daysAgo(3)) },
    { id: 'e3', name: 'Imran Qureshi', phone: '9833344455', email: '', standard: '9th', message: 'Admission for son in 9th.', status: 'admitted', source: 'Walk-in', createdAt: iso(daysAgo(12)) },
  ]

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const timetable = []
  days.forEach((day, i) => {
    timetable.push({ id: 'tt-a-' + day, batchId: 'b10A', day, start: '07:30', end: '09:00', subject: i % 2 ? 'Science 2' : 'Science 1', facultyId: 'u-sai' })
    timetable.push({ id: 'tt-a2-' + day, batchId: 'b10A', day, start: '09:00', end: '10:30', subject: i % 3 ? 'Maths 1' : 'Maths 2', facultyId: 'u-sai' })
    timetable.push({ id: 'tt-b-' + day, batchId: 'b10B', day, start: '17:00', end: '18:30', subject: i % 2 ? 'Hindi' : 'Marathi', facultyId: 'u-hemant' })
    timetable.push({ id: 'tt-s-' + day, batchId: 'b12S', day, start: '15:00', end: '16:30', subject: 'Physics', facultyId: 'u-sai' })
    timetable.push({ id: 'tt-c-' + day, batchId: 'b12C', day, start: '11:00', end: '12:30', subject: i % 2 ? 'Economics' : 'Book Keeping & Accountancy', facultyId: 'u-priya' })
  })

  const assignments = [
    { id: 'as1', title: 'Gravitation numericals — Set 1', batchId: 'b10A', subject: 'Science 1', description: 'Solve Q1–Q15 from the Gravitation worksheet given in class. Show all steps.', dueDate: ymd(daysAgo(-3)), attachmentUrl: '', createdBy: 'u-sai', createdAt: iso(daysAgo(2)), maxMarks: 20 },
    { id: 'as2', title: 'Electrostatics derivations', batchId: 'b12S', subject: 'Physics', description: 'Write derivations for capacitance of a parallel plate capacitor with and without dielectric.', dueDate: ymd(daysAgo(-5)), createdBy: 'u-sai', createdAt: iso(daysAgo(1)), maxMarks: 10 },
  ]
  const submissions = [
    { id: 'sub1', assignmentId: 'as1', studentId: 'st1', text: 'Submitted in notebook, photo attached.', url: '', grade: 17, feedback: 'Good, check units in Q7.', submittedAt: iso(daysAgo(1)) },
  ]

  // Demo-only samples so the section can be previewed; the live site starts empty and the academy adds real ones.
  const testimonials = [
    { id: 'ts1', name: 'Sample — Parent', role: 'Parent of a 10th SSC student', stream: 'SSC', text: 'Sample testimonial. Replace it from Portal → Website Content → Testimonials with a real message from a parent.', order: 1 },
    { id: 'ts2', name: 'Sample — Student', role: 'HSC Science student', stream: 'Science', text: 'Sample testimonial. Add real student feedback, a photo and an optional YouTube video link from the portal.', order: 2 },
    { id: 'ts3', name: 'Sample — Student', role: 'HSC Commerce student', stream: 'Commerce', text: 'Sample testimonial. Each testimonial can be tagged with a stream so visitors can filter them.', order: 3 },
  ]

  const toppers = [
    { id: 'tp1', name: 'Sample Topper', exam: 'SSC Board', year: '2026', score: '96.4%', note: 'Replace with real results from Portal → Website → Toppers', order: 1 },
    { id: 'tp2', name: 'Sample Topper', exam: 'HSC Science', year: '2026', score: '91.2%', note: '', order: 2 },
    { id: 'tp3', name: 'Sample Topper', exam: 'MHT-CET', year: '2026', score: '99.1 %ile', note: '', order: 3 },
  ]

  // ---- marks (offline exams) ----
  const SUBJ = { b10A: ['English', 'Maths 1', 'Maths 2', 'Science 1', 'Science 2'], b10B: ['English', 'Maths 1', 'Maths 2', 'Science 1', 'Science 2'], b12S: ['Physics', 'Chemistry', 'Mathematics'], b12C: ['Book Keeping & Accountancy', 'Economics', 'Secretarial Practice'] }
  const mk = (id, name, type, batchId, ago, max, status) => {
    const subjects = SUBJ[batchId].map((n) => ({ name: n, max, pass: Math.ceil(max * 0.35) }))
    const marks = {}
    students.filter((s) => s.batchId === batchId).forEach((s, k) => {
      marks[s.id] = Object.fromEntries(subjects.map((sub, j) => [sub.name, (k === 2 && j === 1 && id === 'ex1') ? 'AB' : String(Math.max(3, Math.min(max, Math.round(max * (0.45 + ((k * 7 + j * 13 + id.length * 3) % 50) / 100)))))]))
    })
    return { id, name, type, batchId, date: ymd(daysAgo(ago)), subjects, marks, status, createdBy: 'u-sai', createdAt: iso(daysAgo(ago)) }
  }
  const exams = [
    mk('ex1', 'Unit Test 1', 'Unit Test', 'b10A', 30, 25, 'published'), mk('ex2', 'Unit Test 2', 'Unit Test', 'b10A', 9, 25, 'published'),
    mk('ex3', 'Unit Test 1', 'Unit Test', 'b10B', 28, 25, 'published'), mk('ex4', 'Mid-term Examination', 'Mid-term', 'b12S', 12, 70, 'published'),
    mk('ex5', 'Monthly Test — October', 'Weekly Test', 'b12C', 15, 40, 'draft'),
  ]

  // ---- biometric ----
  const devices = [
    { id: 'dev1', name: 'Main entrance', serialNo: 'CJDE231560123', model: 'ZKTeco', location: 'Ground floor reception', purpose: 'both', active: true, token: 'demo-token-main-entrance', lastSeen: iso(new Date(Date.now() - 4 * 60000)), punchCount: 0 },
    { id: 'dev2', name: 'Staff room', serialNo: 'ESSL9X0042', model: 'eSSL', location: '1st floor staff room', purpose: 'staff', active: true, token: 'demo-token-staff-room', lastSeen: iso(daysAgo(2)), punchCount: 0 },
  ]
  const punches = [], staffAttendance = []
  const stamp = (d, h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x }
  const local = (x) => `${ymd(x)}T${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}:00`
  for (let d = 1; d <= 6; d++) {
    const day = daysAgo(d); if (day.getDay() === 0) continue
    const recs = {}
    users.filter((u) => u.biometricId).forEach((u, k) => {
      const inT = stamp(day, u.role === 'faculty' ? 8 : 9, (k * 7 + d * 3) % 25), outT = stamp(day, 18, (k * 11 + d) % 40)
      ;[inT, outT].forEach((t, j) => punches.push({ id: `${j ? 'ESSL9X0042' : 'CJDE231560123'}-${u.biometricId}-${local(t).replace(/\D/g, '')}`, deviceSn: j ? 'ESSL9X0042' : 'CJDE231560123', deviceName: j ? 'Staff room' : 'Main entrance', pin: u.biometricId, time: local(t), date: ymd(day), userId: u.id, userName: u.name, role: u.role }))
      recs[u.id] = { status: 'P', in: local(inT).slice(11, 16), out: local(outT).slice(11, 16), source: 'biometric' }
    })
    staffAttendance.push({ id: `sat-${ymd(day)}`, date: ymd(day), records: recs, markedBy: 'biometric', createdAt: iso(day) })
    students.slice(0, 6).forEach((s, k) => { const t = stamp(day, Number(batches.find((b) => b.id === s.batchId).startTime.slice(0, 2)), (k * 4 + d) % 20); punches.push({ id: `CJDE231560123-${s.biometricId}-${local(t).replace(/\D/g, '')}`, deviceSn: 'CJDE231560123', deviceName: 'Main entrance', pin: s.biometricId, time: local(t), date: ymd(day), userId: s.id, userName: s.name, role: 'student' }) })
  }
  punches.push({ id: 'CJDE231560123-4040-x', deviceSn: 'CJDE231560123', deviceName: 'Main entrance', pin: '4040', time: local(stamp(daysAgo(1), 9, 41)), date: ymd(daysAgo(1)), userId: null, userName: null, role: null })
  devices[0].punchCount = punches.filter((p) => p.deviceSn === 'CJDE231560123').length; devices[1].punchCount = punches.length - devices[0].punchCount

  return {
    exams, devices, punches, staff_attendance: staffAttendance,
    settings: [DEFAULT_SETTINGS], users: [...users, ...students, ...parents], batches, materials: SEED_MATERIALS,
    attendance, tests, attempts, assignments, submissions, fees, notices, enquiries, timetable, messages: [], toppers, testimonials,
  }
}
