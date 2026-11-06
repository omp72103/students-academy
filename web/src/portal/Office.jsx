import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Printer, MessageCircle, Send, Pencil, Trash2, Phone, Wallet, AlertTriangle, IndianRupee, Megaphone, Globe, Pin, Smartphone, RotateCcw, UserPlus, Save, Award } from 'lucide-react'
import { db, useTable, MODE } from '../lib/db'
import { useAuth, canManage } from '../lib/auth'
import { PageHeader, Card, Table, Modal, Field, Badge, useToast, Empty, Stat, SearchBox, Avatar, Tabs } from '../components/ui'
import { inr, fmtDate, fmtDateTime, today, feeSummary, cls, downloadCsv, attendanceSummary } from '../lib/utils'
import { useMyStudent, ChildSwitcher } from './Layout'
import { openWhatsApp, sendSms, isAndroidApp, fill, TEMPLATES, dispatch, getSims, getSelectedSim, setSelectedSim } from '../lib/messaging'
import { useSettings } from '../site/SiteLayout'
import { DEFAULT_SETTINGS } from '../data/site'

// ======================= FEES =======================
export function Fees() {
  const { user } = useAuth()
  if (!canManage(user, 'fees')) return <MyFees />
  return <FeeDesk />
}

function FeeDesk() {
  const [users] = useTable('users'); const [fees] = useTable('fees'); const [batches] = useTable('batches')
  const [q, setQ] = useState(''); const [filter, setFilter] = useState('all'); const [pay, setPay] = useState(null); const [receipt, setReceipt] = useState(null)
  const toast = useToast(); const s = useSettings(); const { user } = useAuth()
  const students = users.filter((u) => u.role === 'student' && u.status !== 'inactive')
  const rows = students.map((st) => ({ ...st, ...feeSummary(st, fees) }))
    .filter((r) => (filter === 'all' || (filter === 'due' ? r.balance > 0 : r.balance === 0)) && (!q || (r.name + r.rollNo).toLowerCase().includes(q.toLowerCase())))
  const tot = rows.reduce((a, r) => ({ total: a.total + r.total, paid: a.paid + r.paid, balance: a.balance + r.balance }), { total: 0, paid: 0, balance: 0 })
  const thisMonth = fees.filter((f) => (f.date || '').startsWith(today().slice(0, 7))).reduce((a, f) => a + Number(f.amount), 0)

  async function collect() {
    if (!pay.amount || pay.amount <= 0) return toast('Enter amount', 'error')
    const n = fees.length + 1001
    const r = await db.insert('fees', { studentId: pay.student.id, amount: Number(pay.amount), mode: pay.mode, date: pay.date, note: pay.note, txnRef: pay.txnRef, receiptNo: `SA/${today().slice(2, 4)}/${n}`, collectedBy: user.id })
    toast('Payment recorded'); setReceipt({ fee: r, student: pay.student }); setPay(null)
  }
  async function remind(list, channel) {
    const tpl = TEMPLATES.find((t) => t.key === 'fee').text
    const msgs = list.map((r) => ({ phone: r.parentPhone, name: r.parentName, text: fill(tpl, { student: r.name, balance: r.balance.toLocaleString('en-IN'), sig: s.smsSignature }) }))
    const r = await dispatch(channel, msgs, { sentBy: user.id, purpose: 'fee' })
    if (r.mode === 'app') toast(channel === 'sms' ? `${r.count} reminders sending from the academy SIM` : `Opening ${r.count} WhatsApp chats one by one`)
  }

  return (
    <>
      <PageHeader title="Fees" subtitle="Collect payments, print receipts and send reminders" actions={<>
        <button className="btn-outline" onClick={() => downloadCsv('fee-ledger.csv', fees.map((f) => { const st = users.find((u) => u.id === f.studentId); return { receiptNo: f.receiptNo, date: f.date, rollNo: st?.rollNo, student: st?.name, amount: f.amount, mode: f.mode, ref: f.txnRef || '', note: f.note || '' } }))}>Export ledger</button>
        <button className="btn-outline" onClick={() => remind(rows.filter((r) => r.balance > 0), 'sms')}><Send size={15} />SMS all defaulters</button>
      </>} />
      <div className="grid sm:grid-cols-4 gap-4 mb-4">
        <Stat icon={IndianRupee} label="Total fees" value={inr(tot.total)} tone="indigo" /><Stat icon={Wallet} label="Collected" value={inr(tot.paid)} tone="emerald" />
        <Stat icon={AlertTriangle} label="Outstanding" value={inr(tot.balance)} hint={`${rows.filter((r) => r.balance > 0).length} students`} tone="rose" /><Stat icon={IndianRupee} label="This month" value={inr(thisMonth)} tone="sky" />
      </div>
      <Card bodyClass="p-0">
        <div className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
          <SearchBox value={q} onChange={setQ} />
          <Tabs value={filter} onChange={setFilter} tabs={[{ value: 'all', label: 'All' }, { value: 'due', label: 'Dues pending' }, { value: 'paid', label: 'Fully paid' }]} />
        </div>
        <Table rows={rows} columns={[
          { label: 'Student', render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-slate-500">{r.rollNo} · {batches.find((b) => b.id === r.batchId)?.name}</div></div> },
          { label: 'Total', render: (r) => inr(r.total) }, { label: 'Paid', render: (r) => <span className="text-emerald-700">{inr(r.paid)}</span> },
          { label: 'Balance', render: (r) => r.balance ? <b className="text-rose-600">{inr(r.balance)}</b> : <Badge tone="green">Paid</Badge> },
          { label: '', className: 'text-right', render: (r) => <div className="flex justify-end gap-1">
            {r.balance > 0 && <button className="btn-ghost p-1.5 text-emerald-600" title="WhatsApp reminder" onClick={() => remind([r], 'whatsapp')}><MessageCircle size={16} /></button>}
            <button className="btn-primary btn-sm" onClick={() => setPay({ student: r, amount: r.balance, mode: 'UPI', date: today(), note: '' })}>Collect</button></div> },
        ]} />
      </Card>
      <Card title="Recent payments" className="mt-4" bodyClass="p-0">
        <Table rows={[...fees].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 15)} columns={[
          { label: 'Receipt', key: 'receiptNo' }, { label: 'Date', render: (f) => fmtDate(f.date) }, { label: 'Student', render: (f) => users.find((u) => u.id === f.studentId)?.name },
          { label: 'Mode', key: 'mode' }, { label: 'Amount', render: (f) => <b>{inr(f.amount)}</b> },
          { label: '', render: (f) => <button className="btn-ghost p-1.5" onClick={() => setReceipt({ fee: f, student: users.find((u) => u.id === f.studentId) })}><Printer size={15} /></button> },
        ]} />
      </Card>
      {pay && <Modal open onClose={() => setPay(null)} title={`Collect fee — ${pay.student.name}`} footer={<button className="btn-primary" onClick={collect}>Record payment</button>}>
        <div className="rounded-lg bg-slate-50 p-3 text-sm mb-4 flex justify-between"><span>Balance due</span><b className="text-rose-600">{inr(pay.student.balance)}</b></div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount (₹)"><input type="number" className="input" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Mode"><select className="input" value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value })}>{['UPI', 'Cash', 'Cheque', 'Card', 'Bank Transfer'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Date"><input type="date" className="input" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
          <Field label="Txn ref / Cheque no."><input className="input" value={pay.txnRef || ''} onChange={(e) => setPay({ ...pay, txnRef: e.target.value })} /></Field>
          <Field label="Note" className="col-span-2"><input className="input" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} placeholder="e.g. 2nd instalment" /></Field>
        </div>
      </Modal>}
      {receipt && <Receipt {...receipt} fees={fees} onClose={() => setReceipt(null)} settings={s} />}
    </>
  )
}

