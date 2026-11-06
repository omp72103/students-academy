// Roles & privileges (Educollo ERP model + per-user privileges).
// Management (admin) has everything. Faculty and Office Staff get role defaults,
// and Management can grant extra privileges per person (e.g. "biometric", "fees").
// The same matrix is enforced in the database by public.sa_has() (see supabase/schema.sql).

export const ROLES = {
  admin: { label: 'Management', color: 'bg-indigo-100 text-indigo-700' },
  staff: { label: 'Office Staff', color: 'bg-cyan-100 text-cyan-700' },
  faculty: { label: 'Faculty', color: 'bg-emerald-100 text-emerald-700' },
  student: { label: 'Student', color: 'bg-sky-100 text-sky-700' },
  parent: { label: 'Parent', color: 'bg-amber-100 text-amber-700' },
}

/** Grantable privileges (shown as checkboxes on Faculty & Staff). */
export const PRIVILEGES = [
  ['students', 'Admissions & student records', 'Add/edit students and parents, import CSV'],
  ['fees', 'Fees', 'Collect fees, receipts, reminders'],
  ['enquiries', 'Enquiries & leads', 'Manage admission enquiries'],
  ['attendance', 'Student attendance', 'Mark & edit attendance for all batches'],
  ['staffAttendance', 'Staff attendance', 'Mark faculty/staff attendance'],
  ['marks', 'Marks management', 'Create exams, enter marks, publish results'],
  ['biometric', 'Biometric devices', 'Register devices, map IDs, view punch logs'],
  ['tests', 'Online tests', 'Create and publish online tests'],
  ['materials', 'Study material', 'Upload notes and resources'],
  ['assignments', 'Assignments', 'Create and grade assignments'],
  ['notices', 'Notices', 'Publish notices'],
  ['messaging', 'SMS & WhatsApp', 'Send messages to parents/students'],
  ['timetable', 'Timetable', 'Edit lecture timetable'],
  ['batches', 'Batches', 'Create and edit batches'],
]

const DEFAULTS = {
  admin: ['*'],
  staff: ['dashboard', 'students', 'parents', 'fees', 'enquiries', 'attendance', 'staffAttendance', 'messaging', 'notices',
    'batches.view', 'timetable.view', 'marks.view', 'results.view'],
  faculty: ['dashboard', 'attendance', 'marks', 'tests', 'materials', 'assignments', 'notices', 'messaging', 'results',
    'students.view', 'batches.view', 'timetable.view', 'enquiries.view', 'staffAttendance.own'],
  student: ['dashboard', 'materials.view', 'tests.take', 'results.own', 'marks.own', 'assignments.own', 'notices.view', 'timetable.view', 'attendance.own', 'fees.own'],
  parent: ['dashboard', 'results.own', 'marks.own', 'attendance.own', 'fees.own', 'notices.view', 'timetable.view', 'assignments.own'],
}

export function permsOf(user) {
  if (!user) return []
  const base = DEFAULTS[user.role] || []
  return ['staff', 'faculty'].includes(user.role) ? [...base, ...(user.privileges || [])] : base
}

/** can(user, 'fees') = full access; can(user, 'fees.own') etc. = limited view. A full privilege implies its sub-views. */
export function can(user, perm) {
  const m = permsOf(user)
  if (m.includes('*')) return true
  const base = perm.split('.')[0]
  return m.includes(perm) || m.includes(base) || (perm === base && m.some((x) => x.startsWith(base + '.')))
}
/** True only for full (write) access to a privilege. */
export const canManage = (user, priv) => { const m = permsOf(user); return m.includes('*') || m.includes(priv) }
export const isStaffSide = (user) => ['admin', 'staff', 'faculty'].includes(user?.role)
