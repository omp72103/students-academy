import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Upload, Download, Pencil, MessageCircle, Phone, Trash2, Eye, KeyRound, GraduationCap, Wallet, CalendarX, UserPlus } from 'lucide-react'
import { db, useTable, uid, MODE } from '../lib/db'
import { useAuth, createLogin } from '../lib/auth'
import { PageHeader, Card, Table, Modal, Field, SearchBox, Badge, Avatar, useToast, Tabs, Stat } from '../components/ui'
import { inr, fmtDate, feeSummary, attendanceSummary, downloadCsv, parseCsv, today } from '../lib/utils'
import { openWhatsApp, sendSms, fill, TEMPLATES } from '../lib/messaging'
import { useSettings } from '../site/SiteLayout'

const genPw = () => Math.random().toString(36).slice(2, 8) + Math.floor(Math.random() * 90 + 10)

// ======================= STUDENTS =======================
export function Students() {
  const { user } = useAuth()
  const isAdmin = user.role === 'admin'
  const [users] = useTable('users'); const [batches] = useTable('batches'); const [fees] = useTable('fees'); const [att] = useTable('attendance')
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(''); const [batch, setBatch] = useState(''); const [status, setStatus] = useState('active')
  const [edit, setEdit] = useState(null); const [view, setView] = useState(null)
  const fileRef = useRef(); const toast = useToast(); const s = useSettings()
  useEffect(() => { if (params.get('new') && isAdmin) { setEdit({}); setParams({}) } }, [params, isAdmin, setParams])

  const myBatchIds = isAdmin ? batches.map((b) => b.id) : batches.filter((b) => (b.facultyIds || []).includes(user.id)).map((b) => b.id)
  const list = users.filter((u) => u.role === 'student' && myBatchIds.includes(u.batchId))
    .filter((u) => (!batch || u.batchId === batch) && (status === 'all' || (u.status || 'active') === status))
    .filter((u) => !q || (u.name + u.rollNo + u.phone + u.parentPhone).toLowerCase().includes(q.toLowerCase()))

  async function importCsv(e) {
    const file = e.target.files[0]; if (!file) return
    const rows = parseCsv(await file.text()); let n = 0
    for (const r of rows) {
      if (!r.name) continue
      const b = batches.find((x) => x.name === r.batch || x.id === r.batch)
      await saveStudent({ name: r.name, phone: r.phone, email: r.email, parentName: r.parentName, parentPhone: r.parentPhone, batchId: b?.id || batches[0]?.id, school: r.school, feeTotal: Number(r.feeTotal) || b?.fee || 0 }, users, batches); n++
    }
    toast(`${n} students imported`); e.target.value = ''
  }

  const cols = [
    { label: 'Student', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.name} size="h-8 w-8" /><div><div className="font-medium text-slate-900">{r.name}</div><div className="text-xs text-slate-500">{r.rollNo}</div></div></div> },
    { label: 'Batch', render: (r) => <span className="text-xs">{batches.find((b) => b.id === r.batchId)?.name || '—'}</span> },
    { label: 'Parent', render: (r) => <div className="text-xs"><div>{r.parentName}</div><div className="text-slate-500">{r.parentPhone}</div></div> },
    { label: 'Attendance', render: (r) => { const a = attendanceSummary(r.id, att); return <Badge tone={a.pct >= 75 ? 'green' : 'red'}>{a.pct}%</Badge> } },
    ...(isAdmin ? [{ label: 'Fee balance', render: (r) => { const f = feeSummary(r, fees); return <span className={f.balance ? 'text-rose-600 font-semibold' : 'text-emerald-600'}>{f.balance ? inr(f.balance) : 'Paid'}</span> } }] : []),
    { label: '', className: 'text-right', render: (r) => (
      <div className="flex justify-end gap-1">
        <button className="btn-ghost p-1.5" title="View" onClick={() => setView(r)}><Eye size={16} /></button>
        <button className="btn-ghost p-1.5 text-emerald-600" title="WhatsApp parent" onClick={() => openWhatsApp(r.parentPhone, `Dear Parent, `)}><MessageCircle size={16} /></button>
        {isAdmin && <button className="btn-ghost p-1.5" title="Edit" onClick={() => setEdit(r)}><Pencil size={16} /></button>}
      </div>) },
  ]

  return (
    <>
      <PageHeader title="Students" subtitle={`${list.length} students`} actions={isAdmin && <>
        <input ref={fileRef} type="file" accept=".csv" hidden onChange={importCsv} />
        <button className="btn-outline" onClick={() => fileRef.current.click()}><Upload size={16} />Import CSV</button>
        <button className="btn-outline" onClick={() => downloadCsv('students.csv', list.map((r) => ({ rollNo: r.rollNo, name: r.name, batch: batches.find((b) => b.id === r.batchId)?.name, phone: r.phone, email: r.email, parentName: r.parentName, parentPhone: r.parentPhone, school: r.school, admissionDate: r.admissionDate, feeTotal: r.feeTotal, ...feeSummary(r, fees) })))}><Download size={16} />Export</button>
        <button className="btn-primary" onClick={() => setEdit({})}><Plus size={16} />New Admission</button>
      </>} />
      {(() => {
        const all = users.filter((u) => u.role === 'student' && myBatchIds.includes(u.batchId) && u.status !== 'inactive')
        const dues = all.filter((u) => feeSummary(u, fees).balance > 0).length
        const lowAtt = all.filter((u) => { const a = attendanceSummary(u.id, att); return a.total && a.pct < 75 }).length
        const month = today().slice(0, 7); const fresh = all.filter((u) => (u.admissionDate || '').startsWith(month)).length
        return (
          <div className="mb-5 grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Stat index={0} tone="indigo" icon={GraduationCap} label="Active students" value={all.length} progress={100} hint={`${batches.filter((b) => myBatchIds.includes(b.id)).length} batches`} />
            {isAdmin && <Stat index={1} tone="rose" icon={Wallet} label="Fee pending" value={dues} progress={all.length ? ((all.length - dues) / all.length) * 100 : 100} hint={`${all.length - dues} fully paid`} to="/portal/fees" />}
            <Stat index={2} tone="amber" icon={CalendarX} label="Attendance < 75%" value={lowAtt} progress={all.length ? ((all.length - lowAtt) / all.length) * 100 : 100} hint="Needs follow-up" to="/portal/messaging?audience=low-att" />
            <Stat index={3} tone="emerald" icon={UserPlus} label="New this month" value={fresh} progress={all.length ? (fresh / all.length) * 100 : 0} hint={new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })} />
          </div>
        )
      })()}
      <Card bodyClass="p-0">
        <div className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
          <SearchBox value={q} onChange={setQ} placeholder="Search name, roll no, phone" />
          <select className="input w-auto" value={batch} onChange={(e) => setBatch(e.target.value)}><option value="">All batches</option>{batches.filter((b) => myBatchIds.includes(b.id)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive / Left</option><option value="all">All</option></select>
        </div>
        <Table columns={cols} rows={list} empty={{ title: 'No students found' }} />
      </Card>
      {edit && <StudentForm initial={edit} batches={batches} users={users} onClose={() => setEdit(null)} toast={toast} settings={s} />}
      {view && <StudentProfile student={view} onClose={() => setView(null)} batches={batches} fees={fees} att={att} />}
    </>
  )
}

