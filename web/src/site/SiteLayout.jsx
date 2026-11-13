import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import { Menu, X, Phone, Mail, MapPin, Clock, MessageCircle, LogIn, GraduationCap, ArrowRight, ArrowUp, ChevronDown, ChevronRight } from 'lucide-react'
import { SocialIcon, socialLinks } from '../components/Social'
import { useTable } from '../lib/db'
import { DEFAULT_SETTINGS, PROGRAMS } from '../data/site'
import { openWhatsApp } from '../lib/messaging'
import { cls } from '../lib/utils'

// Values saved before the academy's real details were added. If the stored profile still holds one
// of these, the real default is used instead (the next Save in Portal → Settings stores it properly).
const OLD_PLACEHOLDERS = {
  phone: ['+91 00000 00000', ''], whatsapp: ['910000000000', ''], email: ['', 'saiphy.learning@gmail.com'],
  address: ['Students Academy, Grant Road (West), Mumbai, Maharashtra 400007'],
  location: ['Grant Road (West), Mumbai'], timings: ['Mon – Sat · 8:00 AM – 9:00 PM'],
  mapQuery: ['Students Academy Grant Road West Mumbai'], established: ['2012'], tagline: ['A Home for Learning — Since 2012'],
}

export function useSettings() {
  const [rows] = useTable('settings')
  const saved = { ...(rows.find((r) => r.id === 'institute') || {}) }
  for (const [k, olds] of Object.entries(OLD_PLACEHOLDERS)) if (k in saved && olds.includes(saved[k] ?? '')) delete saved[k]
  if (/MHT-CET|IT, MHT|Electronics/.test(saved.admissionBanner || '')) delete saved.admissionBanner
  return { ...DEFAULT_SETTINGS, ...saved }
}

const NAV = [
  ['/', 'Home'], ['/about', 'About'], ['/courses', 'Courses'], ['/study-material', 'Study Material'],
  ['/results', 'Results'], ['/notices', 'Notices'], ['/contact', 'Contact'],
]

export function Logo({ light }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <div className="relative h-10 w-10 rounded-xl bg-navy-800 grid place-items-center shadow-md shadow-navy-800/25 ring-2 ring-red-500/70 transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <GraduationCap className="text-white" size={22} />
      </div>
      <div className="leading-tight">
        <div className={cls('font-serif text-lg font-bold transition-colors', light ? 'text-white' : 'text-navy-900')}>Students Academy</div>
        <div className={cls('text-[10px] tracking-[0.2em] uppercase transition-colors', light ? 'text-white/70' : 'text-slate-500')}>Grant Road · Mumbai</div>
      </div>
    </Link>
  )
}

