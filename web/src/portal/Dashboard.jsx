// Dashboards — laid out like the MITK Campus ERP "Control Center" (AI Prep design system).
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  GraduationCap, Wallet, CalendarCheck, PhoneCall, ClipboardList, Library, NotebookPen, Bell, TrendingUp, Clock, Users, Layers,
  AlertCircle, LayoutDashboard, ArrowUpRight, Fingerprint, MonitorSmartphone, Megaphone, MessageSquare, UserPlus, Upload, BarChart3, Pin, Trophy, BookOpen, FileText,
} from 'lucide-react'
import { useTable } from '../lib/db'
import { useAuth, can } from '../lib/auth'
import { PageHeader, Stat, Card, Badge, Progress, Empty, Avatar, SectionLabel, CountUp } from '../components/ui'
import { inr, fmtDate, feeSummary, attendanceSummary, today, cls } from '../lib/utils'
import { useMyStudent, ChildSwitcher } from './Layout'

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
const Shell = ({ children }) => (
  <div className="dash-shell min-w-0 mx-auto max-w-7xl space-y-8 rounded-3xl bg-gradient-to-br from-white/80 via-white/70 to-blue-50/60 p-4 sm:p-6 md:p-7 shadow-sm ring-1 ring-white/80 backdrop-blur-xl">{children}</div>
)

export default function Dashboard() {
  const { user } = useAuth()
  if (['admin', 'staff'].includes(user.role)) return <AdminDash />
  if (user.role === 'faculty') return <FacultyDash />
  return <StudentDash />
}