async function saveStudent(f, users, batches) {
  const b = batches.find((x) => x.id === f.batchId)
  const count = users.filter((u) => u.role === 'student').length
  const id = f.id || uid('st')
  const student = {
    ...f, id, role: 'student', standard: b?.standard || f.standard,
    rollNo: f.rollNo || `SA${new Date().getFullYear().toString().slice(2)}-${String(count + 1).padStart(3, '0')}`,
    email: (f.email || `${f.name.split(' ')[0].toLowerCase()}${count + 1}@student.sa`).toLowerCase(),
    password: f.password || genPw(), status: f.status || 'active', admissionDate: f.admissionDate || today(),
    feeTotal: Number(f.feeTotal ?? b?.fee ?? 0), discount: Number(f.discount || 0),
  }
  if (f.id) await db.update('users', id, student)
  else { await db.insert('users', student); await createLogin(student.email, student.password).catch(() => {}) }
  // ensure parent account exists & is linked
  if (student.parentPhone) {
    const existing = users.find((u) => u.role === 'parent' && u.phone === student.parentPhone)
    if (existing) { if (!(existing.childIds || []).includes(id)) await db.update('users', existing.id, { childIds: [...(existing.childIds || []), id] }) }
    else if (!f.id) {
      const parent = { role: 'parent', name: student.parentName || 'Parent of ' + student.name, phone: student.parentPhone, email: `${student.parentPhone}@parent.sa`, password: genPw(), childIds: [id] }
      await db.insert('users', parent); await createLogin(parent.email, parent.password).catch(() => {})
      return { student, parent }
    }
  }
  return { student }
}

