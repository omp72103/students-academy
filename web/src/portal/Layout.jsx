import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { NavLink, Outlet, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, UserRound, GraduationCap, Layers, CalendarDays, CalendarCheck, Library, ClipboardList, BarChart3,
  NotebookPen, Wallet, Megaphone, MessageSquare, Globe, Settings, LogOut, X, PhoneCall, UserCog, Bell, ShieldCheck, Smartphone,
  ChevronLeft, Search, Home, PanelLeft, User, Sparkles, Eye, EyeOff, ArrowRight, Moon, Sun, Command,
} from 'lucide-react'
import { useAuth, ROLES, googleEnabled } from '../lib/auth'
import { supabase } from '../lib/db'
import { MODE, useTable } from '../lib/db'
import { Avatar } from '../components/ui'
import SendQueue from '../components/SendQueue'
import { cls, fmtDate } from '../lib/utils'
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
// Mobile bottom tab bar — the 4 most used pages per role
const TABS = { admin: ['dashboard', 'students', 'fees', 'messaging'], faculty: ['dashboard', 'attendance', 'tests', 'materials'], student: ['dashboard', 'materials', 'tests', 'results'], parent: ['dashboard', 'attendance', 'results', 'fees'] }

// Light / dark theme (MITK ERP "navy glass" dark mode), remembered per device
const THEME_KEY = 'sa_theme'
const themeSubs = new Set()
export function useTheme() {
  const theme = useSyncExternalStore((f) => { themeSubs.add(f); return () => themeSubs.delete(f) }, () => localStorage.getItem(THEME_KEY) || 'light')
  const toggle = () => { localStorage.setItem(THEME_KEY, theme === 'dark' ? 'light' : 'dark'); themeSubs.forEach((f) => f()) }
  return [theme, toggle]
}

// Same background + ambient blobs as APT-Tech AI Prep / MITK ERP
const APP_BG = 'app-bg bg-gradient-to-br from-slate-50 via-blue-50/70 to-cyan-50/60 transition-colors duration-300'
export function AmbientBlobs() {
  return (
    <div className="ambient fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="absolute -top-40 right-0 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-blue-200/30 to-cyan-200/25 blur-3xl animate-aurora" />
      <div className="absolute bottom-0 -left-32 w-[440px] h-[440px] rounded-full bg-gradient-to-br from-violet-200/25 to-blue-200/20 blur-3xl animate-aurora [animation-delay:-5s]" />
      <div className="absolute top-1/2 -right-20 w-[380px] h-[380px] rounded-full bg-gradient-to-br from-amber-200/15 to-orange-200/10 blur-3xl animate-aurora [animation-delay:-9s]" />
    </div>
  )
}

function BrandMark({ size = 'h-10 w-10' }) {
  return <div className={cls(size, 'rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 grid place-items-center shadow-md shadow-blue-500/30 shrink-0')}><GraduationCap size={20} className="text-white" /></div>
}

