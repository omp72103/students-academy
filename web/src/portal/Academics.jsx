import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Check, X, Clock, Send, MessageCircle, CalendarCheck, Save } from 'lucide-react'
import { db, useTable } from '../lib/db'
import { useAuth } from '../lib/auth'
import { PageHeader, Card, Table, Modal, Field, Badge, useToast, Empty, Stat, Avatar } from '../components/ui'
import { inr, fmtDate, today, attendanceSummary, cls, downloadCsv } from '../lib/utils'
import { STANDARDS } from '../data/materials'
import { useMyStudent, ChildSwitcher } from './Layout'
import { isAndroidApp, fill, TEMPLATES, dispatch } from '../lib/messaging'
import { useSettings } from '../site/SiteLayout'

// ======================= BATCHES =======================
export function Batches() {
  const { user } = useAuth(); const isAdmin = user.role === 'admin'
  const [batches] = useTable('batches'); const [users] = useTable('users'); const [edit, setEdit] = useState(null); const toast = useToast()
  const faculty = users.filter((u) => u.role === 'faculty')
  const list = isAdmin ? batches : batches.filter((b) => (b.facultyIds || []).includes(user.id))
  async function save() {
    if (!edit.name) return toast('Batch name required', 'error')
    const row = { ...edit, fee: Number(edit.fee || 0) }
    edit.id ? await db.update('batches', edit.id, row) : await db.insert('batches', row)
    toast('Batch saved'); setEdit(null)
  }
  async function remove(b) {
    if (users.some((u) => u.batchId === b.id && u.status !== 'inactive')) return toast('Move students out of this batch first', 'error')
    if (window.confirm('Delete batch?')) { await db.remove('batches', b.id); toast('Deleted'); setEdit(null) }
  }
  return (
    <>
      <PageHeader title={isAdmin ? 'Batches' : 'My Batches'} subtitle="Each batch has a standard, timing, faculty and default course fee." actions={isAdmin && <button className="btn-primary" onClick={() => setEdit({ facultyIds: [], standard: '10th' })}><Plus size={16} />New batch</button>} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((b) => {
          const st = users.filter((u) => u.role === 'student' && u.batchId === b.id && u.status !== 'inactive')
          return (
            <div key={b.id} className="card p-5">
              <div className="flex justify-between items-start gap-2">
                <div><div className="font-semibold text-slate-900">{b.name}</div><div className="text-xs text-slate-500 mt-0.5">{b.standard} · {b.room}</div></div>
                {isAdmin && <button className="btn-ghost p-1.5" onClick={() => setEdit(b)}><Pencil size={15} /></button>}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 py-2"><div className="text-lg font-bold">{st.length}</div><div className="text-[11px] text-slate-500">Students</div></div>
                <div className="rounded-lg bg-slate-50 py-2 col-span-2"><div className="text-sm font-semibold pt-1 flex items-center justify-center gap-1"><Clock size={13} />{b.timing}</div><div className="text-[11px] text-slate-500">Timing</div></div>
              </div>
              <div className="mt-3 text-xs text-slate-600">Faculty: {(b.facultyIds || []).map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(', ') || '—'}</div>
              {isAdmin && <div className="mt-1 text-xs text-slate-600">Course fee: {inr(b.fee)}</div>}
            </div>
          )
        })}
      </div>
      {!list.length && <Card><Empty title="No batches" /></Card>}
      {edit && <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Edit batch' : 'New batch'} footer={<>{edit.id && <button className="btn-outline text-rose-600 mr-auto" onClick={() => remove(edit)}><Trash2 size={15} />Delete</button>}<button className="btn-outline" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Batch name" className="sm:col-span-2"><input className="input" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="10th SSC — Batch A (Morning)" /></Field>
          <Field label="Standard / Course"><select className="input" value={edit.standard} onChange={(e) => setEdit({ ...edit, standard: e.target.value })}>{STANDARDS.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Timing"><input className="input" value={edit.timing || ''} onChange={(e) => setEdit({ ...edit, timing: e.target.value })} placeholder="5:00 PM – 8:00 PM" /></Field>
          <Field label="Room"><input className="input" value={edit.room || ''} onChange={(e) => setEdit({ ...edit, room: e.target.value })} /></Field>
          <Field label="Course fee (₹)"><input type="number" className="input" value={edit.fee || ''} onChange={(e) => setEdit({ ...edit, fee: e.target.value })} /></Field>
          <Field label="Faculty" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">{faculty.map((f) => { const on = (edit.facultyIds || []).includes(f.id); return (
              <button type="button" key={f.id} onClick={() => setEdit({ ...edit, facultyIds: on ? edit.facultyIds.filter((x) => x !== f.id) : [...(edit.facultyIds || []), f.id] })} className={cls('btn-sm btn border', on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300')}>{f.name}</button>
            ) })}</div>
          </Field>
        </div>
      </Modal>}
    </>
  )
}