function StudentForm({ initial, batches, users, onClose, toast, settings }) {
  const [f, setF] = useState({ batchId: batches[0]?.id, feeTotal: initial.id ? undefined : batches[0]?.fee, ...initial })
  const [busy, setBusy] = useState(false); const [created, setCreated] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try { const r = await saveStudent(f, users, batches); toast(initial.id ? 'Student updated' : 'Admission saved'); initial.id ? onClose() : setCreated(r) }
    catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }
  async function remove() { if (!window.confirm('Mark this student as Left / Inactive?')) return; await db.update('users', f.id, { status: 'inactive' }); toast('Student marked inactive'); onClose() }

  if (created) {
    const { student, parent } = created
    const msg = fill(TEMPLATES.find((t) => t.key === 'welcome').text, { student: student.name, roll: student.rollNo, email: student.email, sig: settings.smsSignature }) + ` Password: ${student.password}`
    return (
      <Modal open onClose={onClose} title="Admission confirmed" footer={<button className="btn-primary" onClick={onClose}>Done</button>}>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4"><b>{student.name}</b> admitted · Roll no. <b>{student.rollNo}</b></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3"><div className="text-xs text-slate-500">Student login</div><div className="font-mono text-xs mt-1">{student.email}<br />{student.password}</div></div>
            {parent && <div className="rounded-lg border p-3"><div className="text-xs text-slate-500">Parent login</div><div className="font-mono text-xs mt-1">{parent.email}<br />{parent.password}</div></div>}
          </div>
          <div className="flex gap-2">
            <button className="btn-outline flex-1" onClick={() => openWhatsApp(student.parentPhone || student.phone, msg + (parent ? `\nParent login: ${parent.email} / ${parent.password}` : ''))}><MessageCircle size={16} />WhatsApp credentials</button>
            <button className="btn-outline flex-1" onClick={() => sendSms(student.parentPhone || student.phone, msg)}><Phone size={16} />SMS</button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} wide title={initial.id ? 'Edit student' : 'New admission'} footer={<>
      {initial.id && <button type="button" className="btn-outline text-rose-600 mr-auto" onClick={remove}><Trash2 size={15} />Mark as left</button>}
      <button className="btn-outline" onClick={onClose}>Cancel</button><button form="sf" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save'}</button></>}>
      <form id="sf" onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 text-xs font-semibold uppercase text-slate-500">Student details</div>
        <Field label="Full name *"><input required className="input" value={f.name || ''} onChange={set('name')} /></Field>
        <Field label="Batch *"><select required className="input" value={f.batchId} onChange={(e) => { const b = batches.find((x) => x.id === e.target.value); setF({ ...f, batchId: e.target.value, feeTotal: f.id ? f.feeTotal : b?.fee }) }}>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        <Field label="Student mobile"><input className="input" value={f.phone || ''} onChange={set('phone')} /></Field>
        <Field label="Email (login)"><input type="email" className="input" value={f.email || ''} onChange={set('email')} placeholder="auto-generated if blank" /></Field>
        <Field label="Date of birth"><input type="date" className="input" value={f.dob || ''} onChange={set('dob')} /></Field>
        <Field label="School / College"><input className="input" value={f.school || ''} onChange={set('school')} /></Field>
        <div className="sm:col-span-2 text-xs font-semibold uppercase text-slate-500 pt-2">Parent / Guardian</div>
        <Field label="Parent name"><input className="input" value={f.parentName || ''} onChange={set('parentName')} /></Field>
        <Field label="Parent mobile * (SMS/WhatsApp)"><input required className="input" value={f.parentPhone || ''} onChange={set('parentPhone')} /></Field>
        <div className="sm:col-span-2 text-xs font-semibold uppercase text-slate-500 pt-2">Fees & account</div>
        <Field label="Total course fee (₹)"><input type="number" className="input" value={f.feeTotal ?? ''} onChange={set('feeTotal')} /></Field>
        <Field label="Discount / concession (₹)"><input type="number" className="input" value={f.discount ?? ''} onChange={set('discount')} /></Field>
        <Field label="Admission date"><input type="date" className="input" value={f.admissionDate || today()} onChange={set('admissionDate')} /></Field>
        {MODE === 'demo' && <Field label="Password"><input className="input" value={f.password || ''} onChange={set('password')} placeholder="auto-generated if blank" /></Field>}
      </form>
    </Modal>
  )
}