function CoursesMenu() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname, loc.hash])
  const active = loc.pathname.startsWith('/courses')
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link to="/courses" className={cls('relative flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors', active ? 'text-navy-900' : 'text-slate-600 hover:text-navy-800')}
        aria-haspopup="true" aria-expanded={open} onFocus={() => setOpen(true)}>
        Courses <ChevronDown size={14} className={cls('transition-transform', open && 'rotate-180')} />
        {active && <motion.span layoutId="nav-underline" className="absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full bg-gold-500" />}
      </Link>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}
            className="absolute left-1/2 top-full -translate-x-1/2 pt-3 w-[20rem]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(11,26,51,0.35)]">
              <div className="h-1 bg-gradient-to-r from-navy-700 via-blue-600 to-red-500" />
              <div className="p-2">
                {PROGRAMS.map((p) => (
                  <Link key={p.slug} to={`/courses#${p.slug}`} className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-navy-50">
                    <span className="min-w-0"><span className="block text-sm font-semibold text-navy-900">{p.short || p.title}</span><span className="block truncate text-xs text-slate-500">{p.title}</span></span>
                    <ChevronRight size={15} className="shrink-0 text-slate-300 group-hover:text-red-500 transition" />
                  </Link>
                ))}
              </div>
              <Link to="/courses" className="block border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold text-red-600 hover:text-red-700">View all courses →</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SiteLayout() {
  const s = useSettings()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const loc = useLocation()
  const isHome = loc.pathname === '/'
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  useEffect(() => { const h = () => setScrolled(window.scrollY > 24); h(); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h) }, [])
  useEffect(() => setOpen(false), [loc.pathname])
  const light = false // all pages now open on a white hero

  return (
    <div className="min-h-screen flex flex-col">
      <motion.div style={{ scaleX: progress }} className="fixed top-0 inset-x-0 h-[3px] origin-left z-[60] bg-gradient-to-r from-gold-600 via-gold-400 to-red-200" />
      <div className="bg-navy-900 text-navy-100 text-xs border-b border-white/5">
        <div className="container-x flex items-center justify-between h-9 gap-4">
          <div className="flex items-center gap-5 overflow-hidden">
            <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 hover:text-white"><Phone size={13} />{s.phone}</a>
            {s.email && <a href={`mailto:${s.email}`} className="hidden sm:flex items-center gap-1.5 hover:text-white"><Mail size={13} />{s.email}</a>}
            <span className="hidden md:flex items-center gap-1.5"><Clock size={13} />{s.timings}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {socialLinks(s).length > 0 && <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-white/10">
              {socialLinks(s).map(([k, label, url]) => <a key={k} href={url} target="_blank" rel="noreferrer" aria-label={label} className="text-navy-200 hover:text-white transition"><SocialIcon name={k} size={13} /></a>)}
            </div>}
            <Link to="/portal" className="flex items-center gap-1.5 text-gold-400 hover:text-gold-100 font-medium"><LogIn size={13} />Student / Parent Login</Link>
          </div>
        </div>
      </div>

      <header className={cls('sticky top-0 z-40 h-[72px] transition-all duration-500',
        light ? 'bg-transparent' : 'bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_10px_30px_-15px_rgba(16,36,69,0.25)]')}>
        <div className="container-x flex items-center justify-between h-full">
          <Logo light={light} />
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map(([to, label]) => to === '/courses' ? <CoursesMenu key={to} /> : (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cls('relative px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                light ? (isActive ? 'text-white' : 'text-white/75 hover:text-white') : (isActive ? 'text-navy-900' : 'text-slate-600 hover:text-navy-800'))}>
                {({ isActive }) => <>
                  {label}
                  {isActive && <motion.span layoutId="nav-underline" className="absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full bg-gold-500" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                </>}
              </NavLink>
            ))}
            <Link to="/contact#enquiry" className="ml-3 btn-gold">Enquire Now <ArrowRight size={15} /></Link>
          </nav>
          <button className={cls('lg:hidden p-2 rounded-lg', light ? 'text-white' : 'text-navy-900')} onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden overflow-hidden border-t bg-white shadow-xl">
              <div className="container-x py-3 flex flex-col">
                {NAV.map(([to, label], i) => (
                  <motion.div key={to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <NavLink to={to} end={to === '/'} className={({ isActive }) => cls('block px-3 py-3 rounded-lg text-[15px] font-medium', isActive ? 'bg-navy-50 text-navy-800' : 'text-slate-700')}>{label}</NavLink>
                  </motion.div>
                ))}
                <div className="grid grid-cols-2 gap-2 my-3">
                  <Link to="/contact#enquiry" className="btn-gold">Enquire</Link>
                  <Link to="/portal" className="btn-navy">Login</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative bg-navy-900 text-navy-100 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40 mask-fade-b" />
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="container-x relative py-14 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo light />
            <p className="mt-5 text-sm text-navy-200 max-w-md leading-relaxed">
              Coaching for 8th, 9th & 10th (English medium), FYJC & SYJC Science and Commerce, and FY, SY & TY B.Com and BAF at Nana Chowk, Grant Road since 2005.
            </p>
            {socialLinks(s).length > 0 && <div className="mt-6 flex gap-2">
              {socialLinks(s).map(([k, label, url]) => <a key={k} href={url} target="_blank" rel="noreferrer" aria-label={label} className="h-9 w-9 rounded-full border border-white/15 grid place-items-center text-navy-100 hover:bg-red-600 hover:border-red-600 hover:text-white transition"><SocialIcon name={k} size={15} /></a>)}
            </div>}
            <div className="mt-6 flex gap-2">
              <button onClick={() => openWhatsApp(s.whatsapp, 'Hello Students Academy, I would like to know more about admissions.')} className="btn btn-sm bg-[#25D366] text-white hover:brightness-110"><MessageCircle size={14} />WhatsApp</button>
              <a href={`tel:${s.phone}`} className="btn btn-sm border border-white/15 text-white hover:bg-white/10"><Phone size={14} />Call</a>
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Quick Links</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2.5 text-sm">{NAV.slice(1).map(([to, l]) => <li key={to}><Link to={to} className="hover:text-gold-400 transition-colors">{l}</Link></li>)}<li><Link to="/portal" className="hover:text-gold-400">Portal Login</Link></li></ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Courses</h4>
            <ul className="space-y-2.5 text-sm">{PROGRAMS.map((p) => <li key={p.slug}><Link to={`/courses#${p.slug}`} className="hover:text-gold-400 transition-colors">{p.short || p.title.split(' (')[0].split(' —')[0]}</Link></li>)}</ul>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Reach Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><MapPin size={16} className="shrink-0 mt-0.5 text-gold-400" />{s.address}</li>
              <li className="flex gap-3"><Phone size={16} className="shrink-0 text-gold-400" />{s.phone}</li>
              {s.email && <li className="flex gap-3"><Mail size={16} className="shrink-0 text-gold-400" />{s.email}</li>}
              <li className="flex gap-3"><Clock size={16} className="shrink-0 text-gold-400" />{s.timings}</li>
            </ul>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="container-x py-5 text-xs text-navy-200 flex flex-col sm:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} {s.name}, {s.location}. All rights reserved.</span>
            <span>Founded by {s.founderName || 'Mr. Vishal Khandekar Sir'}</span>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {scrolled && <motion.button initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 z-40 h-11 w-11 rounded-full bg-navy-800 text-gold-400 shadow-lg grid place-items-center hover:bg-navy-900" aria-label="Back to top"><ArrowUp size={18} /></motion.button>}
      </AnimatePresence>
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: 'spring' }}
        onClick={() => openWhatsApp(s.whatsapp, 'Hello Students Academy, I would like to know more about admissions.')}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,0.45)] grid place-items-center hover:scale-110 transition" aria-label="WhatsApp">
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
        <MessageCircle size={26} className="relative" />
      </motion.button>
    </div>
  )
}
