import { Link } from 'react-router-dom'
import { GraduationCap, Wallet, CalendarCheck, PhoneCall, ClipboardList, Library, NotebookPen, Bell, TrendingUp, Clock, Users, Layers, AlertCircle } from 'lucide-react'
import { useTable } from '../lib/db'
import { useAuth } from '../lib/auth'
import { PageHeader, Stat, Card, Badge, Progress, Empty, Avatar } from '../components/ui'
import { inr, fmtDate, feeSummary, attendanceSummary, today } from '../lib/utils'
import { useMyStudent, ChildSwitcher } from './Layout'

export default function Dashboard() {
  const { user } = useAuth()
  if (user.role === 'admin') return <AdminDash />
  if (user.role === 'faculty') return <FacultyDash />
  return <StudentDash />
}

function Bars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => (
        <div key={d.label} className="flex-1 h-full flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex-1 w-full flex flex-col justify-end items-center gap-1">
            <div className="text-[10px] font-semibold text-slate-600">{d.display ?? d.value}</div>
            <div className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-500" style={{ height: `${(d.value / max) * 85}%`, minHeight: 4 }} />
          </div>
          <div className="text-[10px] text-slate-500 truncate w-full text-center">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

function AdminDash() {
  const [users] = useTable('users'); const [fees] = useTable('fees'); const [att] = useTable('attendance')
  const [enq] = useTable('enquiries'); const [batches] = useTable('batches'); const [tests] = useTable('tests'); const [attempts] = useTable('attempts')
  const students = users.filter((u) => u.role === 'student' && u.status !== 'inactive')
  const fs = students.map((s) => ({ s, ...feeSummary(s, fees) }))
  const collected = fs.reduce((a, b) => a + b.paid, 0), pending = fs.reduce((a, b) => a + b.balance, 0)
  const todayAtt = att.filter((a) => a.date === today())
  const recent = [...att].sort((a, b) => b.date.localeCompare(a.date))
  const lastDate = recent[0]?.date
  const lastDay = att.filter((a) => a.date === lastDate)
  const vals = lastDay.flatMap((a) => Object.values(a.records || {}))
  const attPct = vals.length ? Math.round((vals.filter((v) => v !== 'A').length / vals.length) * 100) : 0
  const months = [...Array(6)].map((_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return d })
  const feeTrend = months.map((m) => {
    const key = m.toISOString().slice(0, 7); const v = fees.filter((f) => (f.date || '').startsWith(key)).reduce((s, f) => s + Number(f.amount), 0)
    return { label: m.toLocaleString('en', { month: 'short' }), value: v, display: v ? Math.round(v / 1000) + 'k' : '0' }
  })
  return (
    <>
      <PageHeader title="Management Dashboard" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={<><Link to="/portal/students?new=1" className="btn-primary">+ New Admission</Link><Link to="/portal/fees" className="btn-outline">Collect Fee</Link></>} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat icon={GraduationCap} label="Active students" value={students.length} hint={`${batches.length} batches`} tone="indigo" />
        <Stat icon={Wallet} label="Fees collected" value={inr(collected)} hint={`${inr(pending)} pending`} tone="emerald" />
        <Stat icon={CalendarCheck} label="Attendance (last class day)" value={attPct + '%'} hint={lastDate ? fmtDate(lastDate) + (todayAtt.length ? '' : ' · today not marked') : 'No records'} tone="sky" />
        <Stat icon={PhoneCall} label="Open enquiries" value={enq.filter((e) => ['new', 'contacted'].includes(e.status)).length} hint={`${enq.filter((e) => e.status === 'new').length} new`} tone="amber" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card title="Fee collection — last 6 months" className="lg:col-span-2"><Bars data={feeTrend} /></Card>
        <Card title="Batch strength">
          <div className="space-y-3">
            {batches.map((b) => { const n = students.filter((s) => s.batchId === b.id).length; return (
              <div key={b.id}><div className="flex justify-between text-sm mb-1"><span className="truncate">{b.name}</span><span className="font-semibold">{n}</span></div><Progress value={(n / Math.max(1, students.length)) * 100} /></div>
            ) })}
          </div>
        </Card>
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card title="Top fee defaulters" actions={<Link to="/portal/messaging?audience=fee" className="text-xs font-medium text-indigo-600">Send reminders →</Link>} bodyClass="p-0">
          {fs.filter((x) => x.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 6).map((x) => (
            <div key={x.s.id} className="flex items-center gap-3 px-5 py-2.5 border-t first:border-0 border-slate-100">
              <Avatar name={x.s.name} size="h-8 w-8" /><div className="flex-1 min-w-0"><div className="text-sm truncate">{x.s.name}</div><div className="text-xs text-slate-500">{x.s.rollNo}</div></div>
              <span className="text-sm font-semibold text-rose-600">{inr(x.balance)}</span>
            </div>
          ))}
          {!fs.some((x) => x.balance > 0) && <Empty title="No dues" />}
        </Card>
        <Card title="Latest enquiries" actions={<Link to="/portal/enquiries" className="text-xs font-medium text-indigo-600">View all →</Link>} bodyClass="p-0">
          {enq.slice(0, 6).map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-5 py-2.5 border-t first:border-0 border-slate-100">
              <div className="flex-1 min-w-0"><div className="text-sm truncate">{e.name}</div><div className="text-xs text-slate-500">{e.standard} · {e.source}</div></div>
              <Badge tone={e.status === 'new' ? 'blue' : e.status === 'admitted' ? 'green' : 'amber'}>{e.status}</Badge>
            </div>
          ))}
          {!enq.length && <Empty title="No enquiries" />}
        </Card>
        <Card title="Recent test performance" bodyClass="p-0">
          {tests.filter((t) => t.status === 'published').slice(0, 5).map((t) => {
            const at = attempts.filter((a) => a.testId === t.id); const avg = at.length ? Math.round(at.reduce((s, a) => s + a.percent, 0) / at.length) : 0
            return <div key={t.id} className="px-5 py-3 border-t first:border-0 border-slate-100"><div className="flex justify-between text-sm"><span className="truncate pr-2">{t.title}</span><span className="font-semibold">{avg}%</span></div><div className="text-xs text-slate-500 mb-1.5">{at.length} attempts</div><Progress value={avg} tone={avg >= 60 ? 'bg-emerald-500' : 'bg-amber-500'} /></div>
          })}
        </Card>
      </div>
    </>
  )
}

