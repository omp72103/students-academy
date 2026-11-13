// Public admission / general enquiry form (home page "We're listening" and the Contact page).
import { useState } from 'react'
import { CheckCircle2, PhoneCall, Send } from 'lucide-react'
import { db } from '../lib/db'
import { cls } from '../lib/utils'

export const STREAMS = ['8th Standard', '9th Standard', '10th Standard (SSC)', 'FYJC Science', 'SYJC Science', 'FYJC Commerce', 'SYJC Commerce', 'FY B.Com', 'SY B.Com', 'TY B.Com', 'FY BAF', 'SY BAF', 'TY BAF']

export function EnquiryForm({ compact = false }) {
  const blank = { name: '', phone: '', email: '', standard: STREAMS[2], type: 'Admission', callback: true, message: '' }
  const [f, setF] = useState(blank)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function submit(e) {
    e.preventDefault(); setErr('')
    const digits = f.phone.replace(/\D/g, '')
    if (digits.length < 10) return setErr('Please enter a valid 10-digit mobile number.')
    setBusy(true)
    try {
      await db.insert('enquiries', {
        ...f, phone: digits.slice(-10), status: 'new', source: 'Website',
        message: [f.callback ? 'Requested a call back.' : '', f.message].filter(Boolean).join(' '),
      })
      setDone(true)
    } catch { setErr('Could not submit right now. Please call or WhatsApp us.') } finally { setBusy(false) }
  }

  if (done) return (
    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-emerald-800">
      <CheckCircle2 className="mb-2" />
      <div className="font-semibold">Thank you, {f.name}!</div>
      <p className="text-sm mt-1">Your enquiry has been received. {f.callback ? 'Our counsellor will call you within one working day.' : 'We will get back to you soon.'}</p>
      <button className="mt-4 text-sm font-semibold text-emerald-700 underline" onClick={() => { setF(blank); setDone(false) }}>Send another enquiry</button>
    </div>
  )

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 flex gap-2">
        {['Admission', 'General enquiry'].map((t) => (
          <button type="button" key={t} onClick={() => setF({ ...f, type: t })}
            className={cls('flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', f.type === t ? 'border-navy-800 bg-navy-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300')}>{t}</button>
        ))}
      </div>
      <label><span className="label">Student name *</span><input required className="input" value={f.name} onChange={set('name')} autoComplete="name" /></label>
      <label><span className="label">Mobile number *</span><input required className="input" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
      <label><span className="label">Email</span><input type="email" className="input" value={f.email} onChange={set('email')} autoComplete="email" /></label>
      <label><span className="label">Stream / Class *</span>
        <select className="input" value={f.standard} onChange={set('standard')}>{STREAMS.map((x) => <option key={x}>{x}</option>)}</select>
      </label>
      {!compact && <label className="sm:col-span-2"><span className="label">Message</span><textarea rows={3} className="input" value={f.message} onChange={set('message')} placeholder="Batch timing, fees, subjects…" /></label>}
      <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
        <input type="checkbox" className="h-4 w-4 accent-red-600" checked={f.callback} onChange={set('callback')} />
        <PhoneCall size={16} className="text-red-600" />
        <span className="text-sm font-medium text-slate-700">Request a call back from our counsellor</span>
      </label>
      {err && <p className="sm:col-span-2 text-sm text-rose-600">{err}</p>}
      <div className="sm:col-span-2"><button disabled={busy} className="btn-gold w-full sm:w-auto px-7 py-3"><Send size={16} />{busy ? 'Sending…' : 'Submit enquiry'}</button></div>
    </form>
  )
}
