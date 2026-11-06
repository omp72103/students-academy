import { useState, useSyncExternalStore } from 'react'
import { NavLink, Outlet, Navigate, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserRound, GraduationCap, Layers, CalendarDays, CalendarCheck, Library, ClipboardList, BarChart3,
  NotebookPen, Wallet, Megaphone, MessageSquare, Globe, Settings, LogOut, Menu, X, PhoneCall, UserCog, Bell, ShieldCheck, Smartphone,
} from 'lucide-react'
import { useAuth, ROLES } from '../lib/auth'
import { MODE, useTable } from '../lib/db'
import { Avatar } from '../components/ui'
import SendQueue from '../components/SendQueue'
import { cls } from '../lib/utils'
import { isAndroidApp } from '../lib/messaging'

export const APK_URL = 'https://github.com/omp72103/students-academy/releases/latest/download/StudentsAcademy.apk'

const NAV = {
  admin: [
    ['Overview', [['dashboard', 'Dashboard', LayoutDashboard], ['enquiries', 'Enquiries & Leads', PhoneCall]]],
    ['People', [['students', 'Students', GraduationCap], ['parents', 'Parents', UserRound], ['faculty', 'Faculty & Staff', UserCog]]],
    ['Academics', [['batches', 'Batches', Layers], ['timetable', 'Timetable', CalendarDays], ['attendance', 'Attendance', CalendarCheck]]],
    ['Learning (LMS)', [['materials', 'Study Material', Library], ['tests', 'Online Tests', ClipboardList], ['results', 'Results & Analytics', BarChart3], ['assignments', 'Assignments', NotebookPen]]],
    ['Office', [['fees', 'Fees', Wallet], ['notices', 'Notices', Megaphone], ['messaging', 'SMS & WhatsApp', MessageSquare]]],
    ['System', [['website', 'Website Content', Globe], ['settings', 'Settings', Settings]]],
  ],
  faculty: [
    ['Overview', [['dashboard', 'Dashboard', LayoutDashboard]]],
    ['Teaching', [['batches', 'My Batches', Layers], ['students', 'Students', GraduationCap], ['timetable', 'Timetable', CalendarDays], ['attendance', 'Attendance', CalendarCheck]]],
    ['Learning (LMS)', [['materials', 'Study Material', Library], ['tests', 'Online Tests', ClipboardList], ['results', 'Results & Analytics', BarChart3], ['assignments', 'Assignments', NotebookPen]]],
    ['Communication', [['notices', 'Notices', Megaphone], ['messaging', 'SMS & WhatsApp', MessageSquare], ['enquiries', 'Enquiries', PhoneCall]]],
  ],
  student: [
    ['My Learning', [['dashboard', 'Dashboard', LayoutDashboard], ['materials', 'Study Material', Library], ['tests', 'Online Tests', ClipboardList], ['results', 'My Results', BarChart3], ['assignments', 'Assignments', NotebookPen]]],
    ['My Academy', [['attendance', 'My Attendance', CalendarCheck], ['timetable', 'Timetable', CalendarDays], ['fees', 'Fees', Wallet], ['notices', 'Notices', Bell]]],
  ],
  parent: [
    ['My Child', [['dashboard', 'Overview', LayoutDashboard], ['attendance', 'Attendance', CalendarCheck], ['results', 'Test Results', BarChart3], ['assignments', 'Assignments', NotebookPen]]],
    ['Academy', [['timetable', 'Timetable', CalendarDays], ['fees', 'Fees', Wallet], ['notices', 'Notices', Bell]]],
  ],
}