function Bars({ data, suffix = '' }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-3 h-48 pt-2">
      {data.map((d, i) => (
        <div key={d.label + i} className="flex-1 h-full flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex-1 w-full flex flex-col justify-end items-center gap-1">
            <div className="text-[10px] font-bold text-slate-600">{d.display ?? d.value + suffix}</div>
            <motion.div className="w-full max-w-[44px] rounded-t-xl bg-gradient-to-t from-blue-600 via-sky-500 to-cyan-400 shadow-[0_8px_20px_rgba(225,29,46,0.25)]"
              initial={{ height: 0 }} animate={{ height: `${Math.max(3, (d.value / max) * 85)}%` }} transition={{ duration: 0.8, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }} />
          </div>
          <div className="text-[10px] font-semibold text-slate-500 truncate w-full text-center">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

function QuickActions({ items }) {
  return (
    <div>
      <SectionLabel>Quick actions</SectionLabel>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a, i) => (
          <motion.div key={a.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ y: -4 }}>
            <Link to={a.url} onClick={(e) => { if (a.url === '#view-as') { e.preventDefault(); window.dispatchEvent(new Event('sa-view-as')) } }} className="group flex items-center gap-4 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-clay backdrop-blur-xl transition-shadow hover:shadow-[0_14px_36px_rgba(220,38,38,0.14)]">
              <span className={cls('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', a.grad)}><a.icon className="h-6 w-6" /></span>
              <span className="min-w-0 flex-1"><span className="block font-bold text-slate-800">{a.title}</span><span className="block truncate text-xs font-medium text-slate-500">{a.desc}</span></span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function NoticeList({ notices }) {
  if (!notices.length) return <Empty title="No notices" />
  return (
    <ul className="space-y-2">
      {notices.map((n, i) => (
        <motion.li key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-blue-50/60 p-3">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800">{n.pinned && <Pin size={13} className="text-amber-500" />}{n.title}</p>
          <p className="text-xs font-medium text-slate-500">{fmtDate(n.createdAt)}</p>
        </motion.li>
      ))}
    </ul>
  )
}

// ====================== MANAGEMENT ======================
function AdminDash() {
  const { user } = useAuth()
  const [users] = useTable('users'); const [fees] = useTable('fees'); const [att] = useTable('attendance'); const [notices] = useTable('notices')
  const [enq] = useTable('enquiries'); const [batches] = useTable('batches'); const [tests] = useTable('tests'); const [attempts] = useTable('attempts')
  const students = users.filter((u) => u.role === 'student' && u.status !== 'inactive')
  const fs = students.map((s) => ({ s, ...feeSummary(s, fees) }))
  const total = fs.reduce((a, b) => a + b.total, 0), collected = fs.reduce((a, b) => a + b.paid, 0), pending = fs.reduce((a, b) => a + b.balance, 0)
  const collectedPct = total ? Math.round((collected / total) * 100) : 0
  const lastDate = [...att].sort((a, b) => b.date.localeCompare(a.date))[0]?.date
  const vals = att.filter((a) => a.date === lastDate).flatMap((a) => Object.values(a.records || {}))
  const attPct = vals.length ? Math.round((vals.filter((v) => v !== 'A').length / vals.length) * 100) : 0
  const openEnq = enq.filter((e) => ['new', 'contacted', 'follow-up'].includes(e.status))
  const months = [...Array(6)].map((_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return d })
  const feeTrend = months.map((m) => {
    const key = m.toISOString().slice(0, 7); const v = fees.filter((f) => (f.date || '').startsWith(key)).reduce((s, f) => s + Number(f.amount), 0)
    return { label: m.toLocaleString('en', { month: 'short' }), value: v, display: v ? Math.round(v / 1000) + 'k' : '0' }
  })
  const thisMonth = feeTrend[5]?.value || 0
  const actions = [
    { title: 'New admission', desc: 'Admit a student & create parent login', url: '/portal/students?new=1', icon: UserPlus, grad: 'from-blue-600 to-cyan-400', cap: 'students' },
    { title: 'Collect fee', desc: 'Record payment & print receipt', url: '/portal/fees', icon: Wallet, grad: 'from-emerald-600 to-teal-400', cap: 'fees' },
    { title: 'Follow up enquiries', desc: `${openEnq.length} open leads`, url: '/portal/enquiries', icon: PhoneCall, grad: 'from-violet-600 to-purple-400', cap: 'enquiries' },
    { title: 'Mark attendance', desc: 'Daily, register & staff attendance', url: '/portal/attendance', icon: CalendarCheck, grad: 'from-sky-600 to-blue-400', cap: 'attendance' },
    { title: 'Marks & exams', desc: 'Enter marks, ranks & report cards', url: '/portal/marks', icon: Trophy, grad: 'from-indigo-600 to-violet-400', cap: 'marks' },
    { title: 'Biometric devices', desc: 'Live punches & device status', url: '/portal/biometric', icon: Fingerprint, grad: 'from-slate-700 to-cyan-500', cap: 'biometric' },
    { title: 'Send SMS / WhatsApp', desc: 'Free from the academy SIM', url: '/portal/messaging', icon: MessageSquare, grad: 'from-rose-600 to-orange-400', cap: 'messaging' },
    { title: 'Post a notice', desc: 'Portal + website notice board', url: '/portal/notices', icon: Megaphone, grad: 'from-amber-600 to-orange-400', cap: 'notices' },
    { title: 'Preview dashboards', desc: 'View as any student, parent or staff', url: '#view-as', icon: MonitorSmartphone, grad: 'from-fuchsia-600 to-pink-400', cap: 'admin-only' },
  ].filter((a) => a.cap === 'admin-only' ? user.role === 'admin' : can(user, a.cap))
  return (
    <Shell>
      <PageHeader icon={LayoutDashboard} eyebrow={`${greet()}, ${user.name.split(' ')[0]}`} title={user.role === 'staff' ? 'Office Control Center' : 'Academy Control Center'}
        subtitle={`Students Academy, Grant Road · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        actions={<>{can(user, 'students') && <Link to="/portal/students?new=1" className="btn-primary"><UserPlus size={16} />New Admission</Link>}{can(user, 'fees') && <Link to="/portal/fees" className="btn-outline">Collect Fee</Link>}</>} />
      <div>
        <SectionLabel>Academy overview</SectionLabel>
        <div className="mt-3 -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto nice-scroll px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&>*]:w-[240px] [&>*]:shrink-0 [&>*]:snap-center sm:[&>*]:w-auto">
          <Stat index={0} tone="indigo" icon={GraduationCap} label="Active students" value={students.length} progress={100} hint={`${batches.length} batches running`} to="/portal/students" />
          <Stat index={1} tone="emerald" icon={Wallet} label="Fees collected" value={inr(collected)} progress={collectedPct} hint={`${collectedPct}% of ${inr(total)}`} to="/portal/fees" />
          <Stat index={2} tone="sky" icon={CalendarCheck} label="Attendance" value={attPct + '%'} progress={attPct} hint={lastDate ? `Last class day · ${fmtDate(lastDate)}` : 'No records yet'} to="/portal/attendance" />
          <Stat index={3} tone="violet" icon={PhoneCall} label="Open enquiries" value={openEnq.length} progress={enq.length ? Math.round((enq.filter((e) => e.status === 'admitted').length / enq.length) * 100) : 0} hint={`${enq.filter((e) => e.status === 'new').length} new · ${enq.filter((e) => e.status === 'admitted').length} admitted`} to="/portal/enquiries" />
        </div>
      </div>
      <QuickActions items={actions} />
      <div>
        <SectionLabel>Activity & insights</SectionLabel>
        <div className="mt-3 grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
          <div className="space-y-6 lg:col-span-2">
            <Card gradient icon={Wallet} title="Fee collection" actions={<Link to="/portal/fees" className="text-xs font-bold">Collect fee</Link>}>
              <div className="grid sm:grid-cols-3 gap-3 mb-5">
                {[['Collected', inr(collected), 'text-emerald-600'], ['Outstanding', inr(pending), 'text-rose-600'], ['This month', inr(thisMonth), 'text-blue-600']].map(([l, v, c]) => (
                  <div key={l} className="rounded-xl bg-slate-50/80 p-3"><div className="text-[11px] font-bold uppercase text-slate-400">{l}</div><div className={cls('font-heading text-xl font-extrabold', c)}><CountUp value={v} /></div></div>
                ))}
              </div>
              <Progress value={collectedPct} tone="bg-gradient-to-r from-emerald-500 to-teal-400" />
              <div className="mt-2 text-xs font-semibold text-slate-500">{collectedPct}% of total fees collected</div>
              <div className="mt-5"><Bars data={feeTrend} /></div>
            </Card>
            <Card gradient icon={AlertCircle} title="Top fee defaulters" actions={<Link to="/portal/messaging?audience=fee" className="text-xs font-bold">Send reminders</Link>} bodyClass="p-0">
              {fs.filter((x) => x.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 6).map((x) => (
                <div key={x.s.id} className="flex items-center gap-3 px-5 py-3 border-t first:border-0 border-slate-100">
                  <Avatar name={x.s.name} size="h-9 w-9" /><div className="flex-1 min-w-0"><div className="text-sm font-bold truncate">{x.s.name}</div><div className="text-xs text-slate-500">{x.s.rollNo} · {batches.find((b) => b.id === x.s.batchId)?.name}</div></div>
                  <div className="w-28 hidden sm:block"><Progress value={(x.paid / Math.max(1, x.total)) * 100} tone="bg-gradient-to-r from-amber-400 to-rose-500" /></div>
                  <span className="text-sm font-extrabold text-rose-600 w-20 text-right">{inr(x.balance)}</span>
                </div>
              ))}
              {!fs.some((x) => x.balance > 0) && <Empty title="No dues 🎉" />}
            </Card>
          </div>
          <div className="space-y-6">
            <Card gradient icon={Megaphone} title="Notice board" actions={<Link to="/portal/notices" className="text-xs font-bold">All</Link>} bodyClass="p-3"><NoticeList notices={notices.slice(0, 4)} /></Card>
            <Card gradient icon={Layers} title="Batch strength">
              <div className="space-y-3.5">
                {batches.map((b) => { const n = students.filter((s) => s.batchId === b.id).length; return (
                  <div key={b.id}><div className="flex justify-between text-sm mb-1"><span className="truncate font-semibold">{b.name}</span><span className="font-extrabold text-blue-700">{n}</span></div><Progress value={(n / Math.max(1, students.length)) * 100} /></div>
                ) })}
              </div>
            </Card>
            <Card gradient icon={Trophy} title="Test performance" bodyClass="p-0">
              {tests.filter((t) => t.status === 'published').slice(0, 4).map((t) => {
                const at = attempts.filter((a) => a.testId === t.id); const avg = at.length ? Math.round(at.reduce((s, a) => s + a.percent, 0) / at.length) : 0
                return <Link to={`/portal/results?test=${t.id}`} key={t.id} className="block px-5 py-3 border-t first:border-0 border-slate-100 hover:bg-blue-50/40"><div className="flex justify-between text-sm"><span className="truncate pr-2 font-semibold">{t.title}</span><span className="font-extrabold">{avg}%</span></div><div className="text-xs text-slate-500 mb-1.5">{at.length} attempts</div><Progress value={avg} tone={avg >= 60 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-400 to-orange-500'} /></Link>
              })}
              {!tests.some((t) => t.status === 'published') && <Empty title="No published tests" />}
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  )
}

// ====================== FACULTY ======================
function FacultyDash() {
  const { user } = useAuth()
  const [batches] = useTable('batches'); const [users] = useTable('users'); const [tt] = useTable('timetable'); const [notices] = useTable('notices')
  const [att] = useTable('attendance'); const [tests] = useTable('tests'); const [subs] = useTable('submissions'); const [asg] = useTable('assignments'); const [attempts] = useTable('attempts')
  const mine = batches.filter((b) => (b.facultyIds || []).includes(user.id))
  const myIds = mine.map((b) => b.id)
  const students = users.filter((u) => u.role === 'student' && myIds.includes(u.batchId))
  const day = new Date().toLocaleString('en', { weekday: 'short' })
  const todays = tt.filter((t) => t.facultyId === user.id && t.day === day).sort((a, b) => a.start.localeCompare(b.start))
  const pendingAtt = mine.filter((b) => !att.some((a) => a.batchId === b.id && a.date === today()))
  const toGrade = subs.filter((s) => s.grade == null && asg.some((a) => a.id === s.assignmentId && myIds.includes(a.batchId)))
  const myTests = tests.filter((t) => t.createdBy === user.id)
  const myAttempts = attempts.filter((a) => myTests.some((t) => t.id === a.testId))
  const avg = myAttempts.length ? Math.round(myAttempts.reduce((s, a) => s + a.percent, 0) / myAttempts.length) : 0
  const actions = [
    { title: 'Mark attendance', desc: pendingAtt.length ? `${pendingAtt.length} batch(es) pending today` : 'All marked today', url: '/portal/attendance', icon: CalendarCheck, grad: 'from-blue-600 to-cyan-400' },
    { title: 'Create a test', desc: 'MCQ builder with bulk paste', url: '/portal/tests?new=1', icon: ClipboardList, grad: 'from-violet-600 to-purple-400' },
    { title: 'Upload material', desc: 'Notes, PDFs, videos for batches', url: '/portal/materials?new=1', icon: Upload, grad: 'from-emerald-600 to-teal-400' },
    { title: 'Grade assignments', desc: `${toGrade.length} submission(s) waiting`, url: '/portal/assignments', icon: NotebookPen, grad: 'from-amber-600 to-orange-400' },
    { title: 'Results & analytics', desc: 'Leaderboards & question accuracy', url: '/portal/results', icon: BarChart3, grad: 'from-sky-600 to-blue-400' },
    { title: 'Message parents', desc: 'Free SMS / WhatsApp', url: '/portal/messaging', icon: MessageSquare, grad: 'from-rose-600 to-orange-400' },
  ]
  return (
    <Shell>
      <PageHeader icon={LayoutDashboard} eyebrow={`${greet()}, ${user.name}`} title="Faculty Control Center" subtitle={`${user.designation || 'Faculty'} · ${mine.length} batches`} />
      <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto nice-scroll px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&>*]:w-[240px] [&>*]:shrink-0 [&>*]:snap-center sm:[&>*]:w-auto">
        <Stat index={0} tone="indigo" icon={Layers} label="My batches" value={mine.length} progress={100} hint={mine.map((b) => b.standard).filter((v, i, a) => a.indexOf(v) === i).join(' · ')} to="/portal/batches" />
        <Stat index={1} tone="sky" icon={Users} label="My students" value={students.length} progress={100} hint="Across all batches" to="/portal/students" />
        <Stat index={2} tone="emerald" icon={TrendingUp} label="Avg test score" value={avg + '%'} progress={avg} hint={`${myTests.length} tests · ${myAttempts.length} attempts`} to="/portal/results" />
        <Stat index={3} tone="amber" icon={NotebookPen} label="To grade" value={toGrade.length} progress={toGrade.length ? 30 : 100} hint="Assignment submissions" to="/portal/assignments" />
      </div>
      <QuickActions items={actions} />
      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card gradient icon={Clock} title={`Today's lectures · ${day}`} className="lg:col-span-2">
          {todays.length ? <ol className="relative border-l-2 border-blue-100 ml-2 space-y-4">
            {todays.map((t, i) => (
              <motion.li key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="pl-5 relative">
                <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 ring-4 ring-white" />
                <div className="text-xs font-extrabold text-blue-700">{t.start} – {t.end}</div>
                <div className="font-bold text-slate-800">{t.subject}</div>
                <div className="text-xs font-medium text-slate-500">{batches.find((b) => b.id === t.batchId)?.name}</div>
              </motion.li>
            ))}
          </ol> : <Empty title="No lectures today" icon={Clock} />}
          {pendingAtt.map((b) => <Link key={b.id} to={`/portal/attendance?batch=${b.id}`} className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm font-semibold text-amber-800"><AlertCircle size={16} />Mark today's attendance: {b.name}</Link>)}
        </Card>
        <Card gradient icon={Megaphone} title="Notice board" bodyClass="p-3"><NoticeList notices={notices.filter((n) => n.audience !== 'parents').slice(0, 4)} /></Card>
      </div>
    </Shell>
  )
}

// ====================== STUDENT / PARENT ======================
function StudentDash() {
  const { user } = useAuth()
  const { student } = useMyStudent()
  const [batches] = useTable('batches'); const [att] = useTable('attendance'); const [fees] = useTable('fees'); const [tests] = useTable('tests')
  const [attempts] = useTable('attempts'); const [notices] = useTable('notices'); const [asg] = useTable('assignments'); const [subs] = useTable('submissions'); const [materials] = useTable('materials')
  if (!student) return <Empty title="No student linked" hint="Contact the office to link your child's profile." />
  const isParent = user.role === 'parent'
  const batch = batches.find((b) => b.id === student.batchId)
  const a = attendanceSummary(student.id, att.filter((r) => r.batchId === student.batchId))
  const f = feeSummary(student, fees)
  const my = attempts.filter((x) => x.studentId === student.id).sort((x, y) => (x.submittedAt || '').localeCompare(y.submittedAt || ''))
  const avg = my.length ? Math.round(my.reduce((s, x) => s + x.percent, 0) / my.length) : 0
  const pendingTests = tests.filter((t) => t.status === 'published' && (t.batchIds || []).includes(student.batchId) && !my.some((x) => x.testId === t.id))
  const pendingAsg = asg.filter((x) => x.batchId === student.batchId && !subs.some((s) => s.assignmentId === x.id && s.studentId === student.id))
  const myNotices = notices.filter((n) => n.audience === 'all' || n.audience === (isParent ? 'parents' : 'students') || n.batchId === student.batchId).slice(0, 4)
  const newMaterials = materials.filter((m) => m.standard === student.standard || (m.batchIds || []).includes(student.batchId)).slice(0, 6)
  const actions = isParent ? [
    { title: 'Attendance', desc: `${a.pct}% overall`, url: '/portal/attendance', icon: CalendarCheck, grad: 'from-blue-600 to-cyan-400' },
    { title: 'Test results', desc: `${my.length} tests · avg ${avg}%`, url: '/portal/results', icon: BarChart3, grad: 'from-violet-600 to-purple-400' },
    { title: 'Fees', desc: f.balance ? `${inr(f.balance)} pending` : 'All paid', url: '/portal/fees', icon: Wallet, grad: 'from-emerald-600 to-teal-400' },
  ] : [
    { title: 'Study material', desc: 'Notes, PYQs & formula sheets', url: '/portal/materials', icon: BookOpen, grad: 'from-blue-600 to-cyan-400' },
    { title: 'Online tests', desc: `${pendingTests.length} waiting for you`, url: '/portal/tests', icon: ClipboardList, grad: 'from-violet-600 to-purple-400' },
    { title: 'Assignments', desc: `${pendingAsg.length} pending`, url: '/portal/assignments', icon: NotebookPen, grad: 'from-amber-600 to-orange-400' },
  ]
  return (
    <Shell>
      <PageHeader icon={LayoutDashboard} eyebrow={greet()} title={isParent ? `${student.name}'s progress` : `Hi ${student.name.split(' ')[0]} 👋`} subtitle={`${batch?.name || student.standard} · Roll no. ${student.rollNo || '—'}`} actions={<ChildSwitcher />} />
      <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto nice-scroll px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&>*]:w-[240px] [&>*]:shrink-0 [&>*]:snap-center sm:[&>*]:w-auto">
        <Stat index={0} tone={a.pct >= 75 ? 'emerald' : 'rose'} icon={CalendarCheck} label="Attendance" value={a.pct + '%'} progress={a.pct} hint={`${a.p} present · ${a.a} absent`} to="/portal/attendance" />
        <Stat index={1} tone="indigo" icon={TrendingUp} label="Average score" value={avg + '%'} progress={avg} hint={`${my.length} tests taken`} to="/portal/results" />
        <Stat index={2} tone="violet" icon={ClipboardList} label="Pending tests" value={pendingTests.length} progress={pendingTests.length ? 20 : 100} hint={pendingTests[0]?.title || 'Nothing pending'} to="/portal/tests" />
        <Stat index={3} tone={f.balance ? 'amber' : 'emerald'} icon={Wallet} label="Fee balance" value={inr(f.balance)} progress={f.total ? (f.paid / f.total) * 100 : 100} hint={`${inr(f.paid)} paid of ${inr(f.total)}`} to="/portal/fees" />
      </div>
      <QuickActions items={actions} />
      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <Card gradient icon={ClipboardList} title="Upcoming work">
            {pendingTests.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3 border-b last:border-0 border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white grid place-items-center shadow"><ClipboardList size={17} /></div>
                <div className="flex-1"><div className="text-sm font-bold">{t.title}</div><div className="text-xs font-medium text-slate-500">{t.subject} · {t.questions.length} Qs · {t.durationMin} min</div></div>
                {!isParent ? <Link to={`/portal/tests/${t.id}/take`} className="btn-primary btn-sm">Start</Link> : <Badge tone="amber">Not attempted</Badge>}
              </div>
            ))}
            {pendingAsg.map((x) => (
              <div key={x.id} className="flex items-center gap-3 py-3 border-b last:border-0 border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white grid place-items-center shadow"><NotebookPen size={17} /></div>
                <div className="flex-1"><div className="text-sm font-bold">{x.title}</div><div className="text-xs font-medium text-slate-500">Due {fmtDate(x.dueDate)}</div></div>
                <Link to="/portal/assignments" className="btn-outline btn-sm">Open</Link>
              </div>
            ))}
            {!pendingTests.length && !pendingAsg.length && <Empty title="Nothing pending, great work!" />}
          </Card>
          {my.length > 0 && <Card gradient icon={BarChart3} title="Score trend"><Bars data={my.slice(-8).map((x) => ({ label: (tests.find((t) => t.id === x.testId)?.title || '').split('—')[0].slice(0, 12), value: x.percent, display: x.percent + '%' }))} /></Card>}
        </div>
        <div className="space-y-6">
          <Card gradient icon={Bell} title="Notices" bodyClass="p-3"><NoticeList notices={myNotices} /></Card>
          {!isParent && <Card gradient icon={Library} title="Study material for you" actions={<Link to="/portal/materials" className="text-xs font-bold">Library</Link>} bodyClass="p-3">
            <div className="space-y-2">
              {newMaterials.map((m) => <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-blue-50/70 transition"><div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 grid place-items-center shrink-0"><FileText size={16} /></div><div className="min-w-0"><div className="text-sm font-bold truncate">{m.title}</div><div className="text-xs text-slate-500">{m.subject}</div></div></a>)}
            </div>
          </Card>}
        </div>
      </div>
    </Shell>
  )
}
