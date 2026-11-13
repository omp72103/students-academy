// Landing page: navy blue + red on white, motion-rich but restrained.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion'
import {
  ArrowRight, Award, BookOpen, CheckCircle2, ClipboardCheck, FileText, Library, Phone, Pin, Quote, Smartphone, Sparkles, Users,
  School, Atom, Target, BarChart3, Monitor, Cpu, CalendarCheck, Bell, MessageCircle, TrendingUp, Star, Download, PlayCircle,
  GraduationCap, ShieldCheck, Building2, HeartHandshake, Play, X, MapPin,
} from 'lucide-react'
import { EnquiryForm } from './EnquiryForm'
import { useTable } from '../lib/db'
import { PROGRAMS } from '../data/site'
import { useSettings } from './SiteLayout'
import { cls, fmtDate } from '../lib/utils'

const EASE = [0.16, 1, 0.3, 1]
const ICONS = { GraduationCap, School, Atom, Target, BarChart3, Monitor, Cpu }
const reveal = { hidden: { opacity: 0, y: 28 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.08, ease: EASE } }) }

function Reveal({ children, i = 0, className, as = 'div' }) {
  const M = motion[as]
  return <M variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} custom={i} className={className}>{children}</M>
}

function Counter({ to, suffix = '', prefix = '' }) {
  const ref = useRef(); const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    let raf; const t0 = performance.now()
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1600); setN(Math.round(to * (1 - Math.pow(1 - p, 4)))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [inView, to])
  return <span ref={ref}>{prefix}{n.toLocaleString('en-IN')}{suffix}</span>
}

function Eyebrow({ children, light }) {
  return (
    <div className={cls('inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase', light ? 'text-gold-400' : 'text-gold-600')}>
      <span className={cls('h-px w-8', light ? 'bg-gold-400/60' : 'bg-gold-500/60')} />{children}
    </div>
  )
}

function SectionTitle({ eyebrow, title, subtitle, center, light }) {
  return (
    <div className={cls('mb-12 max-w-2xl', center && 'mx-auto text-center')}>
      <Reveal><Eyebrow light={light}>{eyebrow}</Eyebrow></Reveal>
      <Reveal i={1}><h2 className={cls('mt-3 font-serif text-3xl sm:text-[2.6rem] leading-tight font-bold', light ? 'text-white' : 'text-navy-900')}>{title}</h2></Reveal>
      {subtitle && <Reveal i={2}><p className={cls('mt-4 leading-relaxed', light ? 'text-navy-100' : 'text-slate-600')}>{subtitle}</p></Reveal>}
    </div>
  )
}

// ---------------- HERO ----------------
const ROTATE = ['8th, 9th & 10th', 'HSC Science', 'HSC Commerce', 'B.Com & BAF']

