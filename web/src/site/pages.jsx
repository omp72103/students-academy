import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { School, Atom, Target, BarChart3, Monitor, Cpu } from 'lucide-react'
import { ArrowRight, BookOpen, FileText, Download, CheckCircle2, Award, Users, Library, ClipboardCheck, Smartphone, MapPin, Phone, Mail, Clock, Send, Quote, Search, ExternalLink, Bell, Pin } from 'lucide-react'
import { db, useTable } from '../lib/db'
import { PROGRAMS, MENTOR } from '../data/site'
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
    <div className="bg-navy-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
      <div className="container-x py-14 relative">
        <div className="text-xs text-navy-200 mb-2"><Link to="/" className="hover:text-white">Home</Link> / {crumb || title}</div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-3 text-navy-100 max-w-2xl">{subtitle}</p>}
      </div>
    </div>
  )
}

const ICONS = { School, Atom, Target, BarChart3, Monitor, Cpu }
const Ic = ({ name, ...p }) => { const C = ICONS[name] || BookOpen; return <C {...p} /> }

// ================= HOME =================
export function Home() {
  const s = useSettings()
  const [materials] = useTable('materials')
  const [notices] = useTable('notices')
  const [toppers] = useTable('toppers')
  const pub = notices.filter((n) => n.publishOnWebsite).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).slice(0, 4)
  const pubMaterials = materials.filter((m) => m.visibility === 'public')
  return (
    <>
      <section className="relative bg-navy-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gold-500/10 blur-3xl" />
        <div className="container-x relative py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-100 mb-6">
              <Award size={14} className="text-gold-400" /> Trusted coaching at Grant Road since {s.established}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] text-white">
              Clear concepts. <span className="text-gold-400">Confident</span> results.
            </h1>
            <p className="mt-6 text-lg text-navy-100 leading-relaxed max-w-xl">
              {s.name} prepares students for SSC, HSC, MHT-CET, JEE and NEET with small batches, handcrafted notes by Sai Sir, regular testing and a parent-connected learning portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/courses" className="btn-gold px-6 py-3 text-base">Explore Courses <ArrowRight size={18} /></Link>
              <Link to="/study-material" className="btn px-6 py-3 text-base border border-white/30 text-white hover:bg-white/10">Free Study Material</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              [s.established, 'Teaching since', Award], [pubMaterials.length + '+', 'Free notes & papers', Library],
              ['9th – 12th', 'SSC & HSC boards', BookOpen], ['CET · JEE · NEET', 'Entrance preparation', ClipboardCheck],
            ].map(([v, l, I]) => (
              <div key={l} className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur">
                <I className="text-gold-400 mb-3" size={22} />
                <div className="text-2xl font-bold text-white">{v}</div>
                <div className="text-sm text-navy-200 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section eyebrow="Programs" title="Courses we offer" subtitle="Board-focused teaching with an entrance-ready foundation, for every stream from 9th to 12th.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROGRAMS.map((p) => (
            <Link key={p.slug} to={`/courses#${p.slug}`} className="group card p-6 hover:border-navy-200 hover:shadow-md transition">
              <div className="h-12 w-12 rounded-xl bg-navy-50 text-navy-700 grid place-items-center mb-4 group-hover:bg-navy-800 group-hover:text-gold-400 transition"><Ic name={p.icon} size={22} /></div>
              <h3 className="font-semibold text-navy-900 text-lg">{p.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{p.summary}</p>
              <div className="mt-4 text-sm font-medium text-navy-700 flex items-center gap-1">Learn more <ArrowRight size={15} className="group-hover:translate-x-1 transition" /></div>
            </Link>
          ))}
        </div>
      </Section>

      <section className="bg-slate-50 border-y border-slate-200">
        <div className="container-x py-16 grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-2">
            <div className="aspect-[4/5] max-w-sm rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 p-8 flex flex-col justify-end text-white relative overflow-hidden">
              <Quote className="absolute top-6 left-6 text-gold-500/30" size={64} />
              <p className="font-serif text-xl leading-relaxed relative">"{MENTOR.quote}"</p>
              <div className="mt-6 pt-4 border-t border-white/15">
                <div className="font-semibold">{MENTOR.name}</div>
                <div className="text-sm text-navy-200">{MENTOR.title}</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase text-gold-600 mb-2">Our Mentor</div>
            <h2 className="font-serif text-3xl font-bold text-navy-900">Learn with {MENTOR.name}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{MENTOR.qualification}</p>
            <p className="mt-4 text-slate-600 leading-relaxed">{MENTOR.bio}</p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {['Handcrafted chapterwise notes', 'Board PYQs from 2019 onwards', 'DIY electronics & programming', 'Concept-first teaching'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={18} className="text-emerald-600 shrink-0" />{t}</li>
              ))}
            </ul>
            <Link to="/about" className="btn-outline mt-8">Read more about us</Link>
          </div>
        </div>
      </section>

      <Section eyebrow="Why Students Academy" title="A complete learning system" center>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            [Users, 'Small batches', 'Personal attention, doubt solving and regular progress reviews.'],
            [ClipboardCheck, 'Online tests', 'Chapter tests and CET-style mocks with instant scores and analysis.'],
            [Library, 'Digital library', 'Notes, formula sheets, PYQs and workbooks available 24×7 on the portal.'],
            [Smartphone, 'Parent connect', 'Attendance, results and fee updates on SMS & WhatsApp through our app.'],
          ].map(([I, t, d]) => (
            <div key={t} className="text-center p-6">
              <div className="mx-auto h-14 w-14 rounded-full bg-gold-50 text-gold-600 grid place-items-center mb-4 ring-1 ring-gold-100"><I size={24} /></div>
              <h3 className="font-semibold text-navy-900">{t}</h3>
              <p className="text-sm text-slate-600 mt-2">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="bg-navy-50/60 border-y border-navy-100">
        <div className="container-x py-16 grid lg:grid-cols-2 gap-10">
          <div>
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-serif text-2xl font-bold text-navy-900">Latest Notices</h2>
              <Link to="/notices" className="text-sm font-medium text-navy-700">View all →</Link>
            </div>
            <div className="space-y-3">
              {pub.map((n) => (
                <div key={n.id} className="card p-4 flex gap-4">
                  <div className="text-center shrink-0 w-14 rounded-lg bg-navy-800 text-white py-2">
                    <div className="text-lg font-bold leading-none">{new Date(n.createdAt).getDate()}</div>
                    <div className="text-[10px] uppercase mt-1 text-gold-400">{new Date(n.createdAt).toLocaleString('en', { month: 'short' })}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-navy-900 text-sm flex items-center gap-1.5">{n.pinned && <Pin size={13} className="text-gold-600" />}{n.title}</div>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{n.body}</p>
                  </div>
                </div>
              ))}
              {!pub.length && <p className="text-sm text-slate-500">No notices right now.</p>}
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-serif text-2xl font-bold text-navy-900">Our Achievers</h2>
              <Link to="/results" className="text-sm font-medium text-navy-700">All results →</Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[...toppers].sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 3).map((t) => (
                <div key={t.id} className="card p-5 text-center">
                  <Award className="mx-auto text-gold-500" size={26} />
                  <div className="mt-3 text-2xl font-bold text-navy-900">{t.score}</div>
                  <div className="font-medium text-sm mt-1">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.exam} · {t.year}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="rounded-2xl bg-navy-800 text-white p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">Admissions open for 2026–27</h2>
            <p className="text-navy-100 mt-2">Visit us at {s.location} or send an enquiry — our team will call you back.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/contact#enquiry" className="btn-gold px-6 py-3">Enquire Now</Link>
            <a href={`tel:${s.phone}`} className="btn px-6 py-3 border border-white/30 text-white hover:bg-white/10"><Phone size={16} />Call</a>
          </div>
        </div>
      </section>
    </>
  )
}

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
            <p>Our teaching is built around clear concepts, handcrafted study material and consistent practice. Every student has access to a digital library of chapterwise notes, formula sheets, workbooks and board papers, and takes regular tests through our online portal. Parents receive attendance, test and fee updates directly on SMS and WhatsApp.</p>
            <p>Students Academy also manages the <strong>10th Sarav Pariksha</strong> practice examination series, an initiative of the Lodha Foundation, helping SSC students build exam temperament well before the board exams.</p>
            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              {[['Mission', 'Make every student exam-ready through concept clarity and disciplined practice.'], ['Approach', 'Small batches, handcrafted notes, weekly tests and transparent progress tracking.'], ['Values', 'Integrity, curiosity, hard work and respect for every learner.']].map(([t, d]) => (
                <div key={t} className="card p-5"><div className="font-semibold text-navy-900">{t}</div><p className="text-sm text-slate-600 mt-2">{d}</p></div>
              ))}
            </div>
          </div>
          <div className="card p-6 h-fit">
            <div className="text-xs font-semibold uppercase tracking-wider text-gold-600">Head Master, School Section</div>
            <h3 className="font-serif text-xl font-bold text-navy-900 mt-1">{MENTOR.name}</h3>
            <p className="text-sm text-slate-500">{MENTOR.qualification}</p>
            <p className="text-sm text-slate-600 mt-3">{MENTOR.bio}</p>
            <ol className="mt-5 relative border-l-2 border-navy-100 ml-2 space-y-4">
              {MENTOR.timeline.map((t) => (
                <li key={t.years + t.org} className="pl-4 relative">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-gold-500 ring-4 ring-white" />
                  <div className="text-xs font-semibold text-navy-700">{t.years}</div>
                  <div className="text-sm font-medium">{t.role}</div>
                  <div className="text-xs text-slate-500">{t.org}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>
    </>
  )
}

// ================= COURSES =================
export function Courses() {
  return (
    <>
      <PageHero title="Courses" subtitle="Structured programs for SSC, HSC and entrance examinations." />
      <Section>
        <div className="space-y-6">
          {PROGRAMS.map((p) => (
            <div key={p.slug} id={p.slug} className="card p-6 sm:p-8 scroll-mt-24 grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-navy-800 text-gold-400 grid place-items-center"><Ic name={p.icon} size={20} /></div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy-900">{p.title}</h2>
                </div>
                <p className="mt-4 text-slate-600 leading-relaxed">{p.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">{p.subjects.map((x) => <span key={x} className="badge bg-navy-50 text-navy-700 ring-1 ring-navy-100 py-1 px-3 text-xs">{x}</span>)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-5 border border-slate-100">
                <div className="text-sm font-semibold text-navy-900 mb-3">Highlights</div>
                <ul className="space-y-2">{p.highlights.map((h) => <li key={h} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />{h}</li>)}</ul>
                <div className="flex gap-2 mt-5">
                  <Link to={`/study-material?std=${encodeURIComponent(p.standards[0])}`} className="btn-outline btn-sm">Study material</Link>
                  <Link to="/contact#enquiry" className="btn-navy btn-sm">Enquire</Link>
                </div>
              </div>
            </div>
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
      <PageHero title="Study Material" subtitle="Handcrafted notes, formula sheets, workbooks and board papers by Sai Sir — free to download." />
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
          <h2 className="font-serif text-2xl font-bold text-navy-900 mb-1">{q ? `Search results for "${q}"` : std}</h2>
          <p className="text-sm text-slate-500 mb-6">{list.length} resources</p>
          <div className="space-y-8">
            {Object.entries(bySubject).map(([subject, items]) => (
              <div key={subject}>
                <h3 className="font-semibold text-navy-800 mb-3 flex items-center gap-2"><BookOpen size={17} className="text-gold-600" />{subject}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {items.map((m) => <MaterialCard key={m.id} m={m} showStd={!!q} />)}
                </div>
              </div>
            ))}
            {!list.length && <p className="text-slate-500">No material found.</p>}
          </div>
          <p className="mt-10 text-xs text-slate-500">Enrolled students get additional batch-only notes, assignments and online tests in the <Link to="/portal" className="underline">student portal</Link>.</p>
        </div>
      </div>
    </>
  )
}

export function MaterialCard({ m, showStd }) {
  return (
    <a href={m.url} target="_blank" rel="noreferrer" className="card p-4 flex gap-3 hover:border-navy-200 hover:shadow-md transition group">
      <div className="h-11 w-11 shrink-0 rounded-lg bg-rose-50 text-rose-600 grid place-items-center"><FileText size={20} /></div>
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

// ================= SARAV PARIKSHA =================
export function SaravPariksha() {
  const [materials] = useTable('materials')
  const keys = materials.filter((m) => m.standard === '10th' && (m.subject === 'Sarav Pariksha' || m.type === 'answer-key'))
  const papers = materials.filter((m) => m.subject === 'Board Papers' && m.standard === '10th')
  return (
    <>
      <PageHero title="10th Sarav Pariksha 2026–27" subtitle="A practice examination series for SSC students — an initiative by the Lodha Foundation, managed by Students Academy." />
      <Section>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-6">
            <ClipboardCheck className="text-gold-600" />
            <h3 className="font-semibold text-lg mt-3 text-navy-900">Check your result</h3>
            <p className="text-sm text-slate-600 mt-2">Results are looked up with your seat number.</p>
            <a href="https://script.google.com/macros/s/AKfycbydLPUrLcCS0XW1Qgz-nqhK9L8te7HeAsFIjELGrE59QV3DkboJFU3xoa7Qs4Pcl9UQ9Q/exec" target="_blank" rel="noreferrer" className="btn-navy mt-5 w-full">Level 1 Result <ExternalLink size={15} /></a>
          </div>
          <div className="card p-6 lg:col-span-2">
            <h3 className="font-semibold text-lg text-navy-900">Answer keys & study material</h3>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">{keys.map((m) => <MaterialCard key={m.id} m={m} />)}</div>
            {!keys.length && <p className="text-sm text-slate-500 mt-3">Answer keys will be published after each level.</p>}
          </div>
        </div>
        <h3 className="font-serif text-2xl font-bold text-navy-900 mt-14 mb-4">SSC Board Papers (2019 – 2026)</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{papers.map((m) => <MaterialCard key={m.id} m={m} />)}</div>
      </Section>
    </>
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
                  <div className="mx-auto h-16 w-16 rounded-full bg-navy-800 text-gold-400 grid place-items-center text-xl font-bold">{t.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</div>
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
            {[[MapPin, 'Address', s.address], [Phone, 'Phone', s.phone], [Mail, 'Email', s.email], [Clock, 'Office hours', s.timings]].map(([I, l, v]) => (
              <div key={l} className="card p-5 flex gap-4">
                <div className="h-11 w-11 rounded-lg bg-navy-800 text-gold-400 grid place-items-center shrink-0"><I size={19} /></div>
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
