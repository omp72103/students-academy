// Marks management: offline exams (unit tests, prelims, term exams), marks entry, results, report cards.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Award, Save, Send, MessageCircle, Printer, Download, ArrowLeft, Trophy, TrendingUp, Users, CheckCircle2, XCircle, Eye, EyeOff, CalendarDays, FileSpreadsheet } from 'lucide-react'
import { db, useTable } from '../lib/db'
import { useAuth, canManage } from '../lib/auth'
import { PageHeader, Card, Table, Modal, Field, Badge, useToast, Empty, Stat, Progress, Avatar, Tabs, SectionLabel } from '../components/ui'
import { fmtDate, today, cls, downloadCsv } from '../lib/utils'
import { useMyStudent, ChildSwitcher } from './Layout'
import { dispatch, fill } from '../lib/messaging'
import { useSettings } from '../site/SiteLayout'

export const EXAM_TYPES = ['Unit Test', 'Weekly Test', 'Mid-term', 'Prelim', 'Term-end', 'Mock (CET/JEE/NEET)', 'Practical']
const PRESETS = {
  '9th': ['English', 'Marathi / Hindi', 'Maths 1', 'Maths 2', 'Science 1', 'Science 2', 'Social Science'],
  '10th': ['English', 'Marathi / Hindi', 'Maths 1', 'Maths 2', 'Science 1', 'Science 2', 'Social Science'],
  '11th Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  '12th Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  '12th Commerce': ['Book Keeping & Accountancy', 'Economics', 'OCM', 'Secretarial Practice', 'Maths & Statistics'],
  '12th IT': ['Information Technology'], '11th IT': ['Information Technology'],
  '12th Computer Science': ['Computer Science 1', 'Computer Science 2'], '12th Electronics': ['Electronics'],
  'JEE / NEET / CET': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
}
export function grade(pct) {
  if (pct == null || Number.isNaN(pct)) return '—'
  return pct >= 90 ? 'A1' : pct >= 80 ? 'A2' : pct >= 70 ? 'B1' : pct >= 60 ? 'B2' : pct >= 50 ? 'C1' : pct >= 40 ? 'C2' : pct >= 35 ? 'D' : 'E'
}
const gradeTone = (g) => (g.startsWith('A') ? 'green' : g.startsWith('B') ? 'blue' : g.startsWith('C') ? 'indigo' : g === 'D' ? 'amber' : g === 'E' ? 'red' : 'slate')

/** Compute results for every student in the exam. */
export function computeResults(exam, students) {
  const subs = exam.subjects || []
  const maxTotal = subs.reduce((s, x) => s + Number(x.max || 0), 0)
  const rows = students.map((st) => {
    const m = exam.marks?.[st.id] || {}
    let total = 0, entered = 0, failed = false, absentAll = true
    subs.forEach((sub) => {
      const v = m[sub.name]
      if (v === 'AB') { failed = true; entered++; return }
      if (v === '' || v == null) return
      absentAll = false; entered++; total += Number(v)
      if (Number(v) < Number(sub.pass ?? Math.ceil(sub.max * 0.35))) failed = true
    })
    const complete = entered === subs.length
    const pct = complete && maxTotal ? Math.round((total / maxTotal) * 1000) / 10 : null
    return { student: st, marks: m, total, maxTotal, pct, grade: complete ? grade(pct) : '—', pass: complete ? !failed : null, complete, absentAll: complete && absentAll }
  })
  const ranked = rows.filter((r) => r.complete && !r.absentAll).sort((a, b) => b.total - a.total)
  rows.forEach((r) => { const i = ranked.findIndex((x) => x.student.id === r.student.id); r.rank = i >= 0 ? ranked.findIndex((x) => x.total === r.total) + 1 : null })
  const subjectStats = subs.map((sub) => {
    const vals = rows.map((r) => r.marks[sub.name]).filter((v) => v !== '' && v != null && v !== 'AB').map(Number)
    return { ...sub, avg: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0, high: vals.length ? Math.max(...vals) : 0, count: vals.length }
  })
  return { rows, ranked, subjectStats, maxTotal }
}