function RotatingWord() {
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % ROTATE.length), 2400); return () => clearInterval(t) }, [])
  return (
    <span className="relative inline-grid h-[1.5em] overflow-hidden align-middle min-w-[6ch] font-medium">
      <AnimatePresence mode="wait">
        <motion.span key={ROTATE[i]} initial={{ y: '100%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.55, ease: EASE }}
          className="gold-gradient whitespace-nowrap">{ROTATE[i]}</motion.span>
      </AnimatePresence>
    </span>
  )
}

function HeroVisual() {
  const ref = useRef()
  const mx = useMotionValue(0), my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 })
  const onMove = (e) => { const r = ref.current.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5) }
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0) }} style={{ perspective: 1200 }} className="relative h-[460px] sm:h-[520px] hidden md:block"
      initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3, ease: EASE }}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className="relative h-full w-full">
        {/* orbit ring */}
        <div className="absolute inset-8 rounded-full border border-blue-200 animate-spin-slow" style={{ transform: 'translateZ(-60px)' }}>
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 rounded-full bg-red-500 shadow-[0_0_16px_rgba(59,130,246,0.7)]" />
        </div>
        <div className="absolute inset-24 rounded-full border border-slate-200" style={{ transform: 'translateZ(-40px)' }} />

        {/* main notes card */}
        <div className="absolute z-10 left-[4%] top-[16%] w-[62%] rounded-3xl border border-slate-200 bg-white/95 p-5 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(11,26,51,0.25)]" style={{ transform: 'translateZ(60px)' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 grid place-items-center text-white"><BookOpen size={19} /></div>
            <div><div className="text-sm font-semibold text-navy-900">Study Material</div><div className="text-[11px] text-slate-500">Notes · worksheets · question papers</div></div>
          </div>
          <div className="mt-4 space-y-2.5">
            {[['10th Science 1 · Gravitation', 'Notes'], ['12th Accountancy · Practice Set', 'Practice'], ['SSC Board Papers', 'PYQ'], ['TY B.Com · Taxation', 'Notes']].map(([t, b], i) => (
              <motion.div key={t} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.12 }} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                <FileText size={15} className="text-red-500 shrink-0" /><span className="text-[13px] text-slate-700 flex-1 truncate">{t}</span><span className="text-[10px] font-semibold text-red-600">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* score card */}
        <div className="absolute z-20 right-[0%] top-[4%] w-48 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_50px_-18px_rgba(11,26,51,0.3)] animate-float-slow" style={{ transform: 'translateZ(120px)' }}>
          <div className="flex items-center justify-between text-[11px] text-slate-500"><span>Chapter test</span><TrendingUp size={14} className="text-emerald-400" /></div>
          <div className="mt-1 font-serif text-3xl font-bold text-navy-900">92<span className="text-lg text-slate-400">%</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-gold-500 to-red-200" initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ delay: 1.2, duration: 1.2, ease: EASE }} /></div>
          <div className="mt-2 text-[10px] text-slate-500">Rank #2 of 38 · Gravitation</div>
        </div>

        {/* attendance alert */}
        <div className="absolute right-[6%] bottom-[16%] w-60 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_24px_50px_-18px_rgba(11,26,51,0.3)] animate-float-slow [animation-delay:-3s]" style={{ transform: 'translateZ(90px)' }}>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#25D366] grid place-items-center text-white"><MessageCircle size={17} /></div>
            <div className="min-w-0"><div className="text-xs font-bold text-navy-900">Parent update sent</div><div className="text-[11px] text-slate-500 truncate">Attendance · test score · fees</div></div>
          </div>
        </div>

        {/* attendance chip */}
        <div className="absolute left-[2%] bottom-[10%] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_20px_40px_-18px_rgba(11,26,51,0.3)] animate-float-slow [animation-delay:-1.5s]" style={{ transform: 'translateZ(100px)' }}>
          <div className="flex items-center gap-3"><CalendarCheck className="text-emerald-400" size={20} /><div><div className="text-[11px] text-slate-500">Attendance this month</div><div className="text-lg font-bold text-navy-900">96%</div></div></div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Hero({ s }) {
  const words = ['Clear', 'concepts.', 'Confident', 'results.']
  const ref = useRef()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  return (
    <section ref={ref} className="relative overflow-hidden bg-white text-navy-900 -mt-[72px] pt-[72px]">
      {/* aurora */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-blue-100/70 blur-[120px] animate-aurora" />
        <div className="absolute top-20 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-red-200/50 blur-[120px] animate-aurora [animation-delay:-6s]" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-sky-100/60 blur-[120px] animate-aurora [animation-delay:-11s]" />
        <div className="absolute inset-0 bg-grid-dark mask-fade-b" />
      </div>
      <motion.div style={{ y, opacity: fade }} className="container-x relative grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center py-20 sm:py-28 lg:py-32">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-700">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" /></span>
            Admissions open 2026–27 · Nana Chowk, Grant Road
          </motion.div>
          {s.googleRating && (
            <motion.a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.mapQuery || s.name)}`} target="_blank" rel="noreferrer"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
              className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-800 shadow-sm hover:border-amber-300">
              <Star size={13} className="fill-amber-400 text-amber-400" />{s.googleRating} on Google{s.googleReviews ? ` · ${s.googleReviews}+ reviews` : ''}
            </motion.a>
          )}
          <h1 className="mt-7 font-serif text-[2.6rem] sm:text-6xl lg:text-[4.1rem] font-bold leading-[1.05] text-navy-900">
            {words.map((w, i) => (
              <span key={w} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
                <motion.span className={cls('inline-block', i === 2 && 'gold-gradient')} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease: EASE }}>{w}</motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.7 }} className="mt-6 text-lg sm:text-xl text-slate-700">
            Expert coaching for <RotatingWord />
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-4 max-w-xl text-slate-600 leading-relaxed">
            Founded by {s.founderName || 'Mr. Vishal Khandekar Sir'}. Small batches, experienced faculty, regular tests and a portal that keeps parents informed — all under one roof since {s.established}.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }} className="mt-9 flex flex-wrap gap-3">
            <Link to="/contact#enquiry" className="group relative btn-gold px-7 py-3.5 text-base overflow-hidden">
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <span className="relative flex items-center gap-2">Book a free counselling <ArrowRight size={18} className="group-hover:translate-x-1 transition" /></span>
            </Link>
            <Link to="/study-material" className="btn px-7 py-3.5 text-base border border-slate-300 bg-white text-navy-800 hover:border-red-300 hover:text-red-700"><Download size={17} />Free study material</Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-slate-600">
            {['8th to 12th · English medium', 'B.Com & BAF', 'Parent updates on WhatsApp'].map((t) => <span key={t} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-red-600" />{t}</span>)}
          </motion.div>
        </div>
        <HeroVisual />
      </motion.div>
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-navy-900/0" />
    </section>
  )
}

// ---------------- MARQUEE ----------------
const SUBJECTS = ['Science 1 & 2', 'Algebra & Geometry', 'English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics', 'OCM', 'Secretarial Practice', 'Maths & Statistics', 'Financial Accounting', 'Cost Accounting', 'Taxation', 'Business Law', 'Auditing']
function Marquee() {
  return (
    <div className="relative bg-navy-900 py-4 overflow-hidden mask-fade-x">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {[...SUBJECTS, ...SUBJECTS].map((t, i) => <span key={i} className="mx-6 flex items-center gap-6 text-sm font-medium text-white whitespace-nowrap">{t}<span className="h-1.5 w-1.5 rotate-45 bg-red-500" /></span>)}
      </div>
    </div>
  )
}

// ---------------- STATS ----------------
function Stats({ s }) {
  const years = new Date().getFullYear() - Number(s.established || 2005)
  const items = [[years, '+', 'Years of teaching'], [Number(s.googleReviews || 0), '+', 'Google reviews'], [5, '', 'Classes, 8th to 12th'], [3, '', 'Years of B.Com & BAF']]
  return (
    <section className="relative z-10 pt-16">
      <div className="container-x">
        <div className="grid grid-cols-2 lg:grid-cols-4 rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(16,36,69,0.35)] ring-1 ring-slate-100 overflow-hidden">
          {items.map(([n, suf, l], i) => (
            <Reveal key={l} i={i} className={cls('p-6 sm:p-8 text-center', i % 2 === 0 && 'border-r border-slate-100', i < 2 && 'border-b lg:border-b-0 border-slate-100', i === 1 && 'lg:border-r')}>
              <div className="font-serif text-4xl sm:text-5xl font-bold text-navy-900"><Counter to={n} suffix={suf} /></div>
              <div className="mt-2 text-sm font-medium text-slate-500">{l}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- PROGRAMS (spotlight cards) ----------------
function SpotCard({ p, i }) {
  const Icon = ICONS[p.icon] || BookOpen
  const [pos, setPos] = useState({ x: -400, y: -400 })
  return (
    <Reveal i={i % 3}>
      <Link to={`/courses#${p.slug}`} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }) }} onMouseLeave={() => setPos({ x: -400, y: -400 })}
        className="group relative block h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/40 hover:shadow-[0_30px_60px_-20px_rgba(16,36,69,0.3)]">
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(380px circle at ${pos.x}px ${pos.y}px, rgba(225,29,29,0.12), transparent 60%)` }} />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="h-14 w-14 rounded-2xl bg-navy-50 text-navy-700 grid place-items-center transition-all duration-500 group-hover:bg-navy-800 group-hover:text-gold-400 group-hover:rotate-[-6deg] group-hover:scale-110"><Icon size={24} /></div>
            <span className="font-serif text-5xl font-bold text-slate-100 transition-colors group-hover:text-gold-100">0{i + 1}</span>
          </div>
          <h3 className="mt-6 text-xl font-semibold text-navy-900">{p.title}</h3>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{p.summary}</p>
          <div className="mt-5 flex flex-wrap gap-1.5">{p.subjects.slice(0, 4).map((x) => <span key={x} className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100">{x}</span>)}</div>
          <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-navy-700">Explore program <ArrowRight size={15} className="transition-transform group-hover:translate-x-1.5" /></div>
        </div>
      </Link>
    </Reveal>
  )
}

// ---------------- FOUNDER ----------------
function Founder({ s }) {
  const name = s.founderName || 'Mr. Vishal Khandekar Sir'
  const title = s.founderTitle || 'Founder & Director'
  const initials = name.replace(/^(mr|mrs|ms|dr)\.?\s+/i, '').replace(/\s+sir$/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
  const pillars = [
    [Users, 'Personal attention', 'Small batches so every student is known, guided and followed up.'],
    [ClipboardCheck, 'Discipline & practice', 'Regular tests, marks analysis and revision until concepts are exam-ready.'],
    [Smartphone, 'Parents as partners', 'Attendance, marks and fees shared with parents on SMS and WhatsApp.'],
  ]
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-50/70 to-white py-24">
      <div className="container-x grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
        <Reveal className="relative">
          <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-blue-400/30 via-transparent to-red-500/20 blur-2xl" />
          <div className="relative aspect-[4/5] max-w-md overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900 p-9 flex flex-col justify-between text-white shadow-2xl">
            <div className="absolute inset-0 bg-grid opacity-60" />
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
            <div className="relative flex items-center justify-between"><Quote className="text-white/40" size={56} /><span className="rounded-full border border-red-400/50 bg-red-500/20 px-3 py-1 text-xs text-white">Since {s.established}</span></div>
            <div className="relative">
              {s.founderMessage
                ? <p className="font-serif text-2xl leading-snug">“{s.founderMessage}”</p>
                : <p className="font-serif text-2xl leading-snug">{s.tagline || 'A Home for Learning'}</p>}
              <div className="mt-8 flex items-center gap-4 border-t border-white/20 pt-6">
                {s.founderPhoto
                  ? <img src={s.founderPhoto} alt={name} className="h-14 w-14 rounded-full object-cover ring-2 ring-white/60" />
                  : <div className="h-14 w-14 rounded-full bg-red-600 grid place-items-center font-serif text-xl font-bold text-white ring-2 ring-white/40">{initials}</div>}
                <div><div className="font-semibold text-lg">{name}</div><div className="text-sm text-navy-200">{title}, {s.name}</div></div>
              </div>
            </div>
          </div>
        </Reveal>
        <div>
          <SectionTitle eyebrow="Our founder" title={`Founded and led by ${name}`} subtitle={`${name} is the founder and pioneer of ${s.name}. He built the academy at ${s.location} around one belief: with the right guidance, steady practice and parents kept in the loop, every student can do their best.`} />
          <div className="space-y-4">
            {pillars.map(([I, t, d], i) => (
              <Reveal key={t} i={i} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-navy-100 shadow-sm">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-red-600 text-white grid place-items-center"><I size={20} /></div>
                <div><div className="font-semibold text-navy-900">{t}</div><div className="text-sm text-slate-500">{d}</div></div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------- METHOD ----------------
function Method() {
  const steps = [
    [Users, 'Small batches', 'Focused attention, doubt solving in every lecture and personal progress reviews.'],
    [BookOpen, 'Structured notes', 'Chapterwise notes, formula sheets, worksheets and board papers for every subject.'],
    [ClipboardCheck, 'Test, analyse, improve', 'Timed online tests with instant scores, rank and question-wise analysis.'],
    [Smartphone, 'Parents in the loop', 'Attendance, results and fee updates reach parents on SMS and WhatsApp.'],
  ]
  return (
    <section className="py-24 bg-navy-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50 mask-fade-b" />
      <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-gold-500/10 blur-[100px]" />
      <div className="container-x relative">
        <SectionTitle light center eyebrow="How we teach" title="A complete learning system" subtitle="Every student follows the same proven cycle, from the first lecture to the final board exam." />
        <div className="relative grid md:grid-cols-4 gap-6">
          <motion.div className="hidden md:block absolute top-9 left-[12%] right-[12%] h-px bg-gradient-to-r from-gold-500/0 via-gold-500/60 to-gold-500/0 origin-left"
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: EASE }} />
          {steps.map(([I, t, d], i) => (
            <Reveal key={t} i={i} className="relative text-center">
              <motion.div whileHover={{ scale: 1.08, rotate: -4 }} className="relative mx-auto h-[72px] w-[72px] rounded-2xl bg-gradient-to-br from-navy-700 to-navy-800 border border-gold-500/30 grid place-items-center text-gold-400 shadow-[0_0_30px_rgba(225,29,29,0.15)]">
                <I size={28} /><span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gold-500 text-white text-xs font-bold grid place-items-center">{i + 1}</span>
              </motion.div>
              <h3 className="mt-6 font-semibold text-white text-lg">{t}</h3>
              <p className="mt-2 text-sm text-navy-200 leading-relaxed">{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- PORTAL SHOWCASE ----------------
function PortalShowcase() {
  const feats = [[ClipboardCheck, 'Online tests with instant results'], [Library, 'Digital library of notes & PYQs'], [CalendarCheck, 'Daily attendance with parent alerts'], [BarChart3, 'Performance analytics & rank'], [Bell, 'Notices & timetable'], [Smartphone, 'Android app for parents & staff']]
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-10 h-[30rem] w-[30rem] rounded-full bg-blue-100/60 blur-[100px]" />
      <div className="container-x relative grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <SectionTitle eyebrow="Students Academy portal" title="Learning that continues after class" subtitle="Every enrolled student and parent gets a personal login to the academy's learning portal." />
          <div className="grid sm:grid-cols-2 gap-3">
            {feats.map(([I, t], i) => (
              <Reveal key={t} i={i} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition hover:border-navy-200 hover:shadow-md">
                <div className="h-10 w-10 rounded-xl bg-navy-50 text-navy-700 grid place-items-center shrink-0"><I size={19} /></div><span className="text-sm font-medium text-slate-700">{t}</span>
              </Reveal>
            ))}
          </div>
          <Reveal i={3} className="mt-8 flex flex-wrap gap-3"><Link to="/portal" className="btn-navy px-6 py-3">Student / Parent login <ArrowRight size={16} /></Link></Reveal>
        </div>
        {/* mock dashboard */}
        <Reveal i={1}>
          <motion.div whileHover={{ rotateY: -4, rotateX: 3 }} style={{ perspective: 1000 }} transition={{ type: 'spring', stiffness: 120 }}
            className="relative rounded-[28px] border border-white bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 shadow-[0_40px_90px_-30px_rgba(16,36,69,0.45)]">
            <div className="flex items-center gap-1.5 mb-3 px-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="ml-3 text-[11px] text-slate-400">students-academy / portal</span></div>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <div className="rounded-2xl bg-white/80 p-2.5 space-y-1.5 shadow-sm">
                <div className="h-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-violet-500 mb-2" />
                {['Dashboard', 'Material', 'Tests', 'Results', 'Fees'].map((t, i) => <div key={t} className={cls('rounded-lg px-2 py-1.5 text-[10px] font-bold', i === 0 ? 'bg-gradient-to-r from-blue-600 to-cyan-400 text-white' : 'text-slate-500')}>{t}</div>)}
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[['Attendance', '94%', 'from-navy-700 to-navy-900'], ['Avg score', '81%', 'from-blue-500 to-blue-700'], ['Pending', '2', 'from-red-500 to-red-700']].map(([l, v, g], i) => (
                    <motion.div key={l} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }} className={cls('rounded-xl bg-gradient-to-br p-2.5 text-white shadow-md', g)}>
                      <div className="text-[9px] font-bold uppercase opacity-80">{l}</div><div className="text-lg font-extrabold">{v}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="rounded-xl bg-white/90 p-3 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-500 mb-2">Score trend</div>
                  <div className="flex items-end gap-1.5 h-20">
                    {[52, 61, 58, 70, 76, 74, 85, 92].map((h, i) => <motion.div key={i} className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-cyan-400" initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.07, duration: 0.6, ease: EASE }} />)}
                  </div>
                </div>
                <div className="rounded-xl bg-white/90 p-2.5 shadow-sm flex items-center gap-2"><PlayCircle size={16} className="text-blue-600" /><span className="text-[11px] font-semibold text-slate-600">Gravitation — Chapter Test · 15 min</span><span className="ml-auto rounded-md bg-gradient-to-r from-blue-600 to-cyan-400 px-2 py-0.5 text-[9px] font-bold text-white">Start</span></div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}

// ---------------- STUDY MATERIAL TEASER ----------------
function MaterialTeaser({ materials }) {
  const pub = materials.filter((m) => m.visibility === 'public')
  const cats = [['8th', '8th Standard'], ['9th', '9th Standard'], ['10th', '10th SSC'], ['11th Science', '11th Science'], ['12th Science', '12th Science'], ['11th Commerce', '11th Commerce'], ['12th Commerce', '12th Commerce'], ['B.Com', 'B.Com'], ['BAF', 'BAF']]
  return (
    <section className="py-24 bg-slate-50 border-y border-slate-100">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <SectionTitle eyebrow="Free study material" title="Notes, formula sheets & board papers" subtitle="Shared by Students Academy for every student. Download, print and revise." />
          <Reveal className="mb-12"><Link to="/study-material" className="btn-navy px-6 py-3">Browse all {pub.length} resources <ArrowRight size={16} /></Link></Reveal>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cats.map(([k, label], i) => {
            const n = pub.filter((m) => m.standard === k).length
            return (
              <Reveal key={k} i={i % 4}>
                <Link to={`/study-material?std=${encodeURIComponent(k)}`} className="group relative block overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-gold-500/40">
                  <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gold-100/0 transition-all duration-500 group-hover:bg-gold-100/80 group-hover:scale-150" />
                  <div className="relative">
                    <FileText className="text-gold-600" size={22} />
                    <div className="mt-4 font-semibold text-navy-900">{label}</div>
                    <div className="text-sm text-slate-500">{n} resource{n === 1 ? '' : 's'}</div>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------- NOTICES + ACHIEVERS ----------------
// ---------------- STREAM QUICK BAR ----------------
function StreamBar() {
  return (
    <div className="relative z-10 -mt-10 sm:-mt-12">
      <div className="container-x">
        <Reveal className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_-28px_rgba(11,26,51,0.45)]">
          <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar">
            <div className="hidden 2xl:flex shrink-0 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white"><GraduationCap size={17} className="text-red-400" />Choose your stream</div>
            {PROGRAMS.map((p) => {
              const I = ICONS[p.icon] || BookOpen
              return (
                <Link key={p.slug} to={`/courses#${p.slug}`} className="group flex shrink-0 lg:flex-1 items-center gap-2.5 rounded-xl px-3 py-3 transition hover:bg-navy-50">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white"><I size={17} /></span>
                  <span className="whitespace-nowrap text-[13px] font-semibold leading-tight text-navy-900">{p.short || p.title}</span>
                </Link>
              )
            })}
          </div>
        </Reveal>
      </div>
    </div>
  )
}

