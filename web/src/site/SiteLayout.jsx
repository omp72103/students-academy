import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, Phone, Mail, MapPin, Clock, MessageCircle, LogIn, GraduationCap } from 'lucide-react'
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
  ['/sarav-pariksha', 'Sarav Pariksha'], ['/results', 'Results'], ['/notices', 'Notices'], ['/contact', 'Contact'],
]

export function Logo({ light }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="h-10 w-10 rounded-lg bg-navy-800 grid place-items-center ring-2 ring-gold-500/60"><GraduationCap className="text-gold-400" size={22} /></div>
      <div className="leading-tight">
        <div className={cls('font-serif text-lg font-bold', light ? 'text-white' : 'text-navy-900')}>Students Academy</div>
        <div className={cls('text-[11px] tracking-wider uppercase', light ? 'text-navy-200' : 'text-slate-500')}>Grant Road · Mumbai</div>
      </div>
    </Link>
  )
}

export default function SiteLayout() {
  const s = useSettings()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-navy-900 text-navy-100 text-xs">
        <div className="container-x flex items-center justify-between h-9 gap-4">
          <div className="flex items-center gap-4 overflow-hidden">
            <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 hover:text-white"><Phone size={13} />{s.phone}</a>
            <a href={`mailto:${s.email}`} className="hidden sm:flex items-center gap-1.5 hover:text-white"><Mail size={13} />{s.email}</a>
            <span className="hidden md:flex items-center gap-1.5"><Clock size={13} />{s.timings}</span>
          </div>
          <Link to="/portal" className="flex items-center gap-1.5 text-gold-400 hover:text-gold-100 font-medium shrink-0"><LogIn size={13} />Student / Parent Login</Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="container-x flex items-center justify-between h-16">
          <Logo />
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cls('px-3 py-2 text-sm font-medium rounded-md', isActive ? 'text-navy-800 bg-navy-50' : 'text-slate-600 hover:text-navy-800')}>{label}</NavLink>
            ))}
            <Link to="/contact#enquiry" className="btn-navy ml-2">Enquire Now</Link>
          </nav>
          <button className="lg:hidden btn-ghost p-2" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="lg:hidden border-t bg-white">
            <div className="container-x py-2 flex flex-col">
              {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => cls('px-3 py-2.5 rounded-md text-sm font-medium', isActive ? 'bg-navy-50 text-navy-800' : 'text-slate-700')}>{label}</NavLink>)}
              <Link to="/portal" onClick={() => setOpen(false)} className="btn-navy my-2">Login to Portal</Link>
            </div>
          </div>
        )}
      </header>

      {s.admissionsOpen && loc.pathname === '/' && (
        <div className="bg-gold-50 border-b border-gold-100 text-navy-800 text-sm">
          <div className="container-x py-2 text-center">{s.admissionBanner} <Link to="/contact#enquiry" className="font-semibold underline underline-offset-2">Enquire →</Link></div>
        </div>
      )}

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-navy-900 text-navy-100 mt-16">
        <div className="container-x py-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo light />
            <p className="mt-4 text-sm text-navy-200 max-w-md leading-relaxed">
              Coaching for SSC 9th & 10th, FYJC/SYJC Science, Commerce, IT, Computer Science and Electronics, and MHT-CET / JEE / NEET — with handcrafted notes and a structured learning portal.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">{NAV.slice(1).map(([to, l]) => <li key={to}><Link to={to} className="hover:text-white">{l}</Link></li>)}</ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Reach Us</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex gap-2"><MapPin size={16} className="shrink-0 mt-0.5 text-gold-400" />{s.address}</li>
              <li className="flex gap-2"><Phone size={16} className="shrink-0 text-gold-400" />{s.phone}</li>
              <li className="flex gap-2"><Mail size={16} className="shrink-0 text-gold-400" />{s.email}</li>
              <li className="flex gap-2"><Clock size={16} className="shrink-0 text-gold-400" />{s.timings}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-navy-800">
          <div className="container-x py-4 text-xs text-navy-200 flex flex-col sm:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} {s.name}, {s.location}. All rights reserved.</span>
            <span>Study material courtesy <a className="underline" href="https://saiphy.com" target="_blank" rel="noreferrer">SaiPhy</a></span>
          </div>
        </div>
      </footer>

      <button onClick={() => openWhatsApp(s.whatsapp, 'Hello Students Academy, I would like to know more about admissions.')}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg grid place-items-center hover:scale-105 transition" aria-label="WhatsApp">
        <MessageCircle size={26} />
      </button>
    </div>
  )
}
