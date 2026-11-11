import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import { Menu, X, Phone, Mail, MapPin, Clock, MessageCircle, LogIn, GraduationCap, ArrowRight, ArrowUp } from 'lucide-react'
import { useTable } from '../lib/db'
import { DEFAULT_SETTINGS } from '../data/site'
import { openWhatsApp } from '../lib/messaging'
import { cls } from '../lib/utils'

export function useSettings() {
  const [rows] = useTable('settings')
  return { ...DEFAULT_SETTINGS, ...(rows.find((r) => r.id === 'institute') || {}) }
}

const NAV = [
  ['/', 'Home'], ['/about', 'About'], ['/courses', 'Courses'], ['/study-material', 'Study Material'],
  ['/results', 'Results'], ['/notices', 'Notices'], ['/contact', 'Contact'],
]

export function Logo({ light }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <div className="relative h-10 w-10 rounded-xl bg-red-600 grid place-items-center shadow-md shadow-red-600/25 transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <GraduationCap className="text-white" size={22} />
      </div>
      <div className="leading-tight">
        <div className={cls('font-serif text-lg font-bold transition-colors', light ? 'text-white' : 'text-navy-900')}>Students Academy</div>
        <div className={cls('text-[10px] tracking-[0.2em] uppercase transition-colors', light ? 'text-white/70' : 'text-slate-500')}>Grant Road · Mumbai</div>
      </div>
    </Link>
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
          <Link to="/portal" className="flex items-center gap-1.5 text-gold-400 hover:text-gold-100 font-medium shrink-0"><LogIn size={13} />Student / Parent Login</Link>
        </div>
      </div>

      <header className={cls('sticky top-0 z-40 h-[72px] transition-all duration-500',
        light ? 'bg-transparent' : 'bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_10px_30px_-15px_rgba(76,10,15,0.25)]')}>
        <div className="container-x flex items-center justify-between h-full">
          <Logo light={light} />
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cls('relative px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                light ? (isActive ? 'text-white' : 'text-white/75 hover:text-white') : (isActive ? 'text-red-600' : 'text-slate-600 hover:text-red-600'))}>
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
                    <NavLink to={to} end={to === '/'} className={({ isActive }) => cls('block px-3 py-3 rounded-lg text-[15px] font-medium', isActive ? 'bg-red-50 text-red-700' : 'text-slate-700')}>{label}</NavLink>
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
              Coaching for SSC 9th & 10th, FYJC/SYJC Science, Commerce, IT, Computer Science and Electronics, and MHT-CET / JEE / NEET, with experienced faculty and a structured learning portal.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => openWhatsApp(s.whatsapp, 'Hello Students Academy, I would like to know more about admissions.')} className="btn btn-sm bg-[#25D366] text-white hover:brightness-110"><MessageCircle size={14} />WhatsApp</button>
              <a href={`tel:${s.phone}`} className="btn btn-sm border border-white/15 text-white hover:bg-white/10"><Phone size={14} />Call</a>
            </div>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Quick Links</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2.5 text-sm">{NAV.slice(1).map(([to, l]) => <li key={to}><Link to={to} className="hover:text-gold-400 transition-colors">{l}</Link></li>)}<li><Link to="/portal" className="hover:text-gold-400">Portal Login</Link></li></ul>
          </div>
          <div className="md:col-span-4">
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