function Receipt({ fee, student, fees, onClose, settings: s }) {
  const sum = feeSummary(student, fees)
  const text = `Payment received: ${inr(fee.amount)} for ${student.name} (Receipt ${fee.receiptNo}, ${fmtDate(fee.date)}, ${fee.mode}). Balance: ${inr(sum.balance)}. ${s.smsSignature}`
  return (
    <Modal open onClose={onClose} title="Fee receipt" footer={<>
      <button className="btn-outline" onClick={() => openWhatsApp(student.parentPhone, text)}><MessageCircle size={15} />WhatsApp</button>
      <button className="btn-outline" onClick={() => sendSms(student.parentPhone, text)}><Send size={15} />SMS</button>
      <button className="btn-primary" onClick={() => { const w = window.open('', '_blank'); w.document.write(`<html><head><title>${fee.receiptNo}</title></head><body style="font-family:sans-serif;padding:32px">${document.getElementById('rcpt').innerHTML}</body></html>`); w.document.close(); w.print() }}><Printer size={15} />Print</button></>}>
      <div id="rcpt">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #102445', paddingBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#102445' }}>{s.name}</div><div style={{ fontSize: 12, color: '#555' }}>{s.address} · {s.phone}</div>
          <div style={{ marginTop: 8, fontWeight: 600, letterSpacing: 2, fontSize: 12 }}>FEE RECEIPT</div>
        </div>
        <table style={{ width: '100%', fontSize: 14, marginTop: 16, borderCollapse: 'collapse' }}><tbody>
          {[['Receipt No.', fee.receiptNo], ['Date', fmtDate(fee.date)], ['Student', student.name], ['Roll No.', student.rollNo], ['Payment mode', fee.mode + (fee.txnRef ? ` (${fee.txnRef})` : '')], ['Remarks', fee.note || '—'], ['Amount received', inr(fee.amount)], ['Total fee', inr(sum.total)], ['Total paid', inr(sum.paid)], ['Balance', inr(sum.balance)]].map(([k, v]) => (
            <tr key={k}><td style={{ padding: '6px 0', color: '#666' }}>{k}</td><td style={{ padding: '6px 0', textAlign: 'right', fontWeight: k === 'Amount received' ? 700 : 500 }}>{v}</td></tr>
          ))}
        </tbody></table>
        <div style={{ marginTop: 32, fontSize: 12, textAlign: 'right', color: '#666' }}>Authorised signatory</div>
      </div>
    </Modal>
  )
}