function StudentProfile({ student: s, onClose, batches, fees, att }) {
  const [attempts] = useTable('attempts'); const [tests] = useTable('tests')
  const [tab, setTab] = useState('overview')
  const a = attendanceSummary(s.id, att); const f = feeSummary(s, fees)
  const my = attempts.filter((x) => x.studentId === s.id)
  return (
    <Modal open onClose={onClose} wide title={s.name}>
      <div className="flex items-center gap-4 mb-5"><Avatar name={s.name} size="h-14 w-14" /><div><div className="font-semibold text-lg">{s.name}</div><div className="text-sm text-slate-500">{s.rollNo} · {batches.find((b) => b.id === s.batchId)?.name}</div></div></div>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'overview', label: 'Overview' }, { value: 'tests', label: 'Tests' }, { value: 'fees', label: 'Fees' }]} />
      <div className="mt-4">
        {tab === 'overview' && <div className="grid sm:grid-cols-3 gap-3">
          <Stat label="Attendance" value={a.pct + '%'} hint={`${a.p}P · ${a.a}A · ${a.l}L`} tone="sky" />
          <Stat label="Avg score" value={(my.length ? Math.round(my.reduce((x, y) => x + y.percent, 0) / my.length) : 0) + '%'} hint={`${my.length} tests`} tone="indigo" />
          <Stat label="Fee balance" value={inr(f.balance)} hint={`Paid ${inr(f.paid)}`} tone="amber" />
          <div className="sm:col-span-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-2">
            {[['Mobile', s.phone], ['Email', s.email], ['Parent', s.parentName], ['Parent mobile', s.parentPhone], ['School', s.school], ['DOB', fmtDate(s.dob)], ['Admitted', fmtDate(s.admissionDate)], ['Status', s.status || 'active']].map(([k, v]) => <div key={k} className="flex justify-between border-b border-slate-100 py-1.5"><span className="text-slate-500">{k}</span><span>{v || '—'}</span></div>)}
          </div>
        </div>}
        {tab === 'tests' && <Table columns={[{ label: 'Test', render: (r) => tests.find((t) => t.id === r.testId)?.title }, { label: 'Score', render: (r) => `${r.score}/${r.total}` }, { label: '%', render: (r) => <Badge tone={r.percent >= 60 ? 'green' : 'amber'}>{r.percent}%</Badge> }, { label: 'Date', render: (r) => fmtDate(r.submittedAt) }]} rows={my} />}
        {tab === 'fees' && <Table columns={[{ label: 'Receipt', key: 'receiptNo' }, { label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'Mode', key: 'mode' }, { label: 'Amount', render: (r) => inr(r.amount) }]} rows={fees.filter((x) => x.studentId === s.id)} />}
      </div>
    </Modal>
  )
}

// ======================= PARENTS =======================
export function Parents() {
  const [users] = useTable('users'); const [q, setQ] = useState(''); const [edit, setEdit] = useState(null); const toast = useToast()
  const students = users.filter((u) => u.role === 'student')
  const list = users.filter((u) => u.role === 'parent' && (!q || (u.name + u.phone).toLowerCase().includes(q.toLowerCase())))
  return (
    <>
      <PageHeader title="Parents" subtitle="Parent accounts are created automatically during admission. Link siblings here." actions={<button className="btn-primary" onClick={() => setEdit({ childIds: [] })}><Plus size={16} />Add parent</button>} />
      <Card bodyClass="p-0">
        <div className="p-4 border-b border-slate-100"><SearchBox value={q} onChange={setQ} /></div>
        <Table rows={list} columns={[
          { label: 'Parent', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.name} size="h-8 w-8" /><div><div className="font-medium">{r.name}</div><div className="text-xs text-slate-500">{r.email}</div></div></div> },
          { label: 'Mobile', key: 'phone' },
          { label: 'Children', render: (r) => (r.childIds || []).map((id) => students.find((s) => s.id === id)?.name).filter(Boolean).join(', ') || '—' },
          { label: '', className: 'text-right', render: (r) => <div className="flex justify-end gap-1"><button className="btn-ghost p-1.5 text-emerald-600" onClick={() => openWhatsApp(r.phone, 'Dear Parent, ')}><MessageCircle size={16} /></button><button className="btn-ghost p-1.5" onClick={() => setEdit(r)}><Pencil size={16} /></button></div> },
        ]} />
      </Card>
      {edit && <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Edit parent' : 'Add parent'} footer={<button className="btn-primary" onClick={async () => {
        const p = { ...edit, role: 'parent', email: edit.email || `${edit.phone}@parent.sa`, password: edit.password || genPw() }
        if (edit.id) await db.update('users', edit.id, p); else { await db.insert('users', p); await createLogin(p.email, p.password).catch(() => {}) }
        toast('Saved'); setEdit(null)
      }}>Save</button>}>
        <div className="space-y-4">
          <Field label="Name"><input className="input" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Mobile"><input className="input" value={edit.phone || ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
          <Field label="Email (login)"><input className="input" value={edit.email || ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
          {MODE === 'demo' && <Field label="Password"><input className="input" value={edit.password || ''} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></Field>}
          <Field label="Children"><select multiple className="input h-40" value={edit.childIds || []} onChange={(e) => setEdit({ ...edit, childIds: [...e.target.selectedOptions].map((o) => o.value) })}>{students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>)}</select></Field>
        </div>
      </Modal>}
    </>
  )
}