function FacultyDash() {
  const { user } = useAuth()
  const [batches] = useTable('batches'); const [users] = useTable('users'); const [tt] = useTable('timetable')
  const [att] = useTable('attendance'); const [tests] = useTable('tests'); const [subs] = useTable('submissions'); const [asg] = useTable('assignments')
  const mine = batches.filter((b) => (b.facultyIds || []).includes(user.id))
  const myIds = mine.map((b) => b.id)
  const students = users.filter((u) => u.role === 'student' && myIds.includes(u.batchId))
  const day = new Date().toLocaleString('en', { weekday: 'short' })
  const todays = tt.filter((t) => t.facultyId === user.id && t.day === day).sort((a, b) => a.start.localeCompare(b.start))
  const pendingAtt = mine.filter((b) => !att.some((a) => a.batchId === b.id && a.date === today()))
  const toGrade = subs.filter((s) => s.grade == null && asg.some((a) => a.id === s.assignmentId && myIds.includes(a.batchId)))
  return (
    <>
      <PageHeader title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name}`} subtitle={user.designation} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat icon={Layers} label="My batches" value={mine.length} tone="indigo" />
        <Stat icon={Users} label="My students" value={students.length} tone="sky" />
        <Stat icon={ClipboardList} label="Tests created" value={tests.filter((t) => t.createdBy === user.id).length} tone="emerald" />
        <Stat icon={NotebookPen} label="Submissions to grade" value={toGrade.length} tone="amber" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card title={`Today's schedule (${day})`}>
          {todays.length ? todays.map((t) => (
            <div key={t.id} className="flex items-center gap-4 py-2.5 border-b last:border-0 border-slate-100">
              <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-md px-2 py-1 w-28 text-center">{t.start} – {t.end}</div>
              <div><div className="text-sm font-medium">{t.subject}</div><div className="text-xs text-slate-500">{batches.find((b) => b.id === t.batchId)?.name}</div></div>
            </div>
          )) : <Empty title="No lectures today" icon={Clock} />}
        </Card>
        <Card title="Action needed">
          {pendingAtt.map((b) => (
            <Link key={b.id} to={`/portal/attendance?batch=${b.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 mb-2 text-sm"><AlertCircle size={16} className="text-amber-600" />Mark today's attendance — {b.name}</Link>
          ))}
          {toGrade.length > 0 && <Link to="/portal/assignments" className="flex items-center gap-3 p-3 rounded-lg bg-sky-50 border border-sky-100 mb-2 text-sm"><NotebookPen size={16} className="text-sky-600" />{toGrade.length} assignment submission(s) waiting for grading</Link>}
          {!pendingAtt.length && !toGrade.length && <Empty title="All caught up" />}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link to="/portal/tests?new=1" className="btn-outline">+ New test</Link><Link to="/portal/materials?new=1" className="btn-outline">+ Upload material</Link>
          </div>
        </Card>
      </div>
    </>
  )
}

function StudentDash() {
  const { user } = useAuth()
  const { student } = useMyStudent()
  const [batches] = useTable('batches'); const [att] = useTable('attendance'); const [fees] = useTable('fees'); const [tests] = useTable('tests')
  const [attempts] = useTable('attempts'); const [notices] = useTable('notices'); const [asg] = useTable('assignments'); const [subs] = useTable('submissions'); const [materials] = useTable('materials')
  if (!student) return <Empty title="No student linked" hint="Contact the office to link your child's profile." />
  const batch = batches.find((b) => b.id === student.batchId)
  const a = attendanceSummary(student.id, att.filter((r) => r.batchId === student.batchId))
  const f = feeSummary(student, fees)
  const my = attempts.filter((x) => x.studentId === student.id)
  const avg = my.length ? Math.round(my.reduce((s, x) => s + x.percent, 0) / my.length) : 0
  const pendingTests = tests.filter((t) => t.status === 'published' && (t.batchIds || []).includes(student.batchId) && !my.some((x) => x.testId === t.id))
  const pendingAsg = asg.filter((x) => x.batchId === student.batchId && !subs.some((s) => s.assignmentId === x.id && s.studentId === student.id))
  const myNotices = notices.filter((n) => n.audience === 'all' || n.audience === (user.role === 'parent' ? 'parents' : 'students') || n.batchId === student.batchId).slice(0, 4)
  const newMaterials = materials.filter((m) => m.standard === student.standard || (m.batchIds || []).includes(student.batchId)).slice(0, 4)
  return (
    <>
      <PageHeader title={user.role === 'parent' ? `${student.name}'s progress` : `Hi ${student.name.split(' ')[0]} 👋`} subtitle={`${batch?.name || student.standard} · Roll no. ${student.rollNo || '—'}`} actions={<ChildSwitcher />} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat icon={CalendarCheck} label="Attendance" value={a.pct + '%'} hint={`${a.p} present · ${a.a} absent`} tone={a.pct >= 75 ? 'emerald' : 'rose'} />
        <Stat icon={TrendingUp} label="Average test score" value={avg + '%'} hint={`${my.length} tests taken`} tone="indigo" />
        <Stat icon={ClipboardList} label="Pending tests" value={pendingTests.length} tone="sky" />
        <Stat icon={Wallet} label="Fee balance" value={inr(f.balance)} hint={`${inr(f.paid)} paid of ${inr(f.total)}`} tone={f.balance ? 'amber' : 'emerald'} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card title="Upcoming work" className="lg:col-span-2">
          {pendingTests.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b last:border-0 border-slate-100">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 grid place-items-center"><ClipboardList size={17} /></div>
              <div className="flex-1"><div className="text-sm font-medium">{t.title}</div><div className="text-xs text-slate-500">{t.subject} · {t.questions.length} Qs · {t.durationMin} min</div></div>
              {user.role === 'student' ? <Link to={`/portal/tests/${t.id}/take`} className="btn-primary btn-sm">Start</Link> : <Badge tone="amber">Not attempted</Badge>}
            </div>
          ))}
          {pendingAsg.map((x) => (
            <div key={x.id} className="flex items-center gap-3 py-2.5 border-b last:border-0 border-slate-100">
              <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 grid place-items-center"><NotebookPen size={17} /></div>
              <div className="flex-1"><div className="text-sm font-medium">{x.title}</div><div className="text-xs text-slate-500">Due {fmtDate(x.dueDate)}</div></div>
              <Link to="/portal/assignments" className="btn-outline btn-sm">Open</Link>
            </div>
          ))}
          {!pendingTests.length && !pendingAsg.length && <Empty title="Nothing pending — great work!" />}
        </Card>
        <Card title="Notices" bodyClass="p-0">
          {myNotices.map((n) => <div key={n.id} className="px-5 py-3 border-t first:border-0 border-slate-100"><div className="text-sm font-medium flex gap-2"><Bell size={14} className="text-indigo-500 mt-0.5 shrink-0" />{n.title}</div><div className="text-xs text-slate-500 mt-0.5 pl-6">{fmtDate(n.createdAt)}</div></div>)}
          {!myNotices.length && <Empty title="No notices" />}
        </Card>
      </div>
      {user.role === 'student' && (
        <Card title="Study material for you" className="mt-4" actions={<Link to="/portal/materials" className="text-xs font-medium text-indigo-600">Open library →</Link>}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {newMaterials.map((m) => <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-3 hover:border-indigo-300 text-sm"><Library size={16} className="text-indigo-500 mb-2" /><div className="font-medium line-clamp-2">{m.title}</div><div className="text-xs text-slate-500 mt-1">{m.subject}</div></a>)}
          </div>
        </Card>
      )}
      {my.length > 0 && (
        <Card title="Recent results" className="mt-4">
          <Bars data={my.slice(0, 8).reverse().map((x) => ({ label: (tests.find((t) => t.id === x.testId)?.title || '').slice(0, 14), value: x.percent, display: x.percent + '%' }))} />
        </Card>
      )}
    </>
  )
}
