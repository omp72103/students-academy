import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, FileText, Download, Pencil, Trash2, Globe, Lock, Upload, ExternalLink, CheckCircle2, Search, CirclePlay } from 'lucide-react'
import { db, useTable, MODE, supabase, BUCKET } from '../lib/db'
import { useAuth, canManage } from '../lib/auth'
import { PageHeader, Card, Table, Modal, Field, Badge, useToast, Empty, Tabs } from '../components/ui'
import { fmtDate, today, cls } from '../lib/utils'
import { STANDARDS, MATERIAL_TYPES } from '../data/materials'
import { useMyStudent, ChildSwitcher } from './Layout'

export async function uploadFile(file, folder = 'materials') {
  if (MODE === 'supabase') {
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (error) throw error
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }
  if (file.size > 1.5 * 1024 * 1024) throw new Error('Demo mode stores files in the browser (max 1.5 MB). Connect Supabase for real uploads, or paste a link.')
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file) })
}

// ======================= STUDY MATERIAL =======================
export function Materials() {
  const { user } = useAuth(); const { student } = useMyStudent()
  const manage = canManage(user, 'materials')
  const [materials] = useTable('materials'); const [batches] = useTable('batches')
  const [params, setParams] = useSearchParams(); const toast = useToast()
  const [std, setStd] = useState(student?.standard || ''); const [q, setQ] = useState(''); const [type, setType] = useState('')
  const [edit, setEdit] = useState(null)
  useEffect(() => { if (params.get('new') && manage) { setEdit({ standard: '10th', type: 'notes', visibility: 'batch', batchIds: [] }); setParams({}) } }, [params, manage, setParams])
  useEffect(() => { if (student && !std) setStd(student.standard) }, [student, std])

  const visible = materials.filter((m) => manage || m.visibility === 'public' || (m.batchIds || []).includes(student?.batchId))
  const list = visible.filter((m) => (!std || m.standard === std) && (!type || m.type === type) && (!q || (m.title + m.subject + m.chapter).toLowerCase().includes(q.toLowerCase())))
  const bySubject = list.reduce((a, m) => { (a[m.subject] ||= []).push(m); return a }, {})

  async function save() {
    if (!edit.title || !edit.url) return toast('Title and file/link are required', 'error')
    const row = { ...edit, uploadedBy: edit.uploadedBy || user.name }
    edit.id ? await db.update('materials', edit.id, row) : await db.insert('materials', row)
    toast('Material saved'); setEdit(null)
  }
  async function onFile(e) {
    const f = e.target.files[0]; if (!f) return
    try { toast('Uploading…'); const url = await uploadFile(f); setEdit((x) => ({ ...x, url, title: x.title || f.name.replace(/\.[^.]+$/, '') })); toast('File attached') } catch (err) { toast(err.message, 'error') }
  }

  return (
    <>
      <PageHeader title="Study Material" subtitle={manage ? `${materials.length} resources · public items also appear on the website` : 'Notes, formula sheets, workbooks and question papers'}
        actions={<>{user.role === 'parent' && <ChildSwitcher />}{manage && <button className="btn-primary" onClick={() => setEdit({ standard: std || '10th', type: 'notes', visibility: 'batch', batchIds: [] })}><Plus size={16} />Add material</button>}</>} />
      <Card bodyClass="p-0" className="mb-4">
        <div className="flex flex-wrap gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, chapter, subject" /></div>
          <select className="input w-auto" value={std} onChange={(e) => setStd(e.target.value)}><option value="">All classes</option>{STANDARDS.map((s) => <option key={s}>{s}</option>)}</select>
          <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{Object.entries(MATERIAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
      </Card>
      <div className="space-y-6">
        {Object.entries(bySubject).map(([subj, items]) => (
          <Card key={subj} title={`${subj} · ${items.length}`} bodyClass="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={cls('h-10 w-10 rounded-lg grid place-items-center shrink-0', m.type === 'video' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600')}>{m.type === 'video' ? <CirclePlay size={18} /> : <FileText size={18} />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{m.title}</div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-2">{!std && <span>{m.standard}</span>}<span>{m.chapter}</span><span className="text-indigo-600">{MATERIAL_TYPES[m.type] || m.type}</span>
                      {manage && (m.visibility === 'public' ? <span className="flex items-center gap-0.5 text-emerald-600"><Globe size={11} />Website</span> : <span className="flex items-center gap-0.5"><Lock size={11} />{(m.batchIds || []).map((id) => batches.find((b) => b.id === id)?.name).join(', ') || 'Batch only'}</span>)}
                    </div>
                  </div>
                  <a href={m.url} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><Download size={14} /><span className="hidden sm:inline">Open</span></a>
                  {manage && <button className="btn-ghost p-1.5" onClick={() => setEdit(m)}><Pencil size={15} /></button>}
                </div>
              ))}
            </div>
          </Card>
        ))}
        {!list.length && <Card><Empty title="No material found" hint="Try another class or search term." /></Card>}
      </div>

      {edit && <Modal open wide onClose={() => setEdit(null)} title={edit.id ? 'Edit material' : 'Add study material'} footer={<>
        {edit.id && <button className="btn-outline text-rose-600 mr-auto" onClick={async () => { if (window.confirm('Delete?')) { await db.remove('materials', edit.id); setEdit(null) } }}><Trash2 size={15} />Delete</button>}
        <button className="btn-outline" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title *" className="sm:col-span-2"><input className="input" value={edit.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
          <Field label="Class / Category"><select className="input" value={edit.standard} onChange={(e) => setEdit({ ...edit, standard: e.target.value })}>{STANDARDS.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Type"><select className="input" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>{Object.entries({ ...MATERIAL_TYPES, video: 'Video lecture' }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Subject"><input className="input" value={edit.subject || ''} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} /></Field>
          <Field label="Chapter"><input className="input" value={edit.chapter || ''} onChange={(e) => setEdit({ ...edit, chapter: e.target.value })} /></Field>
          <Field label="File link (PDF / Drive / YouTube) *" className="sm:col-span-2">
            <div className="flex gap-2"><input className="input" value={edit.url?.startsWith('data:') ? '(uploaded file)' : edit.url || ''} onChange={(e) => setEdit({ ...edit, url: e.target.value })} placeholder="https://…" />
              <label className="btn-outline cursor-pointer shrink-0"><Upload size={15} />Upload<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx" onChange={onFile} /></label></div>
          </Field>
          <Field label="Who can see it?" className="sm:col-span-2">
            <div className="flex gap-2">
              {[['public', 'Everyone (also on website)', Globe], ['batch', 'Selected batches only', Lock]].map(([v, l, I]) => (
                <button type="button" key={v} onClick={() => setEdit({ ...edit, visibility: v })} className={cls('btn border flex-1', edit.visibility === v ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-300')}><I size={15} />{l}</button>
              ))}
            </div>
          </Field>
          {edit.visibility === 'batch' && <div className="sm:col-span-2 flex flex-wrap gap-2">{batches.map((b) => { const on = (edit.batchIds || []).includes(b.id); return <button type="button" key={b.id} onClick={() => setEdit({ ...edit, batchIds: on ? edit.batchIds.filter((x) => x !== b.id) : [...(edit.batchIds || []), b.id] })} className={cls('btn btn-sm border', on ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300')}>{b.name}</button> })}</div>}
        </div>
      </Modal>}
    </>
  )
}

// ======================= ASSIGNMENTS =======================
export function Assignments() {
  const { user } = useAuth(); const { student } = useMyStudent(); const toast = useToast()
  const manage = canManage(user, 'assignments')
  const [asg] = useTable('assignments'); const [subs] = useTable('submissions'); const [batches] = useTable('batches'); const [users] = useTable('users')
  const [edit, setEdit] = useState(null); const [open, setOpen] = useState(null); const [mySub, setMySub] = useState(null)
  const myBatches = user.role !== 'faculty' ? batches : batches.filter((b) => (b.facultyIds || []).includes(user.id))
  const list = manage ? asg.filter((a) => myBatches.some((b) => b.id === a.batchId)) : asg.filter((a) => a.batchId === student?.batchId)

  async function save() {
    if (!edit.title || !edit.batchId) return toast('Title and batch required', 'error')
    edit.id ? await db.update('assignments', edit.id, edit) : await db.insert('assignments', { ...edit, createdBy: user.id })
    toast('Assignment saved'); setEdit(null)
  }
  async function submit() {
    const ex = subs.find((s) => s.assignmentId === mySub.assignmentId && s.studentId === student.id)
    const row = { ...mySub, studentId: student.id, submittedAt: new Date().toISOString() }
    ex ? await db.update('submissions', ex.id, row) : await db.insert('submissions', row)
    toast('Submitted'); setMySub(null)
  }

  return (
    <>
      <PageHeader title="Assignments" subtitle={manage ? 'Create, collect and grade homework' : 'Homework from your faculty'} actions={<>{user.role === 'parent' && <ChildSwitcher />}{manage && <button className="btn-primary" onClick={() => setEdit({ batchId: myBatches[0]?.id, dueDate: today(), maxMarks: 10 })}><Plus size={16} />New assignment</button>}</>} />
      <div className="grid md:grid-cols-2 gap-4">
        {list.map((a) => {
          const s = subs.filter((x) => x.assignmentId === a.id)
          const mine = student && s.find((x) => x.studentId === student.id)
          const total = users.filter((u) => u.role === 'student' && u.batchId === a.batchId).length
          const overdue = a.dueDate < today()
          return (
            <div key={a.id} className="card p-5">
              <div className="flex justify-between gap-2"><div><div className="font-semibold">{a.title}</div><div className="text-xs text-slate-500">{batches.find((b) => b.id === a.batchId)?.name} · {a.subject}</div></div>
                {manage ? <button className="btn-ghost p-1.5" onClick={() => setEdit(a)}><Pencil size={15} /></button> : mine ? <Badge tone="green">{mine.grade != null ? `${mine.grade}/${a.maxMarks}` : 'Submitted'}</Badge> : <Badge tone={overdue ? 'red' : 'amber'}>{overdue ? 'Overdue' : 'Pending'}</Badge>}
              </div>
              <p className="text-sm text-slate-600 mt-3 whitespace-pre-line">{a.description}</p>
              {a.attachmentUrl && <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 mt-2 inline-flex items-center gap-1"><ExternalLink size={14} />Attachment</a>}
              {mine?.feedback && <div className="mt-3 text-sm rounded-lg bg-emerald-50 p-3"><b>Feedback:</b> {mine.feedback}</div>}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">Due {fmtDate(a.dueDate)}</span>
                {manage ? <button className="btn-outline btn-sm" onClick={() => setOpen(a)}>Submissions {s.length}/{total}</button>
                  : user.role === 'student' && <button className="btn-primary btn-sm" onClick={() => setMySub({ assignmentId: a.id, text: mine?.text || '', url: mine?.url || '' })}>{mine ? 'Edit submission' : 'Submit'}</button>}
              </div>
            </div>
          )
        })}
      </div>
      {!list.length && <Card><Empty title="No assignments" /></Card>}

      {edit && <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Edit assignment' : 'New assignment'} footer={<>{edit.id && <button className="btn-outline text-rose-600 mr-auto" onClick={async () => { await db.remove('assignments', edit.id); setEdit(null) }}><Trash2 size={15} /></button>}<button className="btn-primary" onClick={save}>Save</button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title" className="sm:col-span-2"><input className="input" value={edit.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
          <Field label="Batch"><select className="input" value={edit.batchId} onChange={(e) => setEdit({ ...edit, batchId: e.target.value })}>{myBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
          <Field label="Subject"><input className="input" value={edit.subject || ''} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} /></Field>
          <Field label="Due date"><input type="date" className="input" value={edit.dueDate} onChange={(e) => setEdit({ ...edit, dueDate: e.target.value })} /></Field>
          <Field label="Max marks"><input type="number" className="input" value={edit.maxMarks} onChange={(e) => setEdit({ ...edit, maxMarks: Number(e.target.value) })} /></Field>
          <Field label="Instructions" className="sm:col-span-2"><textarea rows={4} className="input" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          <Field label="Attachment link" className="sm:col-span-2"><input className="input" value={edit.attachmentUrl || ''} onChange={(e) => setEdit({ ...edit, attachmentUrl: e.target.value })} /></Field>
        </div>
      </Modal>}

      {open && <Modal open wide onClose={() => setOpen(null)} title={`Submissions — ${open.title}`}>
        <Table rows={users.filter((u) => u.role === 'student' && u.batchId === open.batchId)} columns={[
          { label: 'Student', key: 'name' },
          { label: 'Submission', render: (st) => { const s = subs.find((x) => x.assignmentId === open.id && x.studentId === st.id); return s ? <div className="text-xs max-w-xs"><div>{s.text}</div>{s.url && <a className="text-indigo-600" href={s.url} target="_blank" rel="noreferrer">Open file</a>}<div className="text-slate-400">{fmtDate(s.submittedAt)}</div></div> : <Badge tone="red">Not submitted</Badge> } },
          { label: `Grade / ${open.maxMarks}`, render: (st) => { const s = subs.find((x) => x.assignmentId === open.id && x.studentId === st.id); return s && <GradeBox s={s} max={open.maxMarks} /> } },
        ]} />
      </Modal>}

      {mySub && <Modal open onClose={() => setMySub(null)} title="Submit assignment" footer={<button className="btn-primary" onClick={submit}><CheckCircle2 size={15} />Submit</button>}>
        <div className="space-y-4">
          <Field label="Answer / notes"><textarea rows={5} className="input" value={mySub.text} onChange={(e) => setMySub({ ...mySub, text: e.target.value })} /></Field>
          <Field label="File (photo of notebook / PDF)">
            <div className="flex gap-2"><input className="input" value={mySub.url?.startsWith('data:') ? '(uploaded)' : mySub.url} onChange={(e) => setMySub({ ...mySub, url: e.target.value })} placeholder="Paste link or upload" />
              <label className="btn-outline cursor-pointer"><Upload size={15} /><input type="file" hidden accept="image/*,.pdf" onChange={async (e) => { try { const url = await uploadFile(e.target.files[0], 'submissions'); setMySub((x) => ({ ...x, url })) } catch (err) { toast(err.message, 'error') } }} /></label></div>
          </Field>
        </div>
      </Modal>}
    </>
  )
}

function GradeBox({ s, max }) {
  const [g, setG] = useState(s.grade ?? ''); const [fb, setFb] = useState(s.feedback || ''); const toast = useToast()
  return <div className="flex gap-1 items-center"><input className="input w-16 py-1" type="number" max={max} value={g} onChange={(e) => setG(e.target.value)} /><input className="input py-1 w-36" placeholder="Feedback" value={fb} onChange={(e) => setFb(e.target.value)} /><button className="btn-primary btn-sm" onClick={async () => { await db.update('submissions', s.id, { grade: Number(g), feedback: fb }); toast('Graded') }}>✓</button></div>
}
