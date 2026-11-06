import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Clock, ChevronLeft, ChevronRight, Flag, Send, ClipboardList, Copy, Eye, Trophy, MessageCircle, BarChart3, CheckCircle2, XCircle, AlertTriangle, ListPlus } from 'lucide-react'
import { db, useTable, uid } from '../lib/db'
import { useAuth, canManage } from '../lib/auth'
import { PageHeader, Card, Table, Modal, Field, Badge, useToast, Empty, Stat, Progress, Avatar, Tabs } from '../components/ui'
import { fmtDate, fmtDateTime, cls, downloadCsv } from '../lib/utils'
import { useMyStudent, ChildSwitcher } from './Layout'
import { fill, TEMPLATES, dispatch } from '../lib/messaging'
import { useSettings } from '../site/SiteLayout'

const L = ['A', 'B', 'C', 'D', 'E', 'F']
const SUBJ_GRAD = ['from-blue-600 via-indigo-600 to-violet-600', 'from-sky-500 via-blue-600 to-indigo-600', 'from-emerald-500 via-teal-600 to-cyan-600', 'from-violet-500 via-purple-600 to-indigo-600', 'from-amber-500 via-orange-600 to-rose-500']

// ======================= TEST LIST =======================
export function Tests() {
  const { user } = useAuth(); const { student } = useMyStudent()
  const manage = canManage(user, 'tests')
  const [tests] = useTable('tests'); const [attempts] = useTable('attempts'); const [batches] = useTable('batches')
  const [params, setParams] = useSearchParams(); const [edit, setEdit] = useState(null); const toast = useToast()
  useEffect(() => { if (params.get('new') && manage) { setEdit(blank()); setParams({}) } }, [params, manage, setParams]) // eslint-disable-line
  const myBatches = user.role !== 'faculty' ? batches : batches.filter((b) => (b.facultyIds || []).includes(user.id))
  const blank = () => ({ title: '', subject: '', batchIds: myBatches[0] ? [myBatches[0].id] : [], durationMin: 30, negative: 0, shuffle: true, status: 'draft', questions: [], showAnswers: true })
  const list = manage ? tests.filter((t) => user.role !== 'faculty' || t.createdBy === user.id || (t.batchIds || []).some((b) => myBatches.some((m) => m.id === b)))
    : tests.filter((t) => t.status === 'published' && (t.batchIds || []).includes(student?.batchId))

  return (
    <>
      <PageHeader title="Online Tests" subtitle={manage ? 'Create MCQ tests, publish to batches and track performance' : 'Attempt tests assigned to your batch'} actions={manage && <button className="btn-primary" onClick={() => setEdit(blank())}><Plus size={16} />Create test</button>} />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((t) => {
          const at = attempts.filter((a) => a.testId === t.id); const mine = student && at.find((a) => a.studentId === student.id)
          const totalMarks = t.questions.reduce((s, q) => s + Number(q.marks || 1), 0)
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: list.indexOf(t) * 0.05 }} whileHover={{ y: -4 }} className="card flex flex-col overflow-hidden">
              <div className={cls('relative overflow-hidden bg-gradient-to-br px-5 py-4 text-white', SUBJ_GRAD[[...(t.subject || 'x')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % SUBJ_GRAD.length])}>
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/25 grid place-items-center"><ClipboardList size={18} /></div>
                  {manage ? <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold capitalize">{t.status}</span> : mine ? <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold">{mine.percent}%</span> : <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-indigo-700" style={{ background: "#fff" }}>New</span>}
                </div>
                <div className="relative mt-3 text-[11px] font-bold uppercase tracking-wider text-white/80">{t.subject}</div>
                <div className="relative font-heading font-bold text-lg leading-snug">{t.title}</div>
              </div>
              <div className="p-5 flex flex-col flex-1">
              <div className="text-xs font-medium text-slate-500">{(t.batchIds || []).map((b) => batches.find((x) => x.id === b)?.name).filter(Boolean).join(', ')}</div>
              <div className="flex gap-2 mt-3">
                {[[t.questions.length, 'Questions'], [totalMarks, 'Marks'], [t.durationMin + 'm', 'Duration']].map(([v, l]) => <div key={l} className="flex-1 rounded-xl bg-slate-50 py-2 text-center"><div className="font-heading font-extrabold text-slate-800">{v}</div><div className="text-[10px] font-bold uppercase text-slate-400">{l}</div></div>)}
              </div>
              {manage && <div className="mt-3"><div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1"><span>Attempted</span><span>{at.length}</span></div><Progress value={Math.min(100, at.length * 10)} /></div>}
              <div className="mt-auto pt-4 flex gap-2">
                {manage ? <>
                  <button className="btn-outline btn-sm flex-1" onClick={() => setEdit(t)}><Pencil size={14} />Edit</button>
                  <Link to={`/portal/results?test=${t.id}`} className="btn-outline btn-sm flex-1"><BarChart3 size={14} />{at.length} results</Link>
                  <button className="btn-ghost btn-sm" title="Duplicate" onClick={async () => { await db.insert('tests', { ...t, id: undefined, title: t.title + ' (copy)', status: 'draft', createdBy: user.id }); toast('Duplicated') }}><Copy size={14} /></button>
                </> : user.role === 'student' ? (mine ? <Link to={`/portal/tests/${t.id}/review`} className="btn-outline btn-sm flex-1"><Eye size={14} />View result</Link> : <Link to={`/portal/tests/${t.id}/take`} className="btn-primary btn-sm flex-1">Start test</Link>)
                  : mine ? <Badge tone="green">Score {mine.score}/{mine.total}</Badge> : <Badge tone="amber">Not attempted</Badge>}
              </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      {!list.length && <Card><Empty title="No tests yet" icon={ClipboardList} /></Card>}
      {edit && <TestBuilder initial={edit} batches={myBatches} onClose={() => setEdit(null)} />}
    </>
  )
}

function parseBulk(text) {
  // Q. text / A) .. B) .. / Ans: B   (blank line between questions)
  return text.trim().split(/\n\s*\n/).map((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    const qLine = lines.findIndex((l) => !/^[A-F][).:]/i.test(l) && !/^ans/i.test(l))
    const opts = lines.filter((l) => /^[A-F][).:]\s*/i.test(l)).map((l) => l.replace(/^[A-F][).:]\s*/i, ''))
    const ans = (lines.find((l) => /^ans/i.test(l)) || '').replace(/^ans(wer)?\s*[:.-]?\s*/i, '').trim().toUpperCase()
    return { id: uid('q'), text: (lines[qLine] || '').replace(/^(Q\.?\s*\d*[.)]?|\d+[.)])\s*/i, ''), options: opts, answer: Math.max(0, L.indexOf(ans[0])), marks: 1, explanation: '' }
  }).filter((q) => q.text && q.options.length >= 2)
}

