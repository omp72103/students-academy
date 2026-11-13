import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { School, Atom, Target, BarChart3, Monitor, Cpu } from 'lucide-react'
import { ArrowRight, BookOpen, FileText, Download, CheckCircle2, Award, Users, Library, ClipboardCheck, Smartphone, MapPin, Phone, Mail, Clock, Send, Quote, Search, ExternalLink, Bell, Pin } from 'lucide-react'
import { db, useTable } from '../lib/db'
import { PROGRAMS } from '../data/site'
import { STANDARDS, MATERIAL_TYPES } from '../data/materials'
import { useSettings } from './SiteLayout'
import { cls, fmtDate } from '../lib/utils'

function Section({ eyebrow, title, subtitle, children, className, center }) {
  return (
    <section className={cls('py-16 sm:py-20', className)}>
      <div className="container-x">
        {(title || eyebrow) && (
          <div className={cls('mb-10 max-w-2xl', center && 'mx-auto text-center')}>
            {eyebrow && <div className="text-xs font-semibold tracking-[0.2em] uppercase text-gold-600 mb-2">{eyebrow}</div>}
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy-900">{title}</h2>
            {subtitle && <p className="mt-3 text-slate-600 leading-relaxed">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

function PageHero({ title, subtitle, crumb }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-navy-50 to-white border-b border-navy-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-blue-200/40 blur-[100px] animate-aurora" />
        <div className="absolute inset-0 bg-grid-dark mask-fade-b" />
      </div>
      <div className="container-x py-14 sm:py-16 relative">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-slate-500 mb-3 tracking-wide"><Link to="/" className="hover:text-red-600">Home</Link> <span className="mx-1.5 text-red-400">/</span> {crumb || title}</motion.div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-navy-900 overflow-hidden"><motion.span className="inline-block" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>{title}</motion.span></h1>
        {subtitle && <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 text-slate-600 max-w-2xl text-lg">{subtitle}</motion.p>}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="mt-7 h-1 w-20 origin-left rounded-full bg-red-600" />
      </div>
    </div>
  )
}

const ICONS = { School, Atom, Target, BarChart3, Monitor, Cpu }
const Ic = ({ name, ...p }) => { const C = ICONS[name] || BookOpen; return <C {...p} /> }

// ================= ABOUT =================
export function About() {
  const s = useSettings()
  return (
    <>
      <PageHero title="About Students Academy" subtitle={`A home for learning at ${s.location}, since ${s.established}.`} />
      <Section>
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-5 text-slate-700 leading-relaxed">
            <h2 className="font-serif text-2xl font-bold text-navy-900">Who we are</h2>
            <p>Students Academy is a coaching institute at Grant Road (West), Mumbai, offering focused coaching for Maharashtra State Board students from 9th to 12th across Science, Commerce, Information Technology, Computer Science and Electronics, along with preparation for MHT-CET, JEE Main and NEET-UG.</p>
            <p>Our teaching is built around clear concepts, well-structured study material and consistent practice. Every student has access to a digital library of chapterwise notes, formula sheets, workbooks and board papers, and takes regular tests through our online portal. Parents receive attendance, test and fee updates directly on SMS and WhatsApp.</p>
            <p>Students Academy was founded and is led by <strong>{s.founderName || 'Mr. Vishal Khandekar Sir'}</strong>, {(s.founderTitle || 'Founder & Director').toLowerCase()} of the academy, with one simple aim: give every student the clarity, discipline and personal attention they need to do their best in board and entrance examinations.</p>
            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              {[['Mission', 'Make every student exam-ready through concept clarity and disciplined practice.'], ['Approach', 'Small batches, structured notes, weekly tests and transparent progress tracking.'], ['Values', 'Integrity, curiosity, hard work and respect for every learner.']].map(([t, d]) => (
                <div key={t} className="card p-5"><div className="font-semibold text-navy-900">{t}</div><p className="text-sm text-slate-600 mt-2">{d}</p></div>
              ))}
            </div>
          </div>
          <FounderCard s={s} />
        </div>
      </Section>
    </>
  )
}

export function FounderCard({ s }) {
  const name = s.founderName || 'Mr. Vishal Khandekar Sir'
  const initials = name.replace(/^(mr|mrs|ms|dr)\.?\s+/i, '').replace(/\s+sir$/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
  return (
    <div className="card overflow-hidden h-fit">
      <div className="relative bg-gradient-to-br from-navy-700 to-navy-900 p-6 text-white">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative flex items-center gap-4">
          {s.founderPhoto
            ? <img src={s.founderPhoto} alt={name} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/30" />
            : <div className="h-20 w-20 rounded-2xl bg-red-600 text-white grid place-items-center font-serif text-2xl font-bold ring-4 ring-white/20">{initials}</div>}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-red-300">{s.founderTitle || 'Founder & Director'}</div>
            <h3 className="font-serif text-xl font-bold mt-0.5">{name}</h3>
            <div className="text-xs text-navy-200 mt-0.5">{s.name}, {s.location}</div>
          </div>
        </div>
      </div>
      <div className="p-6">
        {s.founderMessage
          ? <><Quote className="text-red-200" size={28} /><p className="text-sm text-slate-700 leading-relaxed mt-2 whitespace-pre-line">{s.founderMessage}</p></>
          : <p className="text-sm text-slate-600 leading-relaxed">The founder and pioneer of {s.name}. Under his leadership the academy has grown into a complete learning centre at {s.location}, with experienced faculty, regular testing and a digital portal that keeps every parent informed.</p>}
      </div>
    </div>
  )
}

// ================= COURSES =================
export function Courses() {
  return (
    <>
      <PageHero title="Courses" subtitle="Structured programs for SSC, HSC and entrance examinations." />
      <Section>
        <div className="space-y-6">
          {PROGRAMS.map((p, idx) => (
            <motion.div key={p.slug} id={p.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 scroll-mt-28 grid lg:grid-cols-3 gap-6 transition-shadow hover:shadow-[0_30px_60px_-25px_rgba(16,36,69,0.3)]">
              <span className="pointer-events-none absolute -right-4 -top-8 font-serif text-[9rem] font-bold leading-none text-slate-50 group-hover:text-gold-50 transition-colors">0{idx + 1}</span>
              <div className="relative lg:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100 grid place-items-center"><Ic name={p.icon} size={20} /></div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy-900">{p.title}</h2>
                </div>
                <p className="mt-4 text-slate-600 leading-relaxed">{p.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">{p.subjects.map((x) => <span key={x} className="badge bg-navy-50 text-navy-700 ring-1 ring-navy-100 py-1 px-3 text-xs">{x}</span>)}</div>
              </div>
              <div className="relative rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <div className="text-sm font-semibold text-navy-900 mb-3">Highlights</div>
                <ul className="space-y-2">{p.highlights.map((h) => <li key={h} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />{h}</li>)}</ul>
                <div className="flex gap-2 mt-5">
                  <Link to={`/study-material?std=${encodeURIComponent(p.standards[0])}`} className="btn-outline btn-sm">Study material</Link>
                  <Link to="/contact#enquiry" className="btn-navy btn-sm">Enquire</Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  )
}

// ================= STUDY MATERIAL =================
export function StudyMaterial() {
  const [materials] = useTable('materials')
  const [params, setParams] = useSearchParams()
  const std = params.get('std') || '10th'
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const pub = materials.filter((m) => m.visibility === 'public')
  const list = useMemo(() => pub.filter((m) => (q ? true : m.standard === std) && (!type || m.type === type) &&
    (!q || (m.title + m.subject + m.chapter + m.standard).toLowerCase().includes(q.toLowerCase()))), [pub, std, q, type])
  const bySubject = list.reduce((acc, m) => { (acc[m.subject] ||= []).push(m); return acc }, {})
  const stds = STANDARDS.filter((s) => pub.some((m) => m.standard === s))
  return (
    <>
      <PageHero title="Study Material" subtitle="Notes, formula sheets, worksheets and question papers shared by Students Academy." />
      <div className="container-x py-10 grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="card p-2 lg:sticky lg:top-24">
            <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Class / Category</div>
            <div className="flex lg:flex-col gap-1 overflow-x-auto">
              {stds.map((s) => (
                <button key={s} onClick={() => { setParams({ std: s }); setQ('') }}
                  className={cls('text-left px-3 py-2 rounded-lg text-sm whitespace-nowrap flex justify-between gap-3', std === s && !q ? 'bg-navy-800 text-white' : 'text-slate-700 hover:bg-slate-100')}>
                  {s}<span className="opacity-60">{pub.filter((m) => m.standard === s).length}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Search all material — e.g. Gravitation, PYQ 2025, Economics" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="input sm:w-52" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {Object.entries(MATERIAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {pub.length > 0 && <><h2 className="font-serif text-2xl font-bold text-navy-900 mb-1">{q ? `Search results for "${q}"` : std}</h2>
          <p className="text-sm text-slate-500 mb-6">{list.length} resources</p></>}
          <div className="space-y-8">
            {Object.entries(bySubject).map(([subject, items]) => (
              <div key={subject}>
                <h3 className="font-semibold text-navy-800 mb-3 flex items-center gap-2"><BookOpen size={17} className="text-gold-600" />{subject}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {items.map((m) => <MaterialCard key={m.id} m={m} showStd={!!q} />)}
                </div>
              </div>
            ))}
            {!list.length && (pub.length
              ? <p className="text-slate-500">No material found.</p>
              : <div className="card p-10 text-center"><BookOpen className="mx-auto text-red-500" size={32} /><h3 className="mt-3 font-semibold text-navy-900">Study material is being added</h3><p className="mt-1 text-sm text-slate-500">Enrolled students can already find their notes, assignments and tests in the student portal.</p><Link to="/portal" className="btn-navy mt-5 inline-flex">Student portal <ArrowRight size={15} /></Link></div>)}
          </div>
          <p className="mt-10 text-xs text-slate-500">Enrolled students get additional batch-only notes, assignments and online tests in the <Link to="/portal" className="underline">student portal</Link>.</p>
        </div>
      </div>
    </>
  )
}

export function MaterialCard({ m, showStd }) {
  return (
    <a href={m.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200/80 bg-white p-4 flex gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/40 hover:shadow-[0_14px_30px_-14px_rgba(16,36,69,0.3)] group">
      <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 text-rose-600 grid place-items-center ring-1 ring-rose-100 transition-transform group-hover:scale-110 group-hover:-rotate-6"><FileText size={20} /></div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm text-slate-900 leading-snug group-hover:text-navy-700">{m.title}</div>
        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-2">
          {showStd && <span>{m.standard} ·</span>}<span>{m.chapter}</span><span className="text-gold-600 font-medium">{MATERIAL_TYPES[m.type] || m.type}</span>
        </div>
      </div>
      <Download size={17} className="text-slate-400 group-hover:text-navy-700 shrink-0 mt-1" />
    </a>
  )
}

// ================= RESULTS =================
export function Results() {
  const [toppers] = useTable('toppers')
  const groups = [...toppers].sort((a, b) => (a.order || 0) - (b.order || 0)).reduce((acc, t) => { (acc[`${t.exam} ${t.year}`] ||= []).push(t); return acc }, {})
  return (
    <>
      <PageHero title="Results & Achievers" subtitle="Celebrating the hard work of our students." />
      <Section>
        {Object.entries(groups).map(([g, items]) => (
          <div key={g} className="mb-10">
            <h3 className="font-serif text-xl font-bold text-navy-900 mb-4">{g}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((t) => (
                <div key={t.id} className="card p-6 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-navy-50 text-navy-700 ring-1 ring-navy-100 grid place-items-center text-xl font-bold">{t.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</div>
                  <div className="mt-3 font-semibold">{t.name}</div>
                  <div className="text-2xl font-bold text-navy-800 mt-1">{t.score}</div>
                  {t.note && <div className="text-xs text-slate-500 mt-1">{t.note}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!toppers.length && <p className="text-slate-500">Results will be published soon.</p>}
      </Section>
    </>
  )
}

// ================= NOTICES =================
export function Notices() {
  const [notices] = useTable('notices')
  const pub = notices.filter((n) => n.publishOnWebsite)
  return (
    <>
      <PageHero title="Notices & Announcements" />
      <Section>
        <div className="max-w-3xl space-y-4">
          {pub.map((n) => (
            <article key={n.id} className="card p-6">
              <div className="flex items-center gap-2 text-xs text-slate-500"><Bell size={14} className="text-gold-600" />{fmtDate(n.createdAt)}{n.pinned && <span className="badge bg-gold-50 text-gold-600 ring-1 ring-gold-100">Pinned</span>}</div>
              <h2 className="font-semibold text-lg text-navy-900 mt-2">{n.title}</h2>
              <p className="text-slate-600 mt-2 whitespace-pre-line">{n.body}</p>
            </article>
          ))}
          {!pub.length && <p className="text-slate-500">No notices.</p>}
        </div>
      </Section>
    </>
  )
}

// ================= CONTACT =================
export function Contact() {
  const s = useSettings()
  const [f, setF] = useState({ name: '', phone: '', email: '', standard: '10th', message: '' })
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e) {
    e.preventDefault(); setErr('')
    if (!/^\d{10}$/.test(f.phone.replace(/\D/g, '').slice(-10))) return setErr('Please enter a valid 10-digit mobile number.')
    try { await db.insert('enquiries', { ...f, status: 'new', source: 'Website' }); setDone(true) } catch { setErr('Could not submit right now. Please call or WhatsApp us.') }
  }
  return (
    <>
      <PageHero title="Contact Us" subtitle="Visit the academy, call us, or send an enquiry." />
      <Section>
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[[MapPin, 'Address', s.address], [Phone, 'Phone', s.phone], [Mail, 'Email', s.email], [Clock, 'Office hours', s.timings]].filter(([, , v]) => v).map(([I, l, v]) => (
              <div key={l} className="card p-5 flex gap-4">
                <div className="h-11 w-11 rounded-lg bg-navy-50 text-navy-700 ring-1 ring-navy-100 grid place-items-center shrink-0"><I size={19} /></div>
                <div><div className="text-xs font-semibold uppercase text-slate-500">{l}</div><div className="text-sm text-slate-800 mt-1">{v}</div></div>
              </div>
            ))}
            <iframe title="map" className="w-full h-64 rounded-xl border" loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(s.mapQuery)}&output=embed`} />
          </div>
          <div id="enquiry" className="lg:col-span-3 card p-6 sm:p-8 scroll-mt-24">
            <h2 className="font-serif text-2xl font-bold text-navy-900">Admission enquiry</h2>
            <p className="text-sm text-slate-500 mt-1">Our counsellor will call you within one working day.</p>
            {done ? (
              <div className="mt-8 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-emerald-800">
                <CheckCircle2 className="mb-2" /> Thank you, {f.name}! Your enquiry has been received.
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 grid sm:grid-cols-2 gap-4">
                <label><span className="label">Student name *</span><input required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
                <label><span className="label">Mobile number *</span><input required className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
                <label><span className="label">Email</span><input type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
                <label><span className="label">Class / Course *</span>
                  <select className="input" value={f.standard} onChange={(e) => setF({ ...f, standard: e.target.value })}>{['9th', '10th', '11th Science', '12th Science', '11th Commerce', '12th Commerce', 'IT / Computer Science', 'Electronics', 'MHT-CET / JEE / NEET'].map((x) => <option key={x}>{x}</option>)}</select>
                </label>
                <label className="sm:col-span-2"><span className="label">Message</span><textarea rows={4} className="input" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
                {err && <p className="sm:col-span-2 text-sm text-rose-600">{err}</p>}
                <div className="sm:col-span-2"><button className="btn-navy px-6 py-3"><Send size={16} />Submit enquiry</button></div>
              </form>
            )}
          </div>
        </div>
      </Section>
    </>
  )
}

export function NotFound() {
  return <div className="container-x py-24 text-center"><h1 className="font-serif text-4xl font-bold text-navy-900">Page not found</h1><Link to="/" className="btn-navy mt-6">Go home</Link></div>
}