export function PortalShell() {
  const { user, ready, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  if (!ready) return <div className="min-h-screen grid place-items-center text-slate-500">Loading…</div>
  if (!user) return <Navigate to="/portal/login" replace />
  const groups = NAV[user.role] || []

  const Sidebar = (
    <aside className="flex flex-col h-full bg-[#0f172a] text-slate-300 w-64">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/5">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center"><GraduationCap size={19} className="text-white" /></div>
        <div className="leading-tight"><div className="text-white font-semibold text-sm">Students Academy</div><div className="text-[11px] text-slate-400">Learning & ERP Portal</div></div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map(([g, items]) => (
          <div key={g}>
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{g}</div>
            {items.map(([to, label, Icon]) => (
              <NavLink key={to} to={`/portal/${to}`} onClick={() => setOpen(false)}
                className={({ isActive }) => cls('flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition', isActive ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-white/5 hover:text-white')}>
                <Icon size={17} />{label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 p-2">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1"><div className="text-sm text-white truncate">{user.name}</div><div className="text-[11px] text-slate-400">{ROLES[user.role]?.label}</div></div>
          <button onClick={async () => { await logout(); nav('/portal/login') }} className="p-2 rounded-md hover:bg-white/10" title="Logout"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30">{Sidebar}</div>
      {open && <div className="lg:hidden fixed inset-0 z-50 flex"><div className="h-full">{Sidebar}</div><div className="flex-1 bg-black/40" onClick={() => setOpen(false)} /></div>}
      <div className="flex-1 lg:pl-64 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden btn-ghost p-2" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={20} /></button>
            <div className="hidden sm:block text-sm text-slate-500">Welcome back, <span className="font-semibold text-slate-800">{user.name.split(' ')[0]}</span></div>
          </div>
          <div className="flex items-center gap-2">
            {isAndroidApp() && <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 gap-1"><Smartphone size={12} />App</span>}
            {MODE === 'demo' && <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">Demo data</span>}
            <span className={cls('badge', ROLES[user.role]?.color)}>{ROLES[user.role]?.label}</span>
            <Link to="/" className="btn-ghost btn-sm hidden sm:inline-flex"><Globe size={15} />Website</Link>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px]"><Outlet /></main>
        <SendQueue />
      </div>
    </div>
  )
}

export function Login() {
  const { user, login } = useAuth()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  if (user) return <Navigate to="/portal/dashboard" replace />
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await login(id, pw); nav('/portal/dashboard') } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const demo = [['Management', 'admin@studentsacademy.in', 'admin123'], ['Faculty', 'sai@studentsacademy.in', 'faculty123'], ['Student', 'aarav@student.sa', 'student123'], ['Parent', 'aarav.parent@sa.in', 'parent123']]
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-[#0f172a] text-white p-12 relative overflow-hidden">
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <Link to="/" className="flex items-center gap-2.5 relative">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center"><GraduationCap size={20} /></div>
          <span className="font-semibold">Students Academy · Grant Road</span>
        </Link>
        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight text-white">One portal for learning,<br />tests and the office.</h1>
          <p className="text-slate-400 mt-4 max-w-md">Study material, online tests, attendance, assignments, fees and parent updates — for management, faculty, students and parents.</p>
          <div className="grid grid-cols-2 gap-3 mt-10 max-w-md">
            {[['Management', 'Admissions, fees, staff, reports'], ['Faculty', 'Attendance, tests, content'], ['Students', 'Notes, tests, results'], ['Parents', 'Progress, fees, notices']].map(([t, d]) => (
              <div key={t} className="rounded-xl bg-white/5 border border-white/10 p-4"><ShieldCheck size={16} className="text-indigo-400" /><div className="font-medium text-sm mt-2">{t}</div><div className="text-xs text-slate-400">{d}</div></div>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-500 relative">© {new Date().getFullYear()} Students Academy</div>
      </div>
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8"><div className="h-10 w-10 rounded-lg bg-indigo-600 grid place-items-center text-white"><GraduationCap size={20} /></div><span className="font-semibold">Students Academy</span></div>
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1">Use your email{MODE === 'demo' ? ', mobile number or roll no.' : ''} and password.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block"><span className="label">Email {MODE === 'demo' && '/ Mobile / Roll No.'}</span><input className="input py-2.5" value={id} onChange={(e) => setId(e.target.value)} required autoComplete="username" /></label>
            <label className="block"><span className="label">Password</span><input type="password" className="input py-2.5" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" /></label>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <button disabled={busy} className="btn-primary w-full py-2.5">{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          {MODE === 'demo' && (
            <div className="mt-8">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Demo logins</div>
              <div className="grid grid-cols-2 gap-2">
                {demo.map(([r, e, p]) => <button key={r} onClick={() => { setId(e); setPw(p) }} className="btn-outline btn-sm justify-start">{r}</button>)}
              </div>
            </div>
          )}
          {!isAndroidApp() && <a href={APK_URL} className="mt-8 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-300">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center"><Smartphone size={20} /></div>
            <div className="text-sm"><div className="font-semibold">Download the Android app</div><div className="text-xs text-slate-500">Free SMS & WhatsApp alerts from the academy phone</div></div>
          </a>}
          <Link to="/" className="block text-center text-sm text-slate-500 mt-6 hover:text-slate-800">← Back to website</Link>
        </div>
      </div>
    </div>
  )
}

// Resolve the "subject" student for student/parent views.
let selectedChild = null
const childSubs = new Set()
const setChildId = (id) => { selectedChild = id; childSubs.forEach((f) => f()) }
const useChildId = () => useSyncExternalStore((f) => { childSubs.add(f); return () => childSubs.delete(f) }, () => selectedChild)

export function useMyStudent() {
  const { user } = useAuth()
  const [users] = useTable('users')
  const childId = useChildId()
  if (!user) return { student: null }
  if (user.role === 'student') return { student: users.find((u) => u.id === user.id) || user, children: [] }
  if (user.role === 'parent') {
    const children = users.filter((u) => (user.childIds || []).includes(u.id))
    return { student: children.find((c) => c.id === childId) || children[0] || null, children, setChildId }
  }
  return { student: null, children: [] }
}

export function ChildSwitcher() {
  const { children, student, setChildId } = useMyStudent()
  if (!children || children.length < 2) return null
  return <select className="input w-auto" value={student?.id} onChange={(e) => setChildId(e.target.value)}>{children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
}