function useOutside(ref, cb) {
  useEffect(() => { const h = (e) => ref.current && !ref.current.contains(e.target) && cb(); document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [ref, cb])
}

function Sidebar({ groups, user, collapsed, setCollapsed, mobile, onClose, onLogout }) {
  return (
    <aside className={cls('relative flex h-full flex-col rounded-[30px] border border-white/80 bg-white/70 backdrop-blur-2xl shadow-glass transition-[width] duration-300 ease-in-out',
      collapsed && !mobile ? 'w-[78px]' : 'w-[272px]')}>
      <div className={cls('pointer-events-none absolute top-0 z-30 h-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-violet-500 shadow-[0_0_18px_rgba(34,211,238,0.95),0_0_32px_rgba(59,130,246,0.55)]', collapsed && !mobile ? 'inset-x-3' : 'inset-x-8')} />
      <div className={cls('border-b border-slate-200/60 pt-6 pb-4', collapsed && !mobile ? 'px-2' : 'px-5')}>
        <div className={cls('flex items-center gap-3', collapsed && !mobile && 'flex-col')}>
          <BrandMark />
          {(!collapsed || mobile) && <div className="flex-1 min-w-0">
            <h2 className="font-heading text-lg font-extrabold tracking-tight text-gradient leading-tight">Students Academy</h2>
            <p className="text-[11px] font-bold tracking-wide text-blue-600">Grant Road · LMS & ERP</p>
          </div>}
          {mobile
            ? <button onClick={onClose} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full border border-white/80 bg-white/70 text-slate-500 shadow-sm"><X size={20} /></button>
            : <button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" className="grid h-7 w-7 place-items-center rounded-full border border-white/80 bg-white/70 text-slate-500 shadow-sm hover:bg-white hover:text-blue-600">
                <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}><ChevronLeft size={14} /></motion.span>
              </button>}
        </div>
        {(!collapsed || mobile) && <p className="mt-5 font-heading text-sm font-extrabold tracking-wide text-gradient">{(ROLES[user.role]?.label || 'Portal').toUpperCase()} PORTAL</p>}
      </div>
      <nav className={cls('flex-1 overflow-y-auto nice-scroll py-3 space-y-3', collapsed && !mobile ? 'px-2' : 'px-3')}>
        {groups.map(([g, items]) => (
          <div key={g}>
            {(!collapsed || mobile) && <div className="px-2 h-7 flex items-center font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{g}</div>}
            <div className="space-y-1">
              {items.map(([to, label, Icon]) => (
                <NavLink key={to} to={`/portal/${to}`} onClick={mobile ? onClose : undefined} title={collapsed && !mobile ? label : undefined}
                  className={({ isActive }) => cls('group relative flex h-10 items-center gap-3 rounded-xl border px-3 text-[14px] font-bold transition-all',
                    collapsed && !mobile && 'justify-center px-0',
                    isActive ? 'border-transparent text-white'
                      : 'border-transparent text-slate-700 hover:border-white/80 hover:bg-white/65 hover:text-slate-900 hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]')}>
                  {({ isActive }) => <>
                    {isActive && <motion.span layoutId={mobile ? 'nav-pill-m' : 'nav-pill'} className="absolute inset-0 rounded-xl border border-white/70 bg-gradient-to-r from-blue-600/95 to-cyan-400/90 shadow-[0_8px_24px_rgba(6,182,212,0.38),inset_0_1px_0_rgba(255,255,255,0.5)]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    <Icon size={18} className="relative shrink-0" />
                    {(!collapsed || mobile) && <span className="relative truncate">{label}</span>}
                    {isActive && collapsed && !mobile && <span className="absolute z-10 -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse" />}
                  </>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className={cls('space-y-2 border-t border-slate-200/60 bg-white/35 rounded-b-[30px]', collapsed && !mobile ? 'p-2' : 'p-4')}>
        <Link to="/" className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/90 bg-white/65 text-sm font-bold text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:bg-white"><Home size={16} />{(!collapsed || mobile) && 'Website'}</Link>
        <button onClick={onLogout} className="flex w-full h-10 items-center justify-center gap-2 rounded-xl border border-white/90 bg-white/65 text-sm font-bold text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:bg-white hover:text-rose-600"><LogOut size={16} />{(!collapsed || mobile) && 'Logout'}</button>
      </div>
    </aside>
  )
}

function Popover({ button, children, width = 'w-72' }) {
  const [open, setOpen] = useState(false); const ref = useRef()
  useOutside(ref, () => setOpen(false))
  return (
    <div className="relative" ref={ref}>
      {button(open, () => setOpen(!open))}
      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.16 }}
          className={cls('absolute right-0 mt-2 z-50 rounded-2xl border border-white bg-white/95 backdrop-blur-2xl p-3 shadow-[0_20px_50px_rgba(15,23,42,0.18)]', width)} onClick={() => setOpen(false)}>
          {children}
        </motion.div>}
      </AnimatePresence>
    </div>
  )
}

function Topbar({ groups, user, onMenu, onLogout, collapsed }) {
  const nav = useNavigate(); const loc = useLocation()
  const [notices] = useTable('notices')
  const [q, setQ] = useState(''); const [focus, setFocus] = useState(false)
  const [theme, toggleTheme] = useTheme()
  const searchRef = useRef()
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus() } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])
  const items = groups.flatMap(([, it]) => it)
  const current = items.find(([to]) => loc.pathname.startsWith('/portal/' + to))
  const matches = q ? items.filter(([, l]) => l.toLowerCase().includes(q.toLowerCase())) : items
  const aud = { parent: 'parents', student: 'students', faculty: 'faculty' }[user.role]
  const mine = notices.filter((n) => user.role === 'admin' || n.audience === 'all' || n.audience === aud).slice(0, 6)
  const iconBtn = 'grid h-10 w-10 sm:h-9 sm:w-9 place-items-center rounded-full text-slate-700 hover:bg-slate-200/70 active:scale-95 transition-all'
  return (
    <header className="sticky top-2 sm:top-3 z-30 mx-2 mt-2 sm:mx-3 sm:mt-3 lg:mx-6 rounded-[20px] sm:rounded-[24px] border border-white/80 bg-white/65 px-3 py-2.5 sm:px-4 lg:px-5 shadow-topbar backdrop-blur-2xl">
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={onMenu} className="lg:hidden h-10 w-10 shrink-0 grid place-items-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-700 shadow-sm" aria-label="Menu"><PanelLeft size={18} /></button>
        <h1 className="min-w-0 flex-1 truncate font-heading font-extrabold text-sm sm:text-base">
          <span className="hidden sm:inline text-gradient">Students Academy</span>
          <span className="font-body font-semibold text-slate-600"><span className="hidden sm:inline"> — </span>{current?.[1] || 'Portal'}</span>
        </h1>
        <div className="relative hidden md:block flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
            onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) { nav('/portal/' + matches[0][0]); setQ(''); e.currentTarget.blur() } }}
            placeholder="Search pages…" className="h-9 w-full rounded-full bg-slate-200/70 pl-9 pr-14 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 rounded-md border border-slate-300/70 bg-white/70 px-1.5 text-[10px] font-bold text-slate-500"><Command size={10} />K</kbd>
          <AnimatePresence>
            {focus && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto nice-scroll rounded-2xl border border-white bg-white/95 p-2 shadow-xl backdrop-blur-2xl">
              {matches.map(([to, label, Icon]) => <button key={to} onMouseDown={() => { nav('/portal/' + to); setQ('') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50"><Icon size={15} className="text-blue-600" />{label}</button>)}
              {!matches.length && <p className="px-3 py-2 text-sm text-slate-500">No matching page.</p>}
            </motion.div>}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          {isAndroidApp() && <span className="hidden sm:inline-flex badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 gap-1"><Smartphone size={12} />App</span>}
          {MODE === 'demo' && <span className="hidden sm:inline-flex badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">Demo</span>}
          <button onClick={toggleTheme} className={iconBtn} aria-label="Toggle dark mode" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={theme} initial={{ rotate: -90, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}>
                {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
              </motion.span>
            </AnimatePresence>
          </button>
          <Popover button={(open, t) => <button onClick={t} className={cls(iconBtn, 'relative')} aria-label="Notifications"><Bell size={17} />{mine.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}</button>}>
            <p className="text-sm font-bold text-slate-700 mb-2 px-1">Notifications</p>
            {mine.length ? mine.map((n) => <button key={n.id} onClick={() => nav('/portal/notices')} className="w-full text-left rounded-xl px-2 py-2 hover:bg-blue-50"><p className="text-xs font-bold text-slate-700 line-clamp-1">{n.title}</p><p className="text-[11px] text-slate-500">{fmtDate(n.createdAt)}</p></button>)
              : <p className="text-xs text-slate-500 px-1">You're all caught up.</p>}
          </Popover>
          <Popover width="w-60" button={(open, t) => <button onClick={t} className="ml-1 rounded-full ring-2 ring-white shadow active:scale-95" aria-label="Profile"><Avatar name={user.name} size="h-9 w-9" /></button>}>
            <div className="flex items-center gap-2.5 mb-3 px-1"><Avatar name={user.name} /><div className="min-w-0"><p className="text-sm font-bold text-slate-700 truncate">{user.name}</p><p className="text-xs text-slate-500">{ROLES[user.role]?.label}</p></div></div>
            <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Globe size={15} />Official website</Link>
            {!isAndroidApp() && <a href={APK_URL} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Smartphone size={15} />Get the Android app</a>}
            <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut size={15} />Logout</button>
          </Popover>
        </div>
      </div>
    </header>
  )
}

function MobileTabBar({ role }) {
  const all = Object.fromEntries((NAV[role] || []).flatMap(([, it]) => it).map((i) => [i[0], i]))
  return (
    <nav className="lg:hidden fixed bottom-3 inset-x-3 z-30 rounded-[22px] border border-white/80 bg-white/80 backdrop-blur-2xl shadow-topbar px-2 py-1.5 flex justify-around">
      {(TABS[role] || []).map((k) => all[k]).filter(Boolean).map(([to, label, Icon]) => (
        <NavLink key={to} to={`/portal/${to}`} className={({ isActive }) => cls('flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold min-w-[64px]', isActive ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-400 shadow-md' : 'text-slate-500')}>
          <Icon size={18} />{label.replace(/^(My|Online|Test) /, '').split(' ')[0]}
        </NavLink>
      ))}
    </nav>
  )
}

export function PortalShell() {
  const { user, ready, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sa_sidebar') === '1')
  const nav = useNavigate(); const loc = useLocation()
  const [theme] = useTheme()
  useEffect(() => { localStorage.setItem('sa_sidebar', collapsed ? '1' : '0') }, [collapsed])
  if (!ready) return <div className={cls('min-h-screen grid place-items-center', APP_BG)}><div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" /></div>
  if (!user) return <Navigate to="/portal/login" replace />
  const groups = NAV[user.role] || []
  const doLogout = async () => { await logout(); nav('/portal/login') }

  return (
    <div className={cls('portal relative flex min-h-screen w-full text-slate-900', APP_BG, theme === 'dark' && 'dark')}>
      <AmbientBlobs />
      <div className="hidden lg:block sticky top-0 h-screen p-3 shrink-0">
        <Sidebar groups={groups} user={user} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={doLogout} />
      </div>
      <AnimatePresence>
        {open && <motion.div className="lg:hidden fixed inset-0 z-50 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div className="relative h-full p-3" initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
            <Sidebar mobile groups={groups} user={user} onClose={() => setOpen(false)} onLogout={doLogout} />
          </motion.div>
        </motion.div>}
      </AnimatePresence>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar groups={groups} user={user} onMenu={() => setOpen(true)} onLogout={doLogout} collapsed={collapsed} />
        <AnimatePresence mode="wait">
          <motion.main key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
            className="relative flex-1 min-w-0 overflow-x-hidden p-3 pb-28 sm:p-4 lg:p-6 lg:pb-8 max-w-[1440px] w-full">
            <Outlet />
          </motion.main>
        </AnimatePresence>
        <MobileTabBar role={user.role} />
        <SendQueue />
      </div>
    </div>
  )
}

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
)

export function Login() {
  const { user, login, loginWithGoogle, resetPassword, authError, setAuthError } = useAuth()
  const [id, setId] = useState(''); const [pw, setPw] = useState(''); const [show, setShow] = useState(false)
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [google, setGoogle] = useState(false); const [gBusy, setGBusy] = useState(false)
  const [forgot, setForgot] = useState(false); const [sent, setSent] = useState(false)
  const nav = useNavigate()
  useEffect(() => { googleEnabled().then(setGoogle) }, [])
  useEffect(() => { if (authError) setErr(authError) }, [authError])
  if (user) return <Navigate to="/portal/dashboard" replace />
  async function google_() { setErr(''); setGBusy(true); try { await loginWithGoogle() } catch (e) { setErr(e.message); setGBusy(false) } }
  async function sendReset(e) { e.preventDefault(); setErr(''); setBusy(true); try { await resetPassword(id); setSent(true) } catch (e) { setErr(e.message) } finally { setBusy(false) } }
  async function submit(e) {
    e.preventDefault(); setErr(''); setAuthError(''); setBusy(true)
    try { await login(id, pw); nav('/portal/dashboard') } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const demo = [['Management', 'admin@studentsacademy.in', 'admin123'], ['Faculty', 'sai@studentsacademy.in', 'faculty123'], ['Student', 'aarav@student.sa', 'student123'], ['Parent', 'aarav.parent@sa.in', 'parent123']]
  const roles = [['Management', 'Admissions, fees, staff & reports', 'from-blue-600 to-cyan-400'], ['Faculty', 'Attendance, tests & content', 'from-emerald-500 to-teal-400'], ['Students', 'Notes, online tests & results', 'from-violet-500 to-indigo-500'], ['Parents', 'Progress, fees & notices', 'from-amber-500 to-orange-400']]
  return (
    <div className={cls('portal relative min-h-screen grid lg:grid-cols-[1.05fr_1fr]', APP_BG)}>
      <AmbientBlobs />
      <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 relative">
        <Link to="/" className="flex items-center gap-3"><BrandMark /><div><div className="font-heading font-extrabold text-gradient text-lg leading-tight">Students Academy</div><div className="text-xs font-bold text-blue-600">Grant Road · Mumbai</div></div></Link>
        <div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-3 py-1 text-xs font-bold text-blue-700 shadow-sm backdrop-blur"><Sparkles size={13} />Learning & ERP Portal</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="font-heading mt-5 text-5xl font-extrabold leading-[1.08] text-slate-800">
            One portal for<br /><span className="text-gradient">learning, tests</span><br />and the office.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 max-w-md text-slate-500 font-medium">Study material, online tests, attendance, assignments, fees and parent updates, in one place.</motion.p>
          <div className="grid grid-cols-2 gap-3 mt-10 max-w-lg">
            {roles.map(([t, d, g], i) => (
              <motion.div key={t} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.07 }} whileHover={{ y: -4 }} className="card p-4">
                <div className={cls('h-9 w-9 rounded-xl bg-gradient-to-br grid place-items-center text-white shadow-md', g)}><ShieldCheck size={17} /></div>
                <div className="font-heading font-bold text-sm mt-3 text-slate-800">{t}</div><div className="text-xs text-slate-500 font-medium">{d}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-400">© {new Date().getFullYear()} Students Academy, Grant Road</div>
      </div>
      <div className="flex items-center justify-center p-5 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-[30px] border border-white/80 bg-white/75 backdrop-blur-2xl shadow-glass p-7 sm:p-9">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-violet-500 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
          <div className="lg:hidden flex items-center gap-3 mb-6"><BrandMark /><div className="font-heading font-extrabold text-gradient">Students Academy</div></div>
          <h2 className="font-heading text-2xl font-extrabold text-slate-800">{forgot ? 'Reset password' : 'Welcome back 👋'}</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">{forgot ? 'We will email you a link to set a new password.' : `Sign in with Google or your email${MODE === 'demo' ? ', mobile number or roll no.' : ''} and password.`}</p>
          {forgot ? (
            sent ? <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800">Check {id} for the reset link.</div> : (
            <form onSubmit={sendReset} className="mt-6 space-y-4">
              <label className="block"><span className="label">Email</span><input type="email" className="input py-2.5" value={id} onChange={(e) => setId(e.target.value)} required /></label>
              {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
              <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Sending…' : 'Send reset link'}</button>
            </form>)
          ) : <>
          {google && <>
            <button onClick={google_} disabled={gBusy} className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-[15px] font-bold text-slate-700 shadow-sm transition hover:shadow-md hover:border-slate-300 active:scale-[0.99] disabled:opacity-60">
              <GoogleIcon />{gBusy ? 'Opening Google…' : 'Continue with Google'}
            </button>
            <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div>
          </>}
          <form onSubmit={submit} className={cls('space-y-4', !google && 'mt-6')}>
            <label className="block"><span className="label">Email {MODE === 'demo' && '/ Mobile / Roll No.'}</span><input className="input py-2.5" value={id} onChange={(e) => setId(e.target.value)} required autoComplete="username" /></label>
            <label className="block"><span className="label flex justify-between">Password{MODE === 'supabase' && <button type="button" onClick={() => { setForgot(true); setErr('') }} className="font-bold text-blue-600 hover:underline">Forgot?</button>}</span>
              <div className="relative"><input type={show ? 'text' : 'password'} className="input py-2.5 pr-10" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Show password">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
            </label>
            <AnimatePresence>{err && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">{err}</motion.p>}</AnimatePresence>
            <button disabled={busy} className="btn-primary w-full py-3 text-[15px]">{busy ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}</button>
          </form>
          </>}
          {forgot && <button onClick={() => { setForgot(false); setSent(false); setErr('') }} className="mt-4 text-sm font-bold text-blue-600 hover:underline">← Back to sign in</button>}
          {MODE === 'demo' && (
            <div className="mt-7">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Demo logins</div>
              <div className="grid grid-cols-2 gap-2">{demo.map(([r, e, p]) => <button key={r} onClick={() => { setId(e); setPw(p) }} className="btn-outline btn-sm justify-start"><User size={13} />{r}</button>)}</div>
            </div>
          )}
          {!isAndroidApp() && <a href={APK_URL} className="mt-7 flex items-center gap-3 rounded-2xl border border-white bg-gradient-to-r from-emerald-50 to-teal-50 p-3 transition hover:shadow-md">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white grid place-items-center shadow"><Smartphone size={19} /></div>
            <div className="text-sm"><div className="font-bold text-slate-800">Download the Android app</div><div className="text-xs text-slate-500 font-medium">Free SMS & WhatsApp alerts from the academy phone</div></div>
          </a>}
          <Link to="/" className="block text-center text-sm font-semibold text-slate-500 mt-6 hover:text-blue-700">← Back to website</Link>
        </motion.div>
      </div>
    </div>
  )
}

export function ResetPassword() {
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [msg, setMsg] = useState(''); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  async function save(e) {
    e.preventDefault(); setMsg('')
    if (pw.length < 8) return setMsg('Use at least 8 characters.')
    if (pw !== pw2) return setMsg('Passwords do not match.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setMsg(error.message === 'Auth session missing!' ? 'This reset link has expired. Request a new one from the sign-in page.' : error.message)
    setOk(true); setTimeout(() => nav('/portal/dashboard'), 1200)
  }
  return (
    <div className={cls('portal relative min-h-screen grid place-items-center p-5', APP_BG)}>
      <AmbientBlobs />
      <motion.form onSubmit={save} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md rounded-[30px] border border-white/80 bg-white/75 backdrop-blur-2xl shadow-glass p-8 space-y-4">
        <div className="flex items-center gap-3"><BrandMark /><h2 className="font-heading text-xl font-extrabold text-slate-800">Set a new password</h2></div>
        <label className="block"><span className="label">New password</span><input type="password" className="input py-2.5" value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        <label className="block"><span className="label">Confirm password</span><input type="password" className="input py-2.5" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></label>
        {msg && <p className="text-sm font-semibold text-rose-600">{msg}</p>}
        {ok ? <p className="text-sm font-bold text-emerald-700">Password updated. Opening your dashboard…</p> : <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Saving…' : 'Update password'}</button>}
      </motion.form>
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