function TestBuilder({ initial, batches, onClose }) {
  const { user } = useAuth(); const toast = useToast()
  const [t, setT] = useState(JSON.parse(JSON.stringify(initial)))
  const [bulk, setBulk] = useState(null)
  const upQ = (i, patch) => setT({ ...t, questions: t.questions.map((q, k) => (k === i ? { ...q, ...patch } : q)) })
  const addQ = () => setT({ ...t, questions: [...t.questions, { id: uid('q'), text: '', options: ['', '', '', ''], answer: 0, marks: 1, explanation: '' }] })
  async function save(status) {
    if (!t.title) return toast('Test title required', 'error')
    if (status === 'published' && !t.questions.length) return toast('Add at least one question', 'error')
    const bad = t.questions.findIndex((q) => !q.text || q.options.filter(Boolean).length < 2)
    if (bad >= 0) return toast(`Question ${bad + 1} is incomplete`, 'error')
    const row = { ...t, status: status || t.status, durationMin: Number(t.durationMin), negative: Number(t.negative || 0), questions: t.questions.map((q) => ({ ...q, options: q.options.filter((o) => o !== '') })) }
    if (row.status === 'published' && !row.startAt) row.startAt = new Date().toISOString()
    t.id ? await db.update('tests', t.id, row) : await db.insert('tests', { ...row, createdBy: user.id })
    toast(status === 'published' ? 'Test published to students' : 'Saved'); onClose()
  }
  return (
    <Modal open wide onClose={onClose} title={t.id ? 'Edit test' : 'Create test'} footer={<>
      {t.id && <button className="btn-outline text-rose-600 mr-auto" onClick={async () => { if (window.confirm('Delete test and its results?')) { await db.remove('tests', t.id); onClose() } }}><Trash2 size={15} /></button>}
      {t.status === 'published' && <button className="btn-outline" onClick={() => save('closed')}>Close test</button>}
      <button className="btn-outline" onClick={() => save('draft')}>Save draft</button><button className="btn-primary" onClick={() => save('published')}><Send size={15} />Publish</button></>}>
      <div className="grid sm:grid-cols-4 gap-4">
        <Field label="Test title" className="sm:col-span-2"><input className="input" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} /></Field>
        <Field label="Subject"><input className="input" value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} /></Field>
        <Field label="Duration (min)"><input type="number" className="input" value={t.durationMin} onChange={(e) => setT({ ...t, durationMin: e.target.value })} /></Field>
        <Field label="Negative marks / wrong"><input type="number" step="0.25" className="input" value={t.negative} onChange={(e) => setT({ ...t, negative: e.target.value })} /></Field>
        <Field label="Options" className="sm:col-span-3"><div className="flex flex-wrap gap-4 pt-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!t.shuffle} onChange={(e) => setT({ ...t, shuffle: e.target.checked })} />Shuffle questions</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={t.showAnswers !== false} onChange={(e) => setT({ ...t, showAnswers: e.target.checked })} />Show answers after submit</label>
        </div></Field>
        <Field label="Assign to batches" className="sm:col-span-4"><div className="flex flex-wrap gap-2">{batches.map((b) => { const on = t.batchIds.includes(b.id); return <button type="button" key={b.id} onClick={() => setT({ ...t, batchIds: on ? t.batchIds.filter((x) => x !== b.id) : [...t.batchIds, b.id] })} className={cls('btn btn-sm border', on ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300')}>{b.name}</button> })}</div></Field>
      </div>
      <div className="flex items-center justify-between mt-6 mb-3"><div className="font-semibold text-sm">Questions ({t.questions.length})</div>
        <div className="flex gap-2"><button className="btn-outline btn-sm" onClick={() => setBulk('')}><ListPlus size={14} />Bulk paste</button><button className="btn-primary btn-sm" onClick={addQ}><Plus size={14} />Add question</button></div></div>
      <div className="space-y-4">
        {t.questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
            <div className="flex gap-2 items-start">
              <span className="text-xs font-bold text-slate-500 mt-2.5 w-6">Q{i + 1}</span>
              <textarea rows={2} className="input" placeholder="Question text" value={q.text} onChange={(e) => upQ(i, { text: e.target.value })} />
              <input type="number" className="input w-16" title="Marks" value={q.marks} onChange={(e) => upQ(i, { marks: Number(e.target.value) })} />
              <button className="btn-ghost p-2 text-rose-600" onClick={() => setT({ ...t, questions: t.questions.filter((_, k) => k !== i) })}><Trash2 size={15} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 mt-3 pl-8">
              {q.options.map((o, k) => (
                <div key={k} className="flex items-center gap-2">
                  <button type="button" onClick={() => upQ(i, { answer: k })} className={cls('h-8 w-8 shrink-0 rounded-full text-xs font-bold border', q.answer === k ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300')} title="Mark correct">{L[k]}</button>
                  <input className="input py-1.5" value={o} placeholder={`Option ${L[k]}`} onChange={(e) => upQ(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} />
                </div>
              ))}
            </div>
            <input className="input mt-2 ml-8 w-[calc(100%-2rem)] py-1.5 text-xs" placeholder="Explanation (shown after submit, optional)" value={q.explanation || ''} onChange={(e) => upQ(i, { explanation: e.target.value })} />
          </div>
        ))}
        {!t.questions.length && <div className="text-center text-sm text-slate-500 py-6 border-2 border-dashed rounded-xl">No questions yet — add one or bulk paste.</div>}
      </div>
      {bulk !== null && <Modal open onClose={() => setBulk(null)} title="Bulk paste questions" footer={<button className="btn-primary" onClick={() => { const qs = parseBulk(bulk); setT({ ...t, questions: [...t.questions, ...qs] }); toast(`${qs.length} questions added`); setBulk(null) }}>Add questions</button>}>
        <p className="text-xs text-slate-500 mb-2">One question per block, separated by a blank line:</p>
        <pre className="text-xs bg-slate-50 rounded p-2 mb-3">{'Q. SI unit of force is\nA) Joule\nB) Newton\nC) Watt\nD) Pascal\nAns: B'}</pre>
        <textarea rows={12} className="input font-mono text-xs" value={bulk} onChange={(e) => setBulk(e.target.value)} />
      </Modal>}
    </Modal>
  )
}

// ======================= TAKE TEST =======================
function seededShuffle(arr, seed) { const a = [...arr]; let s = [...seed].reduce((x, c) => x + c.charCodeAt(0), 0); for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

export function TakeTest() {
  const { id } = useParams(); const { user, viewAs } = useAuth(); const nav = useNavigate(); const toast = useToast()
  const [tests] = useTable('tests'); const [attempts, loadingA] = useTable('attempts')
  const t = tests.find((x) => x.id === id)
  const key = `sa_test_${id}_${user.id}`
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null } }, [key])
  const [answers, setAnswers] = useState(saved?.answers || {}); const [flags, setFlags] = useState(saved?.flags || {})
  const [idx, setIdx] = useState(0); const [startedAt] = useState(saved?.startedAt || Date.now())
  const [now, setNow] = useState(Date.now()); const [warnings, setWarnings] = useState(saved?.warnings || 0); const [confirm, setConfirm] = useState(false)
  const submitting = useRef(false)
  const qs = useMemo(() => (t ? (t.shuffle ? seededShuffle(t.questions, user.id + t.id) : t.questions) : []), [t, user.id])
  const done = attempts.find((a) => a.testId === id && a.studentId === user.id)

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])
  useEffect(() => { if (t) localStorage.setItem(key, JSON.stringify({ answers, flags, startedAt, warnings })) }, [answers, flags, warnings, t, key, startedAt])
  useEffect(() => {
    const h = () => { if (document.hidden) setWarnings((w) => w + 1) }
    document.addEventListener('visibilitychange', h); return () => document.removeEventListener('visibilitychange', h)
  }, [])
  const left = t ? Math.max(0, t.durationMin * 60 - Math.floor((now - startedAt) / 1000)) : 0
  useEffect(() => { if (t && left === 0 && !done) submit(true) }, [left]) // eslint-disable-line

  async function submit(auto) {
    if (viewAs) { toast('Preview mode: answers are not submitted for the student', 'error'); setConfirm(false); return }
    if (submitting.current || done) return; submitting.current = true
    let score = 0, total = 0, correct = 0, wrong = 0
    t.questions.forEach((q) => { const m = Number(q.marks || 1); total += m; const a = answers[q.id]; if (a == null) return; if (a === q.answer) { score += m; correct++ } else { score -= Number(t.negative || 0); wrong++ } })
    score = Math.max(0, Math.round(score * 100) / 100)
    await db.insert('attempts', { id: `a-${id}-${user.id}`, testId: id, studentId: user.id, answers, score, total, correct, wrong, percent: Math.round((score / total) * 100), submittedAt: new Date().toISOString(), timeTakenSec: Math.floor((Date.now() - startedAt) / 1000), tabSwitches: warnings, autoSubmitted: !!auto })
    localStorage.removeItem(key); toast(auto ? 'Time up — test auto-submitted' : 'Test submitted'); nav(`/portal/tests/${id}/review`, { replace: true })
  }

  if (!t || loadingA) return <div className="text-slate-500">Loading test…</div>
  if (done) return <Navigate2 to={`/portal/tests/${id}/review`} />
  if (t.status !== 'published') return <Empty title="This test is not open" />
  const q = qs[idx]; const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0')
  const answered = Object.keys(answers).length

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 mb-4 sticky top-20 z-10">
        <div><div className="font-semibold">{t.title}</div><div className="text-xs text-slate-500">{answered}/{qs.length} answered{t.negative ? ` · −${t.negative} per wrong` : ''}</div></div>
        <div className={cls('flex items-center gap-2 font-mono text-lg font-bold px-3 py-1.5 rounded-lg', left < 60 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100')}><Clock size={18} />{mm}:{ss}</div>
        <button className="btn-primary" onClick={() => setConfirm(true)}><Send size={15} />Submit</button>
      </div>
      {warnings > 0 && <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 flex gap-2"><AlertTriangle size={16} />You left the test screen {warnings} time(s). This is recorded and visible to your teacher.</div>}
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="card p-6 lg:col-span-3">
          <div className="flex justify-between text-xs text-slate-500 mb-3"><span>Question {idx + 1} of {qs.length}</span><span>{q.marks || 1} mark(s)</span></div>
          <div className="text-base font-medium text-slate-900 whitespace-pre-line">{q.text}</div>
          <div className="mt-5 space-y-2">
            {q.options.map((o, k) => (
              <button key={k} onClick={() => setAnswers({ ...answers, [q.id]: k })} className={cls('w-full text-left flex items-center gap-3 rounded-xl border p-3.5 transition', answers[q.id] === k ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300')}>
                <span className={cls('h-8 w-8 rounded-full grid place-items-center text-xs font-bold shrink-0', answers[q.id] === k ? 'bg-indigo-600 text-white' : 'bg-slate-100')}>{L[k]}</span><span className="text-sm">{o}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-2 mt-6 pt-4 border-t border-slate-100">
            <button className="btn-outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ChevronLeft size={16} />Previous</button>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => { const a = { ...answers }; delete a[q.id]; setAnswers(a) }}>Clear</button>
              <button className={cls('btn-outline', flags[q.id] && 'text-amber-600 border-amber-300')} onClick={() => setFlags({ ...flags, [q.id]: !flags[q.id] })}><Flag size={15} />{flags[q.id] ? 'Flagged' : 'Review later'}</button>
            </div>
            <button className="btn-primary" disabled={idx === qs.length - 1} onClick={() => setIdx(idx + 1)}>Next<ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="card p-4 h-fit">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Question palette</div>
          <div className="grid grid-cols-5 gap-2">
            {qs.map((x, k) => <button key={x.id} onClick={() => setIdx(k)} className={cls('h-9 rounded-lg text-xs font-semibold border', k === idx && 'ring-2 ring-indigo-400', flags[x.id] ? 'bg-amber-100 border-amber-300 text-amber-800' : answers[x.id] != null ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200')}>{k + 1}</button>)}
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-500" />Answered</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-amber-200" />Marked for review</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border" />Not answered</div>
          </div>
        </div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit test?" footer={<><button className="btn-outline" onClick={() => setConfirm(false)}>Continue test</button><button className="btn-primary" onClick={() => submit(false)}>Submit now</button></>}>
        <p className="text-sm">You have answered <b>{answered}</b> of <b>{qs.length}</b> questions{Object.values(flags).filter(Boolean).length ? ` and flagged ${Object.values(flags).filter(Boolean).length}` : ''}. You cannot change answers after submitting.</p>
      </Modal>
    </div>
  )
}
function Navigate2({ to }) { const nav = useNavigate(); useEffect(() => { nav(to, { replace: true }) }, [to, nav]); return null }

// ======================= REVIEW =======================
export function ReviewTest() {
  const { id } = useParams(); const { user } = useAuth(); const { student } = useMyStudent()
  const [tests] = useTable('tests'); const [attempts] = useTable('attempts')
  const t = tests.find((x) => x.id === id); const sid = student?.id || user.id
  const a = attempts.find((x) => x.testId === id && x.studentId === sid)
  if (!t || !a) return <Empty title="Result not available" />
  const all = attempts.filter((x) => x.testId === id).sort((x, y) => y.score - x.score)
  const rank = all.findIndex((x) => x.id === a.id) + 1
  return (
    <>
      <PageHeader title={t.title} subtitle={`Submitted ${fmtDateTime(a.submittedAt)}`} actions={<Link to="/portal/tests" className="btn-outline">← All tests</Link>} />
      <div className="grid sm:grid-cols-4 gap-4 mb-4">
        <Stat icon={Trophy} label="Score" value={`${a.score}/${a.total}`} hint={a.percent + '%'} tone="indigo" />
        <Stat icon={BarChart3} label="Rank" value={`#${rank}`} hint={`of ${all.length}`} tone="amber" />
        <Stat icon={CheckCircle2} label="Correct" value={a.correct ?? '—'} tone="emerald" />
        <Stat icon={Clock} label="Time taken" value={`${Math.floor((a.timeTakenSec || 0) / 60)}m ${(a.timeTakenSec || 0) % 60}s`} tone="sky" />
      </div>
      {t.showAnswers !== false && Object.keys(a.answers || {}).length > 0 && (
        <Card title="Answer review">
          <div className="space-y-4">
            {t.questions.map((q, i) => { const mine = a.answers[q.id]; const ok = mine === q.answer; return (
              <div key={q.id} className={cls('rounded-xl border p-4', mine == null ? 'border-slate-200' : ok ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40')}>
                <div className="flex gap-2 text-sm font-medium">{mine == null ? <span className="text-slate-400 text-xs mt-0.5">SKIP</span> : ok ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <XCircle size={18} className="text-rose-600 shrink-0" />}Q{i + 1}. {q.text}</div>
                <div className="grid sm:grid-cols-2 gap-1.5 mt-3 pl-6 text-sm">{q.options.map((o, k) => <div key={k} className={cls('rounded-md px-2 py-1', k === q.answer && 'bg-emerald-100 text-emerald-800 font-medium', k === mine && k !== q.answer && 'bg-rose-100 text-rose-800 line-through')}>{L[k]}. {o}</div>)}</div>
                {q.explanation && <div className="text-xs text-slate-600 mt-2 pl-6">💡 {q.explanation}</div>}
              </div>
            ) })}
          </div>
        </Card>
      )}
    </>
  )
}

// ======================= RESULTS & ANALYTICS =======================
export function Results() {
  const { user } = useAuth()
  if (user.role === 'student' || user.role === 'parent') return <MyResults />
  return <TestAnalytics />
}

function MyResults() {
  const { user } = useAuth(); const { student } = useMyStudent()
  const [attempts] = useTable('attempts'); const [tests] = useTable('tests')
  if (!student) return <Empty title="No student linked" />
  const my = attempts.filter((a) => a.studentId === student.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const avg = my.length ? Math.round(my.reduce((s, a) => s + a.percent, 0) / my.length) : 0
  const bySub = {}; my.forEach((a) => { const t = tests.find((x) => x.id === a.testId); const k = t?.subject || 'Other'; (bySub[k] ||= []).push(a.percent) })
  return (
    <>
      <PageHeader title="Results" subtitle={student.name} actions={<ChildSwitcher />} />
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <Stat icon={ClipboardList} label="Tests taken" value={my.length} tone="indigo" /><Stat icon={BarChart3} label="Average" value={avg + '%'} tone="emerald" />
        <Stat icon={Trophy} label="Best" value={(my.length ? Math.max(...my.map((a) => a.percent)) : 0) + '%'} tone="amber" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Subject-wise average">
          <div className="space-y-3">{Object.entries(bySub).map(([k, v]) => { const m = Math.round(v.reduce((a, b) => a + b, 0) / v.length); return <div key={k}><div className="flex justify-between text-sm mb-1"><span>{k}</span><b>{m}%</b></div><Progress value={m} tone={m >= 60 ? 'bg-emerald-500' : 'bg-amber-500'} /></div> })}</div>
          {!my.length && <Empty title="No results" />}
        </Card>
        <Card title="All tests" className="lg:col-span-2" bodyClass="p-0">
          <Table rows={my} columns={[
            { label: 'Test', render: (a) => tests.find((t) => t.id === a.testId)?.title },
            { label: 'Score', render: (a) => `${a.score}/${a.total}` },
            { label: '%', render: (a) => <Badge tone={a.percent >= 60 ? 'green' : a.percent >= 35 ? 'amber' : 'red'}>{a.percent}%</Badge> },
            { label: 'Date', render: (a) => fmtDate(a.submittedAt) },
            ...(user.role === 'student' ? [{ label: '', render: (a) => <Link className="text-indigo-600 text-xs font-medium" to={`/portal/tests/${a.testId}/review`}>Review</Link> }] : []),
          ]} />
        </Card>
      </div>
    </>
  )
}

function TestAnalytics() {
  const { user } = useAuth(); const s = useSettings(); const toast = useToast()
  const [tests] = useTable('tests'); const [attempts] = useTable('attempts'); const [users] = useTable('users'); const [batches] = useTable('batches')
  const [params, setParams] = useSearchParams()
  const myBatches = user.role !== 'faculty' ? batches : batches.filter((b) => (b.facultyIds || []).includes(user.id))
  const mine = tests.filter((t) => t.status !== 'draft' && (t.batchIds || []).some((b) => myBatches.some((m) => m.id === b)))
  const tid = params.get('test') || mine[0]?.id
  const t = tests.find((x) => x.id === tid)
  const at = attempts.filter((a) => a.testId === tid).sort((a, b) => b.score - a.score || a.timeTakenSec - b.timeTakenSec)
  const eligible = t ? users.filter((u) => u.role === 'student' && (t.batchIds || []).includes(u.batchId) && u.status !== 'inactive') : []
  const notTaken = eligible.filter((u) => !at.some((a) => a.studentId === u.id))
  const avg = at.length ? Math.round(at.reduce((x, a) => x + a.percent, 0) / at.length) : 0
  const qStats = t ? t.questions.map((q) => { const resp = at.filter((a) => a.answers && a.answers[q.id] != null); const ok = resp.filter((a) => a.answers[q.id] === q.answer).length; return { q, attempted: resp.length, pct: resp.length ? Math.round((ok / resp.length) * 100) : null } }) : []

  async function sendResults(channel) {
    const tpl = TEMPLATES.find((x) => x.key === 'result').text
    const msgs = at.map((a) => { const st = users.find((u) => u.id === a.studentId); return st && { phone: st.parentPhone, name: st.parentName, text: fill(tpl, { student: st.name, score: `${a.score}/${a.total} (${a.percent}%)`, test: t.title, sig: s.smsSignature }) } }).filter(Boolean)
    const r = await dispatch(channel, msgs, { sentBy: user.id, purpose: 'result' })
    if (r.mode === 'app') toast(channel === 'sms' ? `${r.count} result SMS sending from the academy SIM` : `Opening ${r.count} WhatsApp chats one by one`)
  }

  if (!mine.length) return <><PageHeader title="Results & Analytics" /><Card><Empty title="No published tests yet" /></Card></>
  return (
    <>
      <PageHeader title="Results & Analytics" actions={<>
        <select className="input w-auto" value={tid} onChange={(e) => setParams({ test: e.target.value })}>{mine.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
        <button className="btn-outline" onClick={() => downloadCsv(`${t.title}.csv`, at.map((a, i) => { const st = users.find((u) => u.id === a.studentId); return { rank: i + 1, rollNo: st?.rollNo, name: st?.name, score: a.score, total: a.total, percent: a.percent, timeMin: Math.round(a.timeTakenSec / 60), tabSwitches: a.tabSwitches || 0 } }))}>Export</button>
        <button className="btn-outline" onClick={() => sendResults('sms')}><Send size={15} />SMS parents</button>
        <button className="btn-outline text-emerald-700" onClick={() => sendResults('whatsapp')}><MessageCircle size={15} />WhatsApp</button>
      </>} />
      <div className="grid sm:grid-cols-4 gap-4 mb-4">
        <Stat icon={ClipboardList} label="Attempted" value={`${at.length}/${eligible.length}`} tone="indigo" />
        <Stat icon={BarChart3} label="Class average" value={avg + '%'} tone="emerald" />
        <Stat icon={Trophy} label="Highest" value={at[0] ? at[0].percent + '%' : '—'} hint={users.find((u) => u.id === at[0]?.studentId)?.name} tone="amber" />
        <Stat icon={AlertTriangle} label="Below 35%" value={at.filter((a) => a.percent < 35).length} tone="rose" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Leaderboard" className="lg:col-span-2" bodyClass="p-0">
          <Table rows={at} columns={[
            { label: '#', render: (a) => <span className="font-bold text-slate-400">{at.indexOf(a) + 1}</span> },
            { label: 'Student', render: (a) => { const st = users.find((u) => u.id === a.studentId); return <div className="flex items-center gap-2"><Avatar name={st?.name} size="h-7 w-7" /><div><div className="text-sm">{st?.name}</div><div className="text-[11px] text-slate-500">{st?.rollNo}</div></div></div> } },
            { label: 'Score', render: (a) => <b>{a.score}/{a.total}</b> },
            { label: '%', render: (a) => <Badge tone={a.percent >= 60 ? 'green' : a.percent >= 35 ? 'amber' : 'red'}>{a.percent}%</Badge> },
            { label: 'Time', render: (a) => `${Math.round((a.timeTakenSec || 0) / 60)}m` },
            { label: 'Flags', render: (a) => (a.tabSwitches ? <Badge tone="amber">{a.tabSwitches} tab switch</Badge> : a.autoSubmitted ? <Badge>auto</Badge> : '') },
          ]} />
          {notTaken.length > 0 && <div className="p-4 border-t text-xs text-slate-500">Not attempted: {notTaken.map((u) => u.name).join(', ')}</div>}
        </Card>
        <Card title="Question-wise accuracy">
          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {qStats.map(({ q, pct, attempted }, i) => <div key={q.id}><div className="flex justify-between text-xs mb-1"><span className="truncate pr-2">Q{i + 1}. {q.text}</span><b>{pct == null ? '—' : pct + '%'}</b></div><Progress value={pct || 0} tone={pct >= 60 ? 'bg-emerald-500' : 'bg-rose-500'} /><div className="text-[10px] text-slate-400 mt-0.5">{attempted} responses</div></div>)}
            {!qStats.some((x) => x.attempted) && <p className="text-xs text-slate-500">Question-level data appears once students attempt the test online.</p>}
          </div>
        </Card>
      </div>
    </>
  )
}