// ---------------- ACHIEVERS ----------------
function initialsOf(name = '') { return name.replace(/^sample\s*—?\s*/i, '').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'SA' }

function AchieverCard({ t }) {
  return (
    <div className="group w-[15.5rem] shrink-0 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-24px_rgba(11,26,51,0.4)]">
      <div className="relative mx-auto h-32 w-32">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-navy-800 p-[5px] transition-transform duration-500 group-hover:rotate-12">
          <div className="h-full w-full rounded-full bg-white p-[5px]">
            {t.photo
              ? <img src={t.photo} alt={t.name} loading="lazy" className="h-full w-full rounded-full object-cover" />
              : <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-navy-700 to-navy-900 font-serif text-3xl font-bold text-white">{initialsOf(t.name)}</div>}
          </div>
        </div>
        {t.rank && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold text-white shadow-md">{t.rank}</span>}
      </div>
      <div className="mt-5 font-serif text-3xl font-bold text-red-600">{t.score}</div>
      <div className="mt-1 font-semibold text-navy-900">{t.name}</div>
      <div className="text-xs text-slate-500">{t.exam}{t.year ? ` · ${t.year}` : ''}</div>
    </div>
  )
}

function Achievers({ toppers }) {
  const list = [...toppers].sort((a, b) => (a.order || 0) - (b.order || 0))
  if (!list.length) return null
  const scroll = list.length >= 5
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-navy-50/50 to-white py-24">
      <div className="container-x">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <SectionTitle eyebrow="Results" title="Our achievers" subtitle="Students who turned steady preparation into outstanding board and entrance results." />
          <Reveal className="mb-12"><Link to="/results" className="btn-navy">View all results <ArrowRight size={15} /></Link></Reveal>
        </div>
      </div>
      {scroll ? (
        <div className="mask-fade-x overflow-hidden">
          <div className="flex w-max gap-6 px-6 animate-marquee [animation-duration:55s] hover:[animation-play-state:paused]">
            {[...list, ...list].map((t, i) => <AchieverCard key={t.id + i} t={t} />)}
          </div>
        </div>
      ) : (
        <div className="container-x flex flex-wrap justify-center gap-6">{list.map((t, i) => <Reveal key={t.id} i={i}><AchieverCard t={t} /></Reveal>)}</div>
      )}
    </section>
  )
}

// ---------------- WHY CHOOSE US ----------------
function WhyUs({ s }) {
  const items = [
    [ShieldCheck, 'A name families trust', `Serving students and parents at ${s.location} since ${s.established}, with results that speak for themselves.`],
    [GraduationCap, 'Experienced faculty', 'Subject specialists who know the board and entrance patterns inside out.'],
    [Building2, 'Focused classrooms', 'Small, well-managed batches so every student gets attention.'],
    [ClipboardCheck, 'Regular tests & doubt solving', 'Weekly tests, marks analysis and dedicated doubt-solving time.'],
    [BookOpen, 'Comprehensive notes', 'Structured chapterwise notes, worksheets and past papers for every subject.'],
    [HeartHandshake, 'Student-first approach', 'Personal follow-up and constant updates to parents on progress.'],
  ]
  return (
    <section className="py-24">
      <div className="container-x">
        <SectionTitle center eyebrow="Why Students Academy" title={`Grant Road's trusted coaching academy since ${s.established}`} subtitle={`Founded by ${s.founderName || 'Mr. Vishal Khandekar Sir'}, built on clear teaching, discipline and care.`} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(([I, title, d], i) => (
            <Reveal key={title} i={i % 3}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_30px_60px_-28px_rgba(11,26,51,0.45)]">
                <div className="absolute inset-0 bg-gradient-to-br from-navy-800 to-navy-950 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100 transition group-hover:bg-red-600 group-hover:text-white group-hover:ring-red-500"><I size={24} /></div>
                  <h3 className="mt-5 text-lg font-semibold text-navy-900 transition-colors group-hover:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 transition-colors group-hover:text-navy-200">{d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- TESTIMONIALS ----------------
function ytId(url = '') { const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : null }

function Testimonials({ items }) {
  const list = [...items].sort((a, b) => (a.order || 0) - (b.order || 0))
  const streams = ['All', ...new Set(list.map((t) => t.stream).filter(Boolean))]
  const [tab, setTab] = useState('All')
  const [video, setVideo] = useState(null)
  if (!list.length) return null
  const shown = list.filter((t) => tab === 'All' || t.stream === tab)
  const videos = list.filter((t) => ytId(t.videoUrl))
  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 text-white">
      <div className="absolute inset-0 bg-grid opacity-50 mask-fade-b" />
      <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-blue-600/20 blur-[110px]" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-red-600/20 blur-[110px]" />
      <div className="container-x relative">
        <SectionTitle light center eyebrow="Testimonials" title="What students & parents say" />
        {videos.length > 0 && (
          <div className="mb-12 flex gap-5 overflow-x-auto pb-2 no-scrollbar snap-x">
            {videos.map((t) => (
              <button key={t.id} onClick={() => setVideo(ytId(t.videoUrl))} className="group relative aspect-video w-72 shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-white/10">
                <img src={`https://i.ytimg.com/vi/${ytId(t.videoUrl)}/hqdefault.jpg`} alt={t.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-transparent" />
                <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-red-600 shadow-lg transition group-hover:scale-110"><Play size={22} className="ml-0.5 fill-white" /></span>
                <span className="absolute bottom-3 left-4 text-left text-sm font-semibold">{t.name}<span className="block text-[11px] font-normal text-navy-200">{t.role}</span></span>
              </button>
            ))}
          </div>
        )}
        {streams.length > 2 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {streams.map((x) => <button key={x} onClick={() => setTab(x)} className={cls('rounded-full px-4 py-2 text-sm font-semibold transition', tab === x ? 'bg-red-600 text-white' : 'bg-white/[0.07] text-navy-100 ring-1 ring-white/10 hover:bg-white/[0.12]')}>{x}</button>)}
          </div>
        )}
        <motion.div layout className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((t) => (
              <motion.figure layout key={t.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}
                className="flex flex-col rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10 backdrop-blur">
                <Quote className="text-red-500" size={30} />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-navy-100">{t.text}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  {t.photo ? <img src={t.photo} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-red-500/60" /> : <div className="grid h-11 w-11 place-items-center rounded-full bg-red-600 text-sm font-bold">{initialsOf(t.name)}</div>}
                  <div><div className="font-semibold">{t.name}</div><div className="text-xs text-navy-300">{t.role}</div></div>
                </figcaption>
              </motion.figure>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      <AnimatePresence>
        {video && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setVideo(null)} className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl">
              <button onClick={() => setVideo(null)} className="absolute -top-11 right-0 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close"><X size={18} /></button>
              <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl"><iframe title="Testimonial video" className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ---------------- NOTICES ----------------
function Notices({ notices }) {
  const pub = notices.filter((n) => n.publishOnWebsite).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)
  if (!pub.length) return null
  return (
    <section className="py-24">
      <div className="container-x">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <SectionTitle eyebrow="Notice board" title="Latest from the academy" />
          <Reveal className="mb-12"><Link to="/notices" className="text-sm font-semibold text-navy-700 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">All notices <ArrowRight size={15} /></Link></Reveal>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {pub.map((n, i) => (
            <Reveal key={n.id} i={i}>
              <Link to="/notices" className="group flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 transition-all hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-14 shrink-0 rounded-xl bg-navy-800 py-2 text-center text-white transition-colors group-hover:bg-red-600">
                    <div className="text-xl font-bold leading-none">{new Date(n.createdAt).getDate()}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-navy-200 group-hover:text-red-100">{new Date(n.createdAt).toLocaleString('en', { month: 'short' })}</div>
                  </div>
                  {n.pinned && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600"><Pin size={12} />Pinned</span>}
                </div>
                <div className="mt-4 font-semibold text-navy-900">{n.title}</div>
                <p className="mt-1.5 text-sm text-slate-600 line-clamp-3">{n.body}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- WE'RE LISTENING ----------------
function Listening({ s }) {
  return (
    <section id="enquire" className="relative overflow-hidden bg-gradient-to-b from-navy-50/70 to-white py-24 scroll-mt-24">
      <div className="container-x grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <SectionTitle eyebrow="We're listening" title="Talk to our counsellor" subtitle="Tell us the class and stream, and we will call you back with batches, timings and fees." />
          <div className="space-y-3">
            {[[Phone, 'Call us', s.phone, `tel:${s.phone}`], [MessageCircle, 'WhatsApp', 'Chat with the office', `https://wa.me/${s.whatsapp}`], [MapPin, 'Visit us', s.address, '/contact']].map(([I, l, v, href]) => (
              <a key={l} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-navy-200 hover:shadow-md">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-800 text-white transition group-hover:bg-red-600"><I size={19} /></span>
                <span className="min-w-0"><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{l}</span><span className="block truncate text-sm font-medium text-navy-900">{v}</span></span>
              </a>
            ))}
          </div>
        </div>
        <Reveal className="relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(11,26,51,0.5)] sm:p-9">
          <div className="absolute inset-x-10 top-0 h-1 rounded-b-full bg-gradient-to-r from-navy-700 via-blue-600 to-red-500" />
          <h3 className="font-serif text-2xl font-bold text-navy-900">Enquiry form</h3>
          <p className="mb-6 mt-1 text-sm text-slate-500">Our counsellor will get back to you within one working day.</p>
          <EnquiryForm />
        </Reveal>
      </div>
    </section>
  )
}

// ---------------- FAQ ----------------
const FAQS = [
  ['Which classes and courses do you teach?', '8th, 9th and 10th (English medium), FYJC & SYJC Science and Commerce, and FY, SY & TY B.Com and BAF.'],
  ['Where is the academy and what are the timings?', 'We are at Vidya Chamber, Nana Chowk, Grant Road (West), opposite Orbit Heights Tower. The academy is open every day from 8 AM to 8 PM; call +91 77180 88017 for batch timings.'],
  ['Do students get study material?', 'Yes. Enrolled students get chapterwise notes, worksheets, assignments and online tests in the student portal, and selected material is shared publicly on this website.'],
  ['How will I know how my child is doing?', 'Every parent gets a portal login to see attendance, test results, assignments and fees. The academy also sends attendance, result and fee updates on SMS and WhatsApp.'],
  ['How do I take admission and what are the fees?', 'Send an enquiry, WhatsApp us or visit the academy. A counsellor will explain batches, timings and the current fee structure for your course.'],
]
function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <section className="py-24 bg-slate-50 border-y border-slate-100">
      <div className="container-x grid lg:grid-cols-[0.8fr_1.2fr] gap-12">
        <div>
          <SectionTitle eyebrow="FAQ" title="Questions parents ask us" subtitle="Can't find your answer? Send us a message and our counsellor will call you back." />
          <Reveal i={2}><Link to="/contact#enquiry" className="btn-navy px-6 py-3">Ask a question <ArrowRight size={16} /></Link></Reveal>
        </div>
        <div className="space-y-3">
          {FAQS.map(([q, a], i) => (
            <Reveal key={q} i={i % 3}>
              <div className={cls('rounded-2xl border bg-white transition-all duration-300', open === i ? 'border-gold-500/40 shadow-[0_18px_40px_-18px_rgba(16,36,69,0.3)]' : 'border-slate-200/80')}>
                <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className="font-semibold text-navy-900">{q}</span>
                  <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.25 }} className={cls('grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg font-light', open === i ? 'bg-navy-800 text-gold-400' : 'bg-slate-100 text-navy-800')}>+</motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                    <p className="px-6 pb-5 text-slate-600 leading-relaxed">{a}</p>
                  </motion.div>}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- CTA ----------------
function CTA({ s }) {
  return (
    <section className="container-x pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] p-[1.5px] bg-[linear-gradient(110deg,#dc2626,#fecaca,#2f5597,#dc2626)] bg-[length:200%_100%] animate-shine">
          <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-gradient-to-br from-red-600 to-red-700 px-8 py-14 sm:px-14 text-white">
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl animate-aurora" />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-white/90"><span className="h-px w-8 bg-white/60" />Admissions 2026–27</div>
                <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-white">Give your child the right start.</h2>
                <p className="mt-3 text-red-50">Visit us at {s.location}, call, or send an enquiry. Our counsellor will help you choose the right batch.</p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link to="/contact#enquiry" className="btn bg-white text-red-700 hover:bg-red-50 px-7 py-3.5 text-base shadow-lg">Enquire now <ArrowRight size={17} /></Link>
                <a href={`tel:${s.phone}`} className="btn px-7 py-3.5 text-base border border-white/40 text-white hover:bg-white/10"><Phone size={16} />Call us</a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default function Home() {
  const s = useSettings()
  const [materials] = useTable('materials'); const [notices] = useTable('notices'); const [toppers] = useTable('toppers'); const [testimonials] = useTable('testimonials')
  return (
    <>
      <Hero s={s} />
      <StreamBar />
      <div className="pt-16"><Stats s={s} /></div>
      <Achievers toppers={toppers} />
      <section className="py-24">
        <div className="container-x">
          <SectionTitle center eyebrow="Programs" title="Courses for every stream" subtitle="From 8th standard to the final year of B.Com and BAF, under one roof at Nana Chowk." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{PROGRAMS.map((p, i) => <SpotCard key={p.slug} p={p} i={i} />)}</div>
        </div>
      </section>
      <Marquee />
      <WhyUs s={s} />
      <Founder s={s} />
      <Method />
      <PortalShowcase />
      <Testimonials items={testimonials} />
      {materials.some((m) => m.visibility === 'public') && <MaterialTeaser materials={materials} />}
      <Notices notices={notices} />
      <Listening s={s} />
      <FAQ />
      <div className="pt-8"><CTA s={s} /></div>
    </>
  )
}