// =================================== LIST ===================================
export function Marks() {
  const { user } = useAuth()
  if (user.role === 'student' || user.role === 'parent') return <MyMarks />
  return <ExamList />
}

function ExamList() {
  const { user } = useAuth(); const manage = canManage(user, 'marks')
  const [exams] = useTable('exams'); const [batches] = useTable('batches'); const [users] = useTable('users')
  const [edit, setEdit] = useState(null); const [filter, setFilter] = useState('')
  const myBatches = user.role === 'faculty' ? batches.filter((b) => (b.facultyIds || []).includes(user.id)) : batches
  const list = exams.filter((e) => myBatches.some((b) => b.id === e.batchId) && (!filter || e.batchId === filter)).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const published = list.filter((e) => e.status === 'published')
  const allResults = published.map((e) => computeResults(e, users.filter((u) => u.role === 'student' && u.batchId === e.batchId && u.status !== 'inactive')))
  const pcts = allResults.flatMap((r) => r.rows.filter((x) => x.pct != null).map((x) => x.pct))
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0
  const passRate = (() => { const rs = allResults.flatMap((r) => r.rows.filter((x) => x.pass != null)); return rs.length ? Math.round((rs.filter((x) => x.pass).length / rs.length) * 100) : 0 })()
  return (
    <>
      <PageHeader title="Marks & Exams" subtitle="Unit tests, prelims and term exams: enter marks, publish results, print report cards" actions={manage && <button className="btn-primary" onClick={() => setEdit({ type: 'Unit Test', date: today(), batchId: myBatches[0]?.id, status: 'draft' })}><Plus size={16} />New exam</button>} />
      <div className="mb-5 grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat index={0} tone="indigo" icon={FileSpreadsheet} label="Exams" value={list.length} progress={100} hint={`${published.length} published`} />
        <Stat index={1} tone="emerald" icon={TrendingUp} label="Average score" value={avg + '%'} progress={avg} hint="Across published exams" />
        <Stat index={2} tone="sky" icon={CheckCircle2} label="Pass rate" value={passRate + '%'} progress={passRate} hint="All subjects ≥ passing marks" />
        <Stat index={3} tone="amber" icon={Pencil} label="Drafts" value={list.length - published.length} progress={list.length ? (published.length / list.length) * 100 : 0} hint="Marks entry in progress" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('')} className={cls('btn-sm btn border', !filter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200')}>All batches</button>
        {myBatches.map((b) => <button key={b.id} onClick={() => setFilter(b.id)} className={cls('btn-sm btn border', filter === b.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200')}>{b.name}</button>)}
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((e, i) => {
          const st = users.filter((u) => u.role === 'student' && u.batchId === e.batchId && u.status !== 'inactive')
          const entered = st.filter((s) => (e.subjects || []).every((sub) => { const v = e.marks?.[s.id]?.[sub.name]; return v !== '' && v != null })).length
          const r = computeResults(e, st); const top = r.ranked[0]
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -4 }} className="card overflow-hidden flex flex-col">
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-5 py-4 text-white">
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
                <div className="relative flex justify-between items-start gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">{e.type}</span>
                  <span className={cls('rounded-full px-2.5 py-0.5 text-[11px] font-bold', e.status === 'published' ? 'bg-emerald-400/90 text-emerald-950' : 'bg-white/20')}>{e.status === 'published' ? 'Published' : 'Draft'}</span>
                </div>
                <div className="relative mt-3 font-heading text-lg font-bold leading-snug">{e.name}</div>
                <div className="relative text-xs text-white/80 mt-0.5">{batches.find((b) => b.id === e.batchId)?.name} · {fmtDate(e.date)}</div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Marks entered</span><span>{entered}/{st.length}</span></div>
                <Progress value={st.length ? (entered / st.length) * 100 : 0} tone={entered === st.length && st.length ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : undefined} />
                <div className="mt-3 flex flex-wrap gap-1">{(e.subjects || []).map((s) => <span key={s.name} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{s.name} · {s.max}</span>)}</div>
                {top && <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><Trophy size={14} className="text-amber-500" />Topper: {top.student.name} · {top.pct}%</div>}
                <div className="mt-auto pt-4 flex gap-2">
                  <Link to={`/portal/marks/${e.id}`} className="btn-primary btn-sm flex-1">{manage ? 'Enter marks / results' : 'View results'}</Link>
                  {manage && <button className="btn-outline btn-sm" onClick={() => setEdit(e)}><Pencil size={14} /></button>}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      {!list.length && <Card gradient={false}><Empty title="No exams yet" hint={manage ? 'Create an exam to start entering marks.' : ''} icon={Award} /></Card>}
      {edit && <ExamForm initial={edit} batches={myBatches} onClose={() => setEdit(null)} />}
    </>
  )
}

function ExamForm({ initial, batches, onClose }) {
  const { user } = useAuth(); const toast = useToast(); const nav = useNavigate()
  const preset = (bid) => (PRESETS[batches.find((b) => b.id === bid)?.standard] || ['Subject 1']).map((name) => ({ name, max: 20, pass: 7 }))
  const [e, setE] = useState({ ...initial, subjects: initial.subjects || preset(initial.batchId) })
  const upSub = (i, patch) => setE({ ...e, subjects: e.subjects.map((s, k) => (k === i ? { ...s, ...patch } : s)) })
  async function save() {
    if (!e.name) return toast('Exam name is required', 'error')
    if (!e.subjects.length || e.subjects.some((s) => !s.name || !Number(s.max))) return toast('Every subject needs a name and max marks', 'error')
    const row = { ...e, subjects: e.subjects.map((s) => ({ name: s.name.trim(), max: Number(s.max), pass: Number(s.pass ?? Math.ceil(s.max * 0.35)) })) }
    if (e.id) { await db.update('exams', e.id, row); toast('Exam updated'); onClose() }
    else { const r = await db.insert('exams', { ...row, marks: {}, createdBy: user.id }); toast('Exam created, enter marks now'); onClose(); nav(`/portal/marks/${r.id}`) }
  }
  return (
    <Modal open wide onClose={onClose} title={e.id ? 'Edit exam' : 'New exam'} footer={<>
      {e.id && <button className="btn-outline text-rose-600 mr-auto" onClick={async () => { if (window.confirm('Delete this exam and all its marks?')) { await db.remove('exams', e.id); onClose() } }}><Trash2 size={15} />Delete</button>}
      <button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Exam name *" className="sm:col-span-2"><input className="input" value={e.name || ''} onChange={(x) => setE({ ...e, name: x.target.value })} placeholder="e.g. Unit Test 2 — Chapters 3 & 4" /></Field>
        <Field label="Type"><select className="input" value={e.type} onChange={(x) => setE({ ...e, type: x.target.value })}>{EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Date"><input type="date" className="input" value={e.date} onChange={(x) => setE({ ...e, date: x.target.value })} /></Field>
        <Field label="Batch" className="sm:col-span-2"><select className="input" value={e.batchId} disabled={!!e.id} onChange={(x) => setE({ ...e, batchId: x.target.value, subjects: preset(x.target.value) })}>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
      </div>
      <div className="mt-5 flex items-center justify-between"><div className="label mb-0">Subjects, max & passing marks</div><button className="btn-outline btn-sm" onClick={() => setE({ ...e, subjects: [...e.subjects, { name: '', max: 20, pass: 7 }] })}><Plus size={13} />Subject</button></div>
      <div className="mt-2 space-y-2">
        {e.subjects.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_90px_90px_36px] gap-2 items-center">
            <input className="input" value={s.name} onChange={(x) => upSub(i, { name: x.target.value })} placeholder="Subject" />
            <input type="number" className="input" value={s.max} onChange={(x) => upSub(i, { max: x.target.value, pass: Math.ceil(Number(x.target.value) * 0.35) })} title="Max marks" />
            <input type="number" className="input" value={s.pass} onChange={(x) => upSub(i, { pass: x.target.value })} title="Passing marks" />
            <button className="btn-ghost p-2 text-rose-600" onClick={() => setE({ ...e, subjects: e.subjects.filter((_, k) => k !== i) })}><Trash2 size={15} /></button>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_90px_90px_36px] gap-2 text-[11px] font-bold uppercase text-slate-400"><span /><span>Max</span><span>Pass</span><span /></div>
      </div>
    </Modal>
  )
}

// =================================== EXAM DETAIL ===================================
export function ExamDetail() {
  const { id } = useParams(); const { user } = useAuth(); const manage = canManage(user, 'marks')
  const [exams, loading] = useTable('exams'); const [users] = useTable('users'); const [batches] = useTable('batches')
  const exam = exams.find((e) => e.id === id)
  const [tab, setTab] = useState(manage ? 'entry' : 'results')
  if (loading) return <div className="text-slate-500">Loading…</div>
  if (!exam) return <Empty title="Exam not found" />
  const students = users.filter((u) => u.role === 'student' && u.batchId === exam.batchId && u.status !== 'inactive').sort((a, b) => (a.rollNo || a.name).localeCompare(b.rollNo || b.name))
  const batch = batches.find((b) => b.id === exam.batchId)
  return (
    <>
      <PageHeader icon={Award} eyebrow={`${exam.type} · ${fmtDate(exam.date)}`} title={exam.name} subtitle={batch?.name}
        actions={<><Link to="/portal/marks" className="btn-outline"><ArrowLeft size={15} />All exams</Link>
          {manage && <button className="btn-outline" onClick={async () => { await db.update('exams', exam.id, { status: exam.status === 'published' ? 'draft' : 'published', publishedAt: new Date().toISOString() }) }}>
            {exam.status === 'published' ? <><EyeOff size={15} />Unpublish</> : <><Eye size={15} />Publish to students & parents</>}</button>}</>} />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[...(manage ? [{ value: 'entry', label: 'Enter marks' }] : []), { value: 'results', label: 'Results & ranks' }, { value: 'analysis', label: 'Subject analysis' }]} /></div>
      {tab === 'entry' && <MarksEntry exam={exam} students={students} />}
      {tab === 'results' && <ResultsView exam={exam} students={students} batch={batch} manage={manage} />}
      {tab === 'analysis' && <Analysis exam={exam} students={students} />}
    </>
  )
}

function MarksEntry({ exam, students }) {
  const toast = useToast()
  const [m, setM] = useState(() => JSON.parse(JSON.stringify(exam.marks || {})))
  const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false)
  const subs = exam.subjects || []
  const refs = useRef({})
  const set = (sid, sub, v) => {
    const max = Number(sub.max)
    let val = v.toUpperCase() === 'AB' || v.toUpperCase() === 'A' ? 'AB' : v.replace(/[^\d.]/g, '')
    if (val !== 'AB' && val !== '' && Number(val) > max) { toast(`Max for ${sub.name} is ${max}`, 'error'); val = String(max) }
    setM((x) => ({ ...x, [sid]: { ...(x[sid] || {}), [sub.name]: val } })); setDirty(true)
  }
  async function save() { setSaving(true); await db.update('exams', exam.id, { marks: m }); setSaving(false); setDirty(false); toast('Marks saved') }
  useEffect(() => { if (!dirty) return; const t = setTimeout(save, 2500); return () => clearTimeout(t) }, [m]) // eslint-disable-line
  const move = (r, c, e) => {
    if (!['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault(); const nr = e.key === 'ArrowUp' ? r - 1 : r + 1
    refs.current[`${nr}-${c}`]?.focus(); refs.current[`${nr}-${c}`]?.select?.()
  }
  return (
    <Card title="Marks entry" icon={Pencil} actions={<span className="text-xs font-bold text-white/90">{saving ? 'Saving…' : dirty ? 'Unsaved (autosaves)' : 'All changes saved'}</span>} bodyClass="p-0">
      <div className="px-5 py-3 text-xs font-semibold text-slate-500 border-b border-slate-100">Type marks, or <b>AB</b> for absent. Enter / ↓ moves down a column. Saves automatically.</div>
      <div className="overflow-x-auto nice-scroll">
        <table className="w-full">
          <thead><tr><th className="th sticky left-0 z-10">Student</th>{subs.map((s) => <th key={s.name} className="th text-center whitespace-nowrap">{s.name}<div className="text-[10px] font-semibold normal-case text-slate-400">/ {s.max}</div></th>)}<th className="th text-center">Total</th></tr></thead>
          <tbody>
            {students.map((st, r) => {
              const row = m[st.id] || {}
              const total = subs.reduce((a, s) => a + (row[s.name] && row[s.name] !== 'AB' ? Number(row[s.name]) : 0), 0)
              return (
                <tr key={st.id} className="hover:bg-blue-50/40">
                  <td className="td sticky left-0 bg-white/90 backdrop-blur z-10"><div className="flex items-center gap-2"><Avatar name={st.name} size="h-7 w-7" /><div><div className="text-sm font-semibold whitespace-nowrap">{st.name}</div><div className="text-[11px] text-slate-500">{st.rollNo}</div></div></div></td>
                  {subs.map((s, c) => {
                    const v = row[s.name] ?? ''; const low = v !== '' && v !== 'AB' && Number(v) < Number(s.pass)
                    return <td key={s.name} className="td text-center p-1.5">
                      <input ref={(el) => (refs.current[`${r}-${c}`] = el)} value={v} onChange={(e) => set(st.id, s, e.target.value)} onKeyDown={(e) => move(r, c, e)} inputMode="decimal"
                        className={cls('w-16 rounded-lg border px-2 py-1.5 text-center text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400', v === 'AB' ? 'border-amber-300 bg-amber-50 text-amber-700' : low ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white')} />
                    </td>
                  })}
                  <td className="td text-center font-heading font-extrabold text-slate-800">{total}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!students.length && <Empty title="No students in this batch" />}
      <div className="p-4 flex justify-end border-t border-slate-100"><button className="btn-primary" onClick={save} disabled={!dirty || saving}><Save size={15} />Save marks</button></div>
    </Card>
  )
}

function ResultsView({ exam, students, batch, manage }) {
  const { user } = useAuth(); const s = useSettings(); const toast = useToast()
  const { rows, maxTotal } = computeResults(exam, students)
  const sorted = [...rows].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
  const done = rows.filter((r) => r.complete)
  async function notify(channel) {
    if (exam.status !== 'published') return toast('Publish the result first', 'error')
    const tpl = 'Dear Parent, {student} scored {total}/{max} ({pct}%, grade {grade}) in {exam}{rank}. {sig}'
    const msgs = done.map((r) => ({ phone: r.student.parentPhone, name: r.student.parentName, text: fill(tpl, { student: r.student.name, total: r.total, max: maxTotal, pct: r.pct, grade: r.grade, exam: exam.name, rank: r.rank ? `, class rank ${r.rank}` : '', sig: s.smsSignature }) }))
    const res = await dispatch(channel, msgs, { sentBy: user.id, purpose: 'marks' })
    if (res.mode === 'app') toast(`${res.count} ${channel === 'sms' ? 'SMS sending from the academy SIM' : 'WhatsApp chats opening'}`)
  }
  return (
    <Card title={`Results · ${done.length}/${rows.length} complete`} icon={Trophy} bodyClass="p-0"
      actions={<>
        <a onClick={() => downloadCsv(`${exam.name}.csv`, sorted.map((r) => ({ rank: r.rank ?? '', rollNo: r.student.rollNo, name: r.student.name, ...Object.fromEntries((exam.subjects || []).map((x) => [x.name, r.marks[x.name] ?? ''])), total: r.total, max: maxTotal, percent: r.pct ?? '', grade: r.grade, result: r.pass == null ? '' : r.pass ? 'Pass' : 'Fail' })))} className="cursor-pointer text-xs font-bold flex items-center gap-1"><Download size={13} />CSV</a>
        {manage && <><a onClick={() => notify('sms')} className="cursor-pointer text-xs font-bold flex items-center gap-1"><Send size={13} />SMS</a><a onClick={() => notify('whatsapp')} className="cursor-pointer text-xs font-bold flex items-center gap-1"><MessageCircle size={13} />WhatsApp</a></>}
      </>}>
      <Table rows={sorted} columns={[
        { label: 'Rank', render: (r) => r.rank ? <span className={cls('inline-grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold', r.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : r.rank <= 3 ? 'bg-blue-100 text-blue-700' : 'text-slate-500')}>{r.rank}</span> : '—' },
        { label: 'Student', render: (r) => <div className="flex items-center gap-2"><Avatar name={r.student.name} size="h-7 w-7" /><div><div className="text-sm font-semibold">{r.student.name}</div><div className="text-[11px] text-slate-500">{r.student.rollNo}</div></div></div> },
        ...(exam.subjects || []).map((x) => ({ label: x.name, className: 'text-center', render: (r) => { const v = r.marks[x.name]; return v === 'AB' ? <Badge tone="amber">AB</Badge> : v === '' || v == null ? <span className="text-slate-300">—</span> : <span className={cls('font-semibold', Number(v) < Number(x.pass) && 'text-rose-600')}>{v}</span> } })),
        { label: 'Total', className: 'text-center', render: (r) => <b>{r.complete ? `${r.total}/${maxTotal}` : '—'}</b> },
        { label: '%', render: (r) => r.pct != null ? `${r.pct}%` : '—' },
        { label: 'Grade', render: (r) => <Badge tone={gradeTone(r.grade)}>{r.grade}</Badge> },
        { label: 'Result', render: (r) => r.pass == null ? <span className="text-xs text-slate-400">Pending</span> : r.pass ? <Badge tone="green">Pass</Badge> : <Badge tone="red">Fail</Badge> },
        { label: '', render: (r) => <button className="btn-ghost p-1.5" title="Print report card" onClick={() => printReportCard({ student: r.student, batch, settings: s, exams: [exam] })}><Printer size={15} /></button> },
      ]} />
    </Card>
  )
}

function Analysis({ exam, students }) {
  const { rows, subjectStats, ranked } = computeResults(exam, students)
  const dist = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'].map((g) => ({ g, n: rows.filter((r) => r.grade === g).length }))
  const maxN = Math.max(1, ...dist.map((d) => d.n))
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card title="Subject averages" icon={TrendingUp}>
        <div className="space-y-4">
          {subjectStats.map((x) => (
            <div key={x.name}>
              <div className="flex justify-between text-sm mb-1"><span className="font-semibold">{x.name}</span><span className="text-xs font-bold text-slate-500">avg {x.avg}/{x.max} · high {x.high}</span></div>
              <Progress value={x.max ? (x.avg / x.max) * 100 : 0} tone={x.avg / x.max >= 0.6 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-400 to-orange-500'} />
            </div>
          ))}
        </div>
      </Card>
      <Card title="Grade distribution" icon={Award}>
        <div className="flex items-end gap-3 h-48">
          {dist.map((d, i) => (
            <div key={d.g} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
              <span className="text-xs font-bold text-slate-600">{d.n}</span>
              <motion.div className="w-full max-w-[40px] rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400" initial={{ height: 0 }} animate={{ height: `${Math.max(3, (d.n / maxN) * 85)}%` }} transition={{ delay: i * 0.05, duration: 0.6 }} />
              <span className="text-[11px] font-bold text-slate-500">{d.g}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Top performers" icon={Trophy} className="lg:col-span-2" bodyClass="p-4">
        <div className="grid sm:grid-cols-3 gap-3">
          {ranked.slice(0, 3).map((r, i) => (
            <div key={r.student.id} className={cls('rounded-2xl p-4 text-white bg-gradient-to-br', ['from-amber-400 to-orange-500', 'from-slate-400 to-slate-600', 'from-orange-600 to-amber-800'][i])}>
              <div className="text-xs font-bold opacity-80">#{i + 1}</div><div className="font-heading font-bold text-lg">{r.student.name}</div><div className="text-sm font-semibold opacity-90">{r.total}/{r.maxTotal} · {r.pct}% · {r.grade}</div>
            </div>
          ))}
          {!ranked.length && <Empty title="No complete results yet" />}
        </div>
      </Card>
    </div>
  )
}

// =================================== STUDENT / PARENT ===================================
function MyMarks() {
  const { student } = useMyStudent()
  const [exams] = useTable('exams'); const [users] = useTable('users'); const [batches] = useTable('batches'); const s = useSettings()
  if (!student) return <Empty title="No student linked" />
  const mine = exams.filter((e) => e.batchId === student.batchId && e.status === 'published').sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const classmates = users.filter((u) => u.role === 'student' && u.batchId === student.batchId && u.status !== 'inactive')
  const results = mine.map((e) => ({ exam: e, ...computeResults(e, classmates) })).map((x) => ({ ...x, me: x.rows.find((r) => r.student.id === student.id) }))
  const pcts = results.filter((x) => x.me?.pct != null).map((x) => x.me.pct)
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0
  const best = results.filter((x) => x.me?.rank).sort((a, b) => a.me.rank - b.me.rank)[0]
  return (
    <>
      <PageHeader title="Exam Marks" subtitle={`${student.name} · ${batches.find((b) => b.id === student.batchId)?.name || ''}`} actions={<><ChildSwitcher />{results.length > 0 && <button className="btn-outline" onClick={() => printReportCard({ student, batch: batches.find((b) => b.id === student.batchId), settings: s, exams: mine, classmates })}><Printer size={15} />Report card</button>}</>} />
      <div className="mb-5 grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat index={0} tone="indigo" icon={FileSpreadsheet} label="Exams" value={results.length} progress={100} hint="Published results" />
        <Stat index={1} tone="emerald" icon={TrendingUp} label="Average" value={avg + '%'} progress={avg} hint={`Grade ${grade(avg)}`} />
        <Stat index={2} tone="amber" icon={Trophy} label="Best rank" value={best ? '#' + best.me.rank : '—'} progress={best ? 100 - (best.me.rank - 1) * 10 : 0} hint={best?.exam.name || ''} />
        <Stat index={3} tone="sky" icon={CheckCircle2} label="Passed" value={`${results.filter((x) => x.me?.pass).length}/${results.length}`} progress={results.length ? (results.filter((x) => x.me?.pass).length / results.length) * 100 : 0} hint="All subjects cleared" />
      </div>
      <div className="space-y-5">
        {results.map(({ exam, me, subjectStats, maxTotal }) => (
          <Card key={exam.id} title={exam.name} icon={Award} actions={<span className="text-xs font-bold text-white/90">{exam.type} · {fmtDate(exam.date)}</span>}>
            {me?.complete ? (
              <>
                <div className="flex flex-wrap gap-3 mb-5">
                  {[['Total', `${me.total}/${maxTotal}`], ['Percentage', `${me.pct}%`], ['Grade', me.grade], ['Class rank', me.rank ? `#${me.rank}` : '—'], ['Result', me.pass ? 'Pass' : 'Fail']].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-slate-50 px-4 py-2.5"><div className="text-[10px] font-bold uppercase text-slate-400">{l}</div><div className={cls('font-heading text-lg font-extrabold', l === 'Result' && (me.pass ? 'text-emerald-600' : 'text-rose-600'))}>{v}</div></div>
                  ))}
                </div>
                <div className="space-y-3">
                  {(exam.subjects || []).map((sub) => {
                    const v = me.marks[sub.name]; const st = subjectStats.find((x) => x.name === sub.name)
                    return (
                      <div key={sub.name}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-semibold">{sub.name}</span><span className="text-xs font-bold text-slate-500">{v === 'AB' ? 'Absent' : `${v}/${sub.max}`} · class avg {st?.avg}</span></div>
                        <Progress value={v === 'AB' ? 0 : (Number(v) / sub.max) * 100} tone={v !== 'AB' && Number(v) >= Number(sub.pass) ? 'bg-gradient-to-r from-blue-600 to-cyan-400' : 'bg-gradient-to-r from-rose-500 to-orange-400'} />
                      </div>
                    )
                  })}
                </div>
              </>
            ) : <Empty title="Marks not available yet" />}
          </Card>
        ))}
        {!results.length && <Card gradient={false}><Empty title="No exam results published yet" icon={Award} /></Card>}
      </div>
    </>
  )
}

// =================================== REPORT CARD ===================================
export function printReportCard({ student, batch, settings: s, exams, classmates }) {
  const rows = exams.map((e) => { const r = computeResults(e, classmates || [student]); return { e, me: r.rows.find((x) => x.student.id === student.id), max: r.maxTotal } }).filter((x) => x.me)
  const esc = (t) => String(t ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const html = `<html><head><title>Report card — ${esc(student.name)}</title><style>
    body{font-family:Inter,Arial,sans-serif;color:#0f172a;padding:32px;max-width:820px;margin:auto}
    .hd{text-align:center;border-bottom:3px solid #102445;padding-bottom:12px} .hd h1{margin:0;color:#102445;font-size:24px} .hd p{margin:4px 0;color:#555;font-size:12px}
    .t{letter-spacing:3px;font-weight:700;margin-top:8px;color:#c8962e} table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
    th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:center} th{background:#f1f5fb;color:#102445} .info td{border:none;text-align:left;padding:3px 0}
    h3{margin:22px 0 4px;color:#102445;font-size:15px} .sig{display:flex;justify-content:space-between;margin-top:56px;font-size:12px;color:#555}
  </style></head><body>
  <div class="hd"><h1>${esc(s.name)}</h1><p>${esc(s.address)} · ${esc(s.phone)}</p><div class="t">PROGRESS REPORT</div></div>
  <table class="info"><tr><td><b>Student:</b> ${esc(student.name)}</td><td><b>Roll no.:</b> ${esc(student.rollNo)}</td></tr><tr><td><b>Batch:</b> ${esc(batch?.name)}</td><td><b>Date:</b> ${fmtDate(today())}</td></tr></table>
  ${rows.map(({ e, me, max }) => `<h3>${esc(e.name)} <span style="font-weight:400;color:#64748b">(${esc(e.type)}, ${fmtDate(e.date)})</span></h3>
    <table><tr><th style="text-align:left">Subject</th><th>Max</th><th>Passing</th><th>Obtained</th></tr>
    ${(e.subjects || []).map((x) => `<tr><td style="text-align:left">${esc(x.name)}</td><td>${x.max}</td><td>${x.pass}</td><td>${esc(me.marks[x.name] ?? '—')}</td></tr>`).join('')}
    <tr><th style="text-align:left">Total</th><th>${max}</th><th></th><th>${me.complete ? me.total : '—'}</th></tr></table>
    <p style="font-size:13px;margin:6px 0">Percentage: <b>${me.pct ?? '—'}%</b> · Grade: <b>${me.grade}</b> · Rank: <b>${me.rank ?? '—'}</b> · Result: <b>${me.pass == null ? '—' : me.pass ? 'Pass' : 'Fail'}</b></p>`).join('')}
  <div class="sig"><span>Class teacher</span><span>Parent's signature</span><span>Head Master</span></div>
  </body></html>`
  const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300)
}