function MyFees() {
  const { student } = useMyStudent(); const [fees] = useTable('fees'); const s = useSettings()
  if (!student) return <Empty title="No student linked" />
  const sum = feeSummary(student, fees); const mine = fees.filter((f) => f.studentId === student.id)
  return (
    <>
      <PageHeader title="Fees" subtitle={student.name} actions={<ChildSwitcher />} />
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <Stat icon={IndianRupee} label="Total fee" value={inr(sum.total)} tone="indigo" /><Stat icon={Wallet} label="Paid" value={inr(sum.paid)} tone="emerald" /><Stat icon={AlertTriangle} label="Balance" value={inr(sum.balance)} tone={sum.balance ? 'rose' : 'emerald'} />
      </div>
      {sum.balance > 0 && <div className="card p-4 mb-4 flex flex-wrap items-center justify-between gap-3"><span className="text-sm">To pay the balance or ask about instalments, contact the office.</span><button className="btn-outline text-emerald-700" onClick={() => openWhatsApp(s.whatsapp, `Hello, I want to pay the pending fee of ${inr(sum.balance)} for ${student.name} (${student.rollNo}).`)}><MessageCircle size={15} />WhatsApp office</button></div>}
      <Card title="Payment history" bodyClass="p-0"><Table rows={mine} columns={[{ label: 'Receipt', key: 'receiptNo' }, { label: 'Date', render: (f) => fmtDate(f.date) }, { label: 'Mode', key: 'mode' }, { label: 'Note', key: 'note' }, { label: 'Amount', render: (f) => <b>{inr(f.amount)}</b> }]} /></Card>
    </>
  )
}