// ======================= TIMETABLE =======================
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export function Timetable() {
  const { user } = useAuth(); const { student } = useMyStudent()
  const [tt] = useTable('timetable'); const [batches] = useTable('batches'); const [users] = useTable('users')
  const editable = user.role === 'admin'
  const visibleBatches = user.role === 'admin' ? batches : user.role === 'faculty' ? batches.filter((b) => (b.facultyIds || []).includes(user.id)) : batches.filter((b) => b.id === student?.batchId)
  const [batch, setBatch] = useState('')
  const sel = batch || visibleBatches[0]?.id
  const [edit, setEdit] = useState(null); const toast = useToast()
  const rows = tt.filter((t) => t.batchId === sel)
  async function save() {
    edit.id ? await db.update('timetable', edit.id, edit) : await db.insert('timetable', { ...edit, batchId: sel })
    toast('Saved'); setEdit(null)
  }
  return (
    <>
      <PageHeader title="Timetable" subtitle="Weekly lecture schedule" actions={<>
        {user.role === 'parent' && <ChildSwitcher />}
        {visibleBatches.length > 1 && <select className="input w-auto" value={sel} onChange={(e) => setBatch(e.target.value)}>{visibleBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
        {editable && <button className="btn-primary" onClick={() => setEdit({ day: 'Mon', start: '09:00', end: '10:00', facultyId: users.find((u) => u.role === 'faculty')?.id })}><Plus size={16} />Add lecture</button>}
      </>} />
      <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-3">
        {DAYS.slice(0, 6).map((d) => (
          <div key={d} className={cls('card p-3', new Date().toLocaleString('en', { weekday: 'short' }) === d && 'ring-2 ring-indigo-400')}>
            <div className="text-xs font-bold uppercase text-slate-500 mb-2">{d}</div>
            <div className="space-y-2">
              {rows.filter((r) => r.day === d).sort((a, b) => a.start.localeCompare(b.start)).map((r) => (
                <button key={r.id} disabled={!editable} onClick={() => setEdit(r)} className="w-full text-left rounded-lg bg-indigo-50 border border-indigo-100 p-2.5 disabled:cursor-default">
                  <div className="text-[11px] font-semibold text-indigo-700">{r.start} – {r.end}</div>
                  <div className="text-sm font-medium mt-0.5">{r.subject}</div>
                  <div className="text-[11px] text-slate-500">{users.find((u) => u.id === r.facultyId)?.name}</div>
                </button>
              ))}
              {!rows.some((r) => r.day === d) && <div className="text-xs text-slate-400 py-4 text-center">—</div>}
            </div>
          </div>
        ))}
      </div>
      {edit && <Modal open onClose={() => setEdit(null)} title="Lecture" footer={<>{edit.id && <button className="btn-outline text-rose-600 mr-auto" onClick={async () => { await db.remove('timetable', edit.id); setEdit(null) }}><Trash2 size={15} /></button>}<button className="btn-primary" onClick={save}>Save</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Day"><select className="input" value={edit.day} onChange={(e) => setEdit({ ...edit, day: e.target.value })}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Subject"><input className="input" value={edit.subject || ''} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} /></Field>
          <Field label="Start"><input type="time" className="input" value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} /></Field>
          <Field label="End"><input type="time" className="input" value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} /></Field>
          <Field label="Faculty" className="col-span-2"><select className="input" value={edit.facultyId} onChange={(e) => setEdit({ ...edit, facultyId: e.target.value })}>{users.filter((u) => u.role === 'faculty').map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></Field>
        </div>
      </Modal>}
    </>
  )
}

// ======================= ATTENDANCE =======================
export function Attendance() {
  const { user } = useAuth()
  if (user.role === 'student' || user.role === 'parent') return <MyAttendance />
  return <MarkAttendance />
}

function MarkAttendance() {
  const { user } = useAuth(); const s = useSettings()
  const [batches] = useTable('batches'); const [users] = useTable('users'); const [att] = useTable('attendance')
  const [params] = useSearchParams(); const toast = useToast()
  const mine = user.role === 'admin' ? batches : batches.filter((b) => (b.facultyIds || []).includes(user.id))
  const [batchId, setBatchId] = useState(params.get('batch') || '')
  const [date, setDate] = useState(today())
  const bid = batchId || mine[0]?.id
  const students = users.filter((u) => u.role === 'student' && u.batchId === bid && u.status !== 'inactive').sort((a, b) => a.name.localeCompare(b.name))
  const recId = `att-${bid}-${date}`
  const existing = att.find((a) => a.id === recId || (a.batchId === bid && a.date === date))
  const [rec, setRec] = useState({})
  const [saved, setSaved] = useState(false)
  useEffect(() => { setRec(existing?.records || Object.fromEntries(students.map((x) => [x.id, 'P']))); setSaved(!!existing) }, [bid, date, existing?.id, students.length]) // eslint-disable-line

  const counts = { P: 0, A: 0, L: 0 }; Object.values(rec).forEach((v) => counts[v]++)
  async function save() {
    const row = { id: existing?.id || recId, batchId: bid, date, records: rec, markedBy: user.id }
    existing ? await db.update('attendance', row.id, row) : await db.insert('attendance', row)
    setSaved(true); toast('Attendance saved')
    if (s.autoAbsentSms && isAndroidApp() && absentees.length) await notifyAbsent('sms')
  }
  const batch = batches.find((b) => b.id === bid)
  const absentees = students.filter((x) => rec[x.id] === 'A')
  async function notifyAbsent(channel) {
    const tpl = TEMPLATES.find((t) => t.key === 'absent').text
    const msgs = absentees.map((st) => ({ phone: st.parentPhone, name: st.parentName, text: fill(tpl, { student: st.name, batch: batch?.name, date: fmtDate(date), sig: s.smsSignature }) }))
    const r = await dispatch(channel, msgs, { sentBy: user.id, purpose: 'absent' })
    if (r.mode === 'app') toast(channel === 'sms' ? `${r.count} SMS sending from the academy SIM` : `Opening ${r.count} WhatsApp chats one by one`)
  }

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark daily attendance and notify parents of absentees" actions={<button className="btn-outline" onClick={() => downloadCsv(`attendance-${bid}.csv`, att.filter((a) => a.batchId === bid).flatMap((a) => Object.entries(a.records).map(([sid, v]) => ({ date: a.date, rollNo: users.find((u) => u.id === sid)?.rollNo, name: users.find((u) => u.id === sid)?.name, status: v }))))}>Export</button>} />
      <Card bodyClass="p-0">
        <div className="flex flex-wrap items-end gap-3 p-4 border-b border-slate-100">
          <Field label="Batch"><select className="input w-auto" value={bid} onChange={(e) => setBatchId(e.target.value)}>{mine.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
          <Field label="Date"><input type="date" className="input w-auto" value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></Field>
          <div className="flex gap-2 ml-auto text-sm">
            <Badge tone="green">P {counts.P}</Badge><Badge tone="red">A {counts.A}</Badge><Badge tone="amber">L {counts.L}</Badge>
          </div>
        </div>
        <div className="p-4 flex flex-wrap gap-2 border-b border-slate-100">
          <button className="btn-outline btn-sm" onClick={() => setRec(Object.fromEntries(students.map((x) => [x.id, 'P'])))}>Mark all present</button>
          <button className="btn-outline btn-sm" onClick={() => setRec(Object.fromEntries(students.map((x) => [x.id, 'A'])))}>Mark all absent</button>
          {existing && <span className="text-xs text-slate-500 self-center">Last saved {fmtDate(existing.updatedAt || existing.createdAt)}</span>}
        </div>
        <div className="divide-y divide-slate-100">
          {students.map((st, i) => (
            <div key={st.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-xs text-slate-400 w-6">{i + 1}</span><Avatar name={st.name} size="h-8 w-8" />
              <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{st.name}</div><div className="text-xs text-slate-500">{st.rollNo}</div></div>
              <div className="flex gap-1">
                {[['P', 'bg-emerald-600'], ['A', 'bg-rose-600'], ['L', 'bg-amber-500']].map(([v, c]) => (
                  <button key={v} onClick={() => { setRec({ ...rec, [st.id]: v }); setSaved(false) }} className={cls('h-9 w-9 rounded-lg text-sm font-bold border', rec[st.id] === v ? `${c} text-white border-transparent` : 'bg-white text-slate-500 border-slate-200')}>{v}</button>
                ))}
              </div>
            </div>
          ))}
          {!students.length && <Empty title="No students in this batch" />}
        </div>
        <div className="p-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end bg-slate-50 rounded-b-xl">
          {saved && absentees.length > 0 && <>
            <button className="btn-outline" onClick={() => notifyAbsent('sms')}><Send size={15} />SMS {absentees.length} parent(s)</button>
            <button className="btn-outline text-emerald-700" onClick={() => notifyAbsent('whatsapp')}><MessageCircle size={15} />WhatsApp</button>
          </>}
          <button className="btn-primary" onClick={save} disabled={!students.length}><Save size={15} />{existing ? 'Update' : 'Save'} attendance</button>
        </div>
      </Card>
    </>
  )
}

function MyAttendance() {
  const { student } = useMyStudent(); const [att] = useTable('attendance')
  if (!student) return <Empty title="No student linked" />
  const recs = att.filter((a) => a.batchId === student.batchId && a.records?.[student.id]).sort((a, b) => b.date.localeCompare(a.date))
  const sum = attendanceSummary(student.id, recs)
  return (
    <>
      <PageHeader title="Attendance" subtitle={student.name} actions={<ChildSwitcher />} />
      <div className="grid sm:grid-cols-4 gap-4 mb-4">
        <Stat icon={CalendarCheck} label="Overall" value={sum.pct + '%'} tone={sum.pct >= 75 ? 'emerald' : 'rose'} />
        <Stat icon={Check} label="Present" value={sum.p} tone="emerald" /><Stat icon={X} label="Absent" value={sum.a} tone="rose" /><Stat icon={Clock} label="Late" value={sum.l} tone="amber" />
      </div>
      <Card title="Day-wise record">
        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-10 gap-2">
          {recs.map((r) => { const v = r.records[student.id]; return (
            <div key={r.id} className={cls('rounded-lg p-2 text-center border', v === 'P' ? 'bg-emerald-50 border-emerald-100' : v === 'A' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100')}>
              <div className="text-[10px] text-slate-500">{new Date(r.date).toLocaleString('en', { weekday: 'short' })}</div>
              <div className="text-sm font-bold">{new Date(r.date).getDate()}</div>
              <div className={cls('text-xs font-bold', v === 'P' ? 'text-emerald-700' : v === 'A' ? 'text-rose-700' : 'text-amber-700')}>{v}</div>
            </div>
          ) })}
        </div>
        {!recs.length && <Empty title="No attendance records yet" />}
      </Card>
    </>
  )
}