// ======================= FACULTY & STAFF =======================
export function Faculty() {
  const [users] = useTable('users'); const [batches] = useTable('batches'); const [edit, setEdit] = useState(null); const [tab, setTab] = useState('faculty'); const toast = useToast()
  const list = users.filter((u) => u.role === tab)
  async function save() {
    const u = { ...edit, role: edit.role || tab, subjects: typeof edit.subjects === 'string' ? edit.subjects.split(',').map((x) => x.trim()).filter(Boolean) : edit.subjects || [], password: edit.password || genPw() }
    if (!u.email) return toast('Email is required', 'error')
    if (edit.id) await db.update('users', edit.id, u); else { await db.insert('users', u); await createLogin(u.email, u.password).catch((e) => toast(e.message, 'error')) }
    toast('Saved'); setEdit(null)
  }
  return (
    <>
      <PageHeader title="Faculty & Staff" subtitle="Faculty manage their batches, attendance, tests and content. Management has full access." actions={<button className="btn-primary" onClick={() => setEdit({ role: tab })}><Plus size={16} />Add {tab === 'admin' ? 'staff' : 'faculty'}</button>} />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ value: 'faculty', label: 'Faculty' }, { value: 'admin', label: 'Management & Office' }]} /></div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((u) => (
          <div key={u.id} className="card p-5">
            <div className="flex items-start gap-3"><Avatar name={u.name} size="h-11 w-11" /><div className="flex-1 min-w-0"><div className="font-semibold">{u.name}</div><div className="text-xs text-slate-500">{u.designation}</div></div>
              <button className="btn-ghost p-1.5" onClick={() => setEdit({ ...u, subjects: (u.subjects || []).join(', ') })}><Pencil size={15} /></button></div>
            <div className="mt-4 space-y-1.5 text-sm text-slate-600"><div>{u.email}</div><div>{u.phone}</div></div>
            {tab === 'faculty' && <>
              <div className="flex flex-wrap gap-1 mt-3">{(u.subjects || []).map((s) => <Badge key={s} tone="indigo">{s}</Badge>)}</div>
              <div className="text-xs text-slate-500 mt-3">Batches: {batches.filter((b) => (b.facultyIds || []).includes(u.id)).map((b) => b.name).join(', ') || '—'}</div>
            </>}
          </div>
        ))}
      </div>
      {edit && <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Edit' : 'Add'} footer={<><button className="btn-outline" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name"><input className="input" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Designation"><input className="input" value={edit.designation || ''} onChange={(e) => setEdit({ ...edit, designation: e.target.value })} /></Field>
          <Field label="Email (login) *"><input className="input" value={edit.email || ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
          <Field label="Mobile"><input className="input" value={edit.phone || ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
          <Field label="Role"><select className="input" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}><option value="faculty">Faculty</option><option value="admin">Management / Office</option></select></Field>
          <Field label={edit.id ? 'New password (optional)' : 'Password'}><div className="flex gap-2"><input className="input" value={edit.password || ''} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /><button type="button" className="btn-outline px-2" onClick={() => setEdit({ ...edit, password: genPw() })}><KeyRound size={15} /></button></div></Field>
          {edit.role === 'faculty' && <Field label="Subjects (comma separated)" className="sm:col-span-2"><input className="input" value={edit.subjects || ''} onChange={(e) => setEdit({ ...edit, subjects: e.target.value })} /></Field>}
        </div>
        {MODE === 'supabase' && edit.id && <p className="text-xs text-slate-500 mt-3">Password changes for existing accounts are done from Supabase Auth (or the user's "forgot password").</p>}
      </Modal>}
    </>
  )
}