// ======================= ENQUIRIES =======================
const ENQ = { new: 'blue', contacted: 'amber', 'follow-up': 'indigo', admitted: 'green', closed: 'slate' }
export function Enquiries() {
  const { user } = useAuth(); const [enq] = useTable('enquiries'); const [status, setStatus] = useState(''); const [q, setQ] = useState(''); const [edit, setEdit] = useState(null); const toast = useToast()
  const list = enq.filter((e) => (!status || e.status === status) && (!q || (e.name + e.phone).toLowerCase().includes(q.toLowerCase())))
  async function save() { edit.id ? await db.update('enquiries', edit.id, edit) : await db.insert('enquiries', { ...edit, status: edit.status || 'new' }); toast('Saved'); setEdit(null) }
  return (
    <>
      <PageHeader title="Enquiries & Leads" subtitle="Website enquiries land here automatically" actions={<><button className="btn-outline" onClick={() => downloadCsv('enquiries.csv', enq.map(({ id, ...r }) => r))}>Export</button>{canManage(user, 'enquiries') && <button className="btn-primary" onClick={() => setEdit({ source: 'Walk-in', standard: '10th' })}><Plus size={16} />Add enquiry</button>}</>} />
      <div className="flex flex-wrap gap-2 mb-4">
        {[['', 'All'], ...Object.keys(ENQ).map((k) => [k, k])].map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={cls('btn-sm btn border capitalize', status === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-300')}>{l} <span className="opacity-60">{k ? enq.filter((e) => e.status === k).length : enq.length}</span></button>)}
        <div className="ml-auto"><SearchBox value={q} onChange={setQ} /></div>
      </div>
      <Card bodyClass="p-0">
        <Table rows={list} columns={[
          { label: 'Name', render: (e) => <div><div className="font-medium">{e.name}</div><div className="text-xs text-slate-500">{e.phone}{e.email && ` · ${e.email}`}</div></div> },
          { label: 'Course', key: 'standard' }, { label: 'Source', key: 'source' },
          { label: 'Message', render: (e) => <span className="text-xs text-slate-600 line-clamp-2 max-w-xs">{e.message}</span> },
          { label: 'Status', render: (e) => <Badge tone={ENQ[e.status]}>{e.status}</Badge> }, { label: 'Received', render: (e) => fmtDate(e.createdAt) },
          { label: '', className: 'text-right', render: (e) => <div className="flex justify-end gap-1">
            <a href={`tel:${e.phone}`} className="btn-ghost p-1.5"><Phone size={15} /></a>
            <button className="btn-ghost p-1.5 text-emerald-600" onClick={() => openWhatsApp(e.phone, `Hello ${e.name}, thank you for your enquiry at Students Academy, Grant Road regarding ${e.standard}. `)}><MessageCircle size={15} /></button>
            <button className="btn-ghost p-1.5" onClick={() => setEdit(e)}><Pencil size={15} /></button></div> },
        ]} />
      </Card>
      {edit && <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Update enquiry' : 'New enquiry'} footer={<>{edit.id && canManage(user, 'enquiries') && <button className="btn-outline text-rose-600 mr-auto" onClick={async () => { await db.remove('enquiries', edit.id); setEdit(null) }}><Trash2 size={15} /></button>}<button className="btn-primary" onClick={save}>Save</button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name"><input className="input" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={edit.phone || ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
          <Field label="Course"><input className="input" value={edit.standard || ''} onChange={(e) => setEdit({ ...edit, standard: e.target.value })} /></Field>
          <Field label="Source"><select className="input" value={edit.source} onChange={(e) => setEdit({ ...edit, source: e.target.value })}>{['Website', 'Walk-in', 'Phone', 'WhatsApp', 'Reference', 'Social media'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Status"><select className="input capitalize" value={edit.status || 'new'} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{Object.keys(ENQ).map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Follow-up date"><input type="date" className="input" value={edit.followUp || ''} onChange={(e) => setEdit({ ...edit, followUp: e.target.value })} /></Field>
          <Field label="Message / notes" className="sm:col-span-2"><textarea rows={3} className="input" value={edit.message || ''} onChange={(e) => setEdit({ ...edit, message: e.target.value })} /></Field>
        </div>
      </Modal>}
    </>
  )
}

// ======================= NOTICES =======================
export function Notices() {
  const { user } = useAuth(); const { student } = useMyStudent()
  const manage = canManage(user, 'notices')
  const [notices] = useTable('notices'); const [batches] = useTable('batches'); const [edit, setEdit] = useState(null); const toast = useToast()
  const aud = user.role === 'parent' ? 'parents' : user.role === 'student' ? 'students' : ['faculty', 'staff'].includes(user.role) ? 'faculty' : null
  const list = manage ? notices : notices.filter((n) => n.audience === 'all' || n.audience === aud || (n.audience === 'batch' && n.batchId === student?.batchId))
  async function save() {
    if (!edit.title) return toast('Title required', 'error')
    edit.id ? await db.update('notices', edit.id, edit) : await db.insert('notices', { ...edit, createdBy: user.id })
    toast('Notice published'); setEdit(null)
  }
  return (
    <>
      <PageHeader title="Notices" subtitle={manage ? 'Publish to the portal and optionally to the website' : ''} actions={manage && <button className="btn-primary" onClick={() => setEdit({ audience: 'all', publishOnWebsite: false })}><Plus size={16} />New notice</button>} />
      <div className="space-y-3">
        {[...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt.localeCompare(a.createdAt)).map((n) => (
          <div key={n.id} className="card p-5">
            <div className="flex justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">{n.pinned && <Pin size={13} className="text-amber-500" />}{fmtDateTime(n.createdAt)}
                {manage && <><Badge tone="indigo">{n.audience === 'batch' ? batches.find((b) => b.id === n.batchId)?.name : n.audience}</Badge>{n.publishOnWebsite && <Badge tone="green"><Globe size={10} className="mr-1" />Website</Badge>}</>}
              </div>
              {manage && <button className="btn-ghost p-1.5" onClick={() => setEdit(n)}><Pencil size={15} /></button>}
            </div>
            <div className="font-semibold mt-2">{n.title}</div><p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{n.body}</p>
          </div>
        ))}
        {!list.length && <Card><Empty title="No notices" icon={Megaphone} /></Card>}
      </div>
      {edit && <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Edit notice' : 'New notice'} footer={<>{edit.id && <button className="btn-outline text-rose-600 mr-auto" onClick={async () => { await db.remove('notices', edit.id); setEdit(null) }}><Trash2 size={15} /></button>}<button className="btn-primary" onClick={save}>Publish</button></>}>
        <div className="space-y-4">
          <Field label="Title"><input className="input" value={edit.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
          <Field label="Message"><textarea rows={5} className="input" value={edit.body || ''} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Audience"><select className="input" value={edit.audience} onChange={(e) => setEdit({ ...edit, audience: e.target.value })}><option value="all">Everyone</option><option value="students">Students</option><option value="parents">Parents</option><option value="faculty">Faculty</option><option value="batch">A specific batch</option></select></Field>
            {edit.audience === 'batch' && <Field label="Batch"><select className="input" value={edit.batchId || ''} onChange={(e) => setEdit({ ...edit, batchId: e.target.value })}><option value="">Select</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>}
          </div>
          <div className="flex gap-6 text-sm">
            {user.role === 'admin' && <label className="flex items-center gap-2"><input type="checkbox" checked={!!edit.publishOnWebsite} onChange={(e) => setEdit({ ...edit, publishOnWebsite: e.target.checked })} />Show on website</label>}
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!edit.pinned} onChange={(e) => setEdit({ ...edit, pinned: e.target.checked })} />Pin to top</label>
          </div>
          <p className="text-xs text-slate-500">To also send this by SMS / WhatsApp, use <b>SMS & WhatsApp</b> → General notice.</p>
        </div>
      </Modal>}
    </>
  )
}

// ======================= MESSAGING =======================
export function Messaging() {
  const { user } = useAuth(); const s = useSettings(); const toast = useToast()
  const [users] = useTable('users'); const [batches] = useTable('batches'); const [fees] = useTable('fees'); const [att] = useTable('attendance'); const [log] = useTable('messages')
  const [params] = useSearchParams()
  const [audience, setAudience] = useState(params.get('audience') || 'batch')
  const [batchId, setBatchId] = useState(''); const [to, setTo] = useState('parents')
  const [tplKey, setTplKey] = useState(params.get('audience') === 'fee' ? 'fee' : 'notice'); const [message, setMessage] = useState('')
  const [text, setText] = useState(''); const [selected, setSelected] = useState(null)
  const myBatches = user.role !== 'faculty' ? batches : batches.filter((b) => (b.facultyIds || []).includes(user.id))
  const bid = batchId || myBatches[0]?.id
  useEffect(() => { setText(TEMPLATES.find((t) => t.key === tplKey)?.text || '') }, [tplKey])

  const students = users.filter((u) => u.role === 'student' && u.status !== 'inactive' && myBatches.some((b) => b.id === u.batchId))
  const lastByBatch = {}; att.forEach((a) => { if (!lastByBatch[a.batchId] || a.date > lastByBatch[a.batchId].date) lastByBatch[a.batchId] = a })
  const recipients = useMemo(() => {
    let base = []
    if (audience === 'batch') base = students.filter((x) => x.batchId === bid)
    else if (audience === 'all') base = students
    else if (audience === 'fee') base = students.filter((x) => feeSummary(x, fees).balance > 0)
    else if (audience === 'absent') base = students.filter((x) => lastByBatch[x.batchId]?.records?.[x.id] === 'A')
    else if (audience === 'low-att') base = students.filter((x) => attendanceSummary(x.id, att).pct < 75)
    else if (audience === 'faculty') return users.filter((u) => ['faculty', 'staff'].includes(u.role)).map((u) => ({ key: u.id, name: u.name, phone: u.phone, vars: { name: u.name } }))
    return base.map((st) => {
      const f = feeSummary(st, fees); const b = batches.find((x) => x.id === st.batchId)
      const vars = { student: st.name, name: to === 'parents' ? st.parentName || 'Parent' : st.name, balance: f.balance.toLocaleString('en-IN'), batch: b?.name, date: fmtDate(lastByBatch[st.batchId]?.date || today()), roll: st.rollNo, email: st.email }
      return { key: st.id, name: to === 'parents' ? `${st.parentName} (${st.name})` : st.name, phone: to === 'parents' ? st.parentPhone : st.phone, vars }
    }).filter((r) => r.phone)
  }, [audience, bid, to, students, fees, att, users]) // eslint-disable-line
  const chosen = recipients.filter((r) => !selected || selected.has(r.key))
  const render = (r) => fill(text, { ...r.vars, message, sig: s.smsSignature })

  async function send(channel) {
    if (!chosen.length) return toast('No recipients', 'error')
    const msgs = chosen.map((r) => ({ phone: r.phone, name: r.name, text: render(r) }))
    const r = await dispatch(channel, msgs, { sentBy: user.id, purpose: tplKey })
    if (r.mode === 'app') toast(channel === 'sms' ? `${r.count} SMS sending in the background from the academy SIM` : `Opening ${r.count} WhatsApp chats — tap Send in each, come back and the next opens`)
  }

  return (
    <>
      <PageHeader title="SMS & WhatsApp" subtitle={isAndroidApp() ? 'Connected to the Android app — SMS go out free from the academy SIM.' : 'Tip: install the Students Academy Android app to send bulk SMS free from the academy SIM.'} />
      {isAndroidApp() && <SimPicker />}
      {!isAndroidApp() && <div className="card p-4 mb-4 flex gap-3 items-center bg-indigo-50 border-indigo-100"><Smartphone className="text-indigo-600 shrink-0" /><p className="text-sm text-indigo-900 flex-1">In a browser, each SMS / WhatsApp opens one at a time. In the <b>Students Academy Android app</b>, SMS go out automatically from the academy SIM (free) and WhatsApp chats open one after another.</p><a href="https://github.com/omp72103/students-academy/releases/latest/download/StudentsAcademy.apk" className="btn-primary shrink-0">Download app</a></div>}
      <div className="grid lg:grid-cols-5 gap-4">
        <Card title="1. Recipients" className="lg:col-span-2">
          <div className="space-y-4">
            <Field label="Audience"><select className="input" value={audience} onChange={(e) => { setAudience(e.target.value); setSelected(null) }}>
              <option value="batch">A batch</option><option value="all">All my students</option><option value="fee">Fee defaulters</option><option value="absent">Absent on last class day</option><option value="low-att">Attendance below 75%</option>{user.role !== 'faculty' && <option value="faculty">Faculty & staff</option>}
            </select></Field>
            {audience === 'batch' && <Field label="Batch"><select className="input" value={bid} onChange={(e) => { setBatchId(e.target.value); setSelected(null) }}>{myBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>}
            {audience !== 'faculty' && <Tabs value={to} onChange={setTo} tabs={[{ value: 'parents', label: 'Parents' }, { value: 'students', label: 'Students' }]} />}
            <div className="flex justify-between text-xs text-slate-500"><span>{chosen.length} of {recipients.length} selected</span><button className="text-indigo-600" onClick={() => setSelected(selected ? null : new Set())}>{selected ? 'Select all' : 'Clear all'}</button></div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border rounded-lg">
              {recipients.map((r) => (
                <label key={r.key} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={!selected || selected.has(r.key)} onChange={(e) => { const n = new Set(selected || recipients.map((x) => x.key)); e.target.checked ? n.add(r.key) : n.delete(r.key); setSelected(n) }} />
                  <span className="flex-1 truncate">{r.name}</span><span className="text-xs text-slate-500">{r.phone}</span>
                </label>
              ))}
              {!recipients.length && <Empty title="No recipients" />}
            </div>
          </div>
        </Card>
        <Card title="2. Message" className="lg:col-span-3">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">{TEMPLATES.map((t) => <button key={t.key} onClick={() => setTplKey(t.key)} className={cls('btn-sm btn border', tplKey === t.key ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300')}>{t.label}</button>)}</div>
            {text.includes('{message}') && <Field label="Your message"><textarea rows={3} className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type the notice…" /></Field>}
            <Field label="Template (placeholders: {student} {name} {balance} {batch} {date} {roll} {message} {sig})"><textarea rows={4} className="input font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} /></Field>
            {chosen[0] && <div><div className="label">Preview</div><div className="rounded-xl bg-[#e7ffdb] p-3 text-sm whitespace-pre-line max-w-md shadow-sm">{render(chosen[0])}</div><div className="text-[11px] text-slate-500 mt-1">{render(chosen[0]).length} characters · {Math.ceil(render(chosen[0]).length / 160)} SMS part(s)</div></div>}
            <div className="flex gap-2 pt-2">
              <button className="btn-primary flex-1" onClick={() => send('sms')}><Send size={15} />Send SMS ({chosen.length})</button>
              <button className="btn flex-1 bg-[#25D366] text-white hover:bg-[#1ebe5a]" onClick={() => send('whatsapp')}><MessageCircle size={15} />WhatsApp ({chosen.length})</button>
            </div>
          </div>
        </Card>
      </div>
      <Card title="Message log" className="mt-4" bodyClass="p-0">
        <Table rows={log.slice(0, 50)} columns={[{ label: 'When', render: (m) => fmtDateTime(m.createdAt) }, { label: 'Channel', render: (m) => <Badge tone={m.channel === 'sms' ? 'blue' : 'green'}>{m.channel}</Badge> }, { label: 'To', render: (m) => <div className="text-xs"><div>{m.name}</div><div className="text-slate-500">{m.to}</div></div> }, { label: 'Message', render: (m) => <span className="text-xs line-clamp-2 max-w-md">{m.text}</span> }, { label: 'Status', render: (m) => <Badge tone={{ delivered: 'green', sent: 'green', failed: 'red', queued: 'amber', opened: 'blue' }[m.status] || 'slate'}>{m.status || 'opened'}</Badge> }]} empty={{ title: 'No messages sent yet' }} />
      </Card>
    </>
  )
}

function SimPicker() {
  const [sims] = useState(() => getSims()); const [sel, setSel] = useState(getSelectedSim())
  return (
    <div className="card p-4 mb-4 flex flex-wrap items-center gap-3 bg-emerald-50 border-emerald-100">
      <Smartphone className="text-emerald-600" />
      <div className="flex-1 min-w-[200px] text-sm text-emerald-900"><b>Free SMS from this phone's SIM.</b> Messages go out in the background and their delivery status appears in the log below.</div>
      {sims.length > 1 && <select className="input w-auto" value={sel} onChange={(e) => { setSel(Number(e.target.value)); setSelectedSim(e.target.value) }}>
        <option value={-1}>Default SIM</option>{sims.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>}
    </div>
  )
}

// ======================= WEBSITE CONTENT =======================
export function WebsiteContent() {
  const [toppers] = useTable('toppers'); const [edit, setEdit] = useState(null); const toast = useToast()
  async function save() { edit.id ? await db.update('toppers', edit.id, edit) : await db.insert('toppers', { ...edit, order: Number(edit.order || toppers.length + 1) }); toast('Saved'); setEdit(null) }
  return (
    <>
      <PageHeader title="Website Content" subtitle="Manage what appears on the official website. Notices (tick 'Show on website') and public study material also flow to the site automatically." actions={<button className="btn-primary" onClick={() => setEdit({ year: String(new Date().getFullYear()) })}><Plus size={16} />Add achiever</button>} />
      <Card title="Results & achievers" bodyClass="p-0">
        <Table rows={[...toppers].sort((a, b) => (a.order || 0) - (b.order || 0))} columns={[
          { label: 'Order', key: 'order' }, { label: 'Name', render: (t) => <div className="flex items-center gap-2"><Award size={16} className="text-amber-500" />{t.name}</div> }, { label: 'Exam', key: 'exam' }, { label: 'Year', key: 'year' }, { label: 'Score', render: (t) => <b>{t.score}</b> },
          { label: '', render: (t) => <button className="btn-ghost p-1.5" onClick={() => setEdit(t)}><Pencil size={15} /></button> },
        ]} />
      </Card>
      {edit && <Modal open onClose={() => setEdit(null)} title="Achiever" footer={<>{edit.id && <button className="btn-outline text-rose-600 mr-auto" onClick={async () => { await db.remove('toppers', edit.id); setEdit(null) }}><Trash2 size={15} /></button>}<button className="btn-primary" onClick={save}>Save</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Student name" className="col-span-2"><input className="input" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Exam"><input className="input" value={edit.exam || ''} onChange={(e) => setEdit({ ...edit, exam: e.target.value })} placeholder="SSC Board / MHT-CET" /></Field>
          <Field label="Year"><input className="input" value={edit.year || ''} onChange={(e) => setEdit({ ...edit, year: e.target.value })} /></Field>
          <Field label="Score"><input className="input" value={edit.score || ''} onChange={(e) => setEdit({ ...edit, score: e.target.value })} placeholder="95.4% / 99.2 %ile" /></Field>
          <Field label="Display order"><input type="number" className="input" value={edit.order || ''} onChange={(e) => setEdit({ ...edit, order: Number(e.target.value) })} /></Field>
          <Field label="Note" className="col-span-2"><input className="input" value={edit.note || ''} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
        </div>
      </Modal>}
    </>
  )
}

// ======================= SETTINGS =======================
export function SettingsPage() {
  const s = useSettings(); const [f, setF] = useState(null); const toast = useToast()
  useEffect(() => { if (!f) setF(s) }, [s]) // eslint-disable-line
  if (!f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  async function save() { await db.upsert('settings', { ...f, id: 'institute' }); toast('Settings saved — website updated') }
  return (
    <>
      <PageHeader title="Settings" subtitle="Institute profile shown on the website, receipts and messages" actions={<button className="btn-primary" onClick={save}><Save size={15} />Save</button>} />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Institute profile"><div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name"><input className="input" value={f.name} onChange={set('name')} /></Field>
          <Field label="Location"><input className="input" value={f.location} onChange={set('location')} /></Field>
          <Field label="Full address" className="sm:col-span-2"><textarea rows={2} className="input" value={f.address} onChange={set('address')} /></Field>
          <Field label="Phone"><input className="input" value={f.phone} onChange={set('phone')} /></Field>
          <Field label="WhatsApp (with 91)"><input className="input" value={f.whatsapp} onChange={set('whatsapp')} /></Field>
          <Field label="Email"><input className="input" value={f.email} onChange={set('email')} /></Field>
          <Field label="Office timings"><input className="input" value={f.timings} onChange={set('timings')} /></Field>
          <Field label="Established (year)"><input className="input" value={f.established} onChange={set('established')} /></Field>
          <Field label="Google Maps search"><input className="input" value={f.mapQuery} onChange={set('mapQuery')} /></Field>
        </div></Card>
        <div className="space-y-4">
          <Card title="Admissions banner"><div className="space-y-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.admissionsOpen} onChange={set('admissionsOpen')} />Show admissions banner on the website</label>
            <textarea rows={2} className="input" value={f.admissionBanner} onChange={set('admissionBanner')} />
          </div></Card>
          <Card title="Messaging"><div className="space-y-3">
            <Field label="SMS / WhatsApp signature"><input className="input" value={f.smsSignature} onChange={set('smsSignature')} /></Field>
            <Field label="Biometric late grace (minutes after batch start)"><input type="number" min="0" className="input w-32" value={f.bioGraceMinutes ?? 10} onChange={(e) => setF({ ...f, bioGraceMinutes: Number(e.target.value) })} /></Field>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={!!f.autoAbsentSms} onChange={set('autoAbsentSms')} /><span>Automatically SMS parents of absent students when attendance is saved <span className="text-slate-500">(works in the Android app; free from the academy SIM)</span></span></label>
          </div></Card>
          <Card title="System">
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Data mode</span><Badge tone={MODE === 'supabase' ? 'green' : 'amber'}>{MODE === 'supabase' ? 'Supabase (live)' : 'Demo (this browser)'}</Badge></div>
              {MODE === 'demo' && <button className="btn-outline btn-sm mt-2" onClick={async () => { if (window.confirm('Reset all demo data to defaults?')) { db.reset(); setF(DEFAULT_SETTINGS); toast('Demo data reset') } }}><RotateCcw size={14} />Reset demo data</button>}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
