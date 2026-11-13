// Shared portal UI — same design language as APT-Tech AI Prep / MITK Campus ERP:
// clay/glass surfaces, gradient stat tiles with count-up, blue→violet gradient card headers.
import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Inbox, CheckCircle2, AlertTriangle, ArrowUpRight, MoreHorizontal, GraduationCap, UserRound, UserCog, Layers, CalendarDays, CalendarCheck, Library, ClipboardList, BarChart3, NotebookPen, Wallet, Megaphone, MessageSquare, Globe, Settings, PhoneCall } from 'lucide-react'
import { cls } from '../lib/utils'

const EASE = [0.16, 1, 0.3, 1]

const ROUTE_ICONS = { students: GraduationCap, parents: UserRound, faculty: UserCog, batches: Layers, timetable: CalendarDays, attendance: CalendarCheck,
  materials: Library, tests: ClipboardList, results: BarChart3, assignments: NotebookPen, fees: Wallet, notices: Megaphone, messaging: MessageSquare,
  website: Globe, settings: Settings, enquiries: PhoneCall }

export function PageHeader({ title, subtitle, actions, icon, eyebrow }) {
  const { pathname } = useLocation()
  const Icon = icon || ROUTE_ICONS[pathname.split('/')[2]]
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {Icon && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-navy-800 shadow-lg shadow-blue-500/20">
            <Icon className="h-7 w-7 text-white" strokeWidth={2.3} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600">{eyebrow}</p>}
          <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm font-medium text-slate-500 md:text-base">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">{actions}</div>}
    </motion.div>
  )
}

export function SectionLabel({ children, className }) {
  return (
    <div className={cls('flex items-center gap-3 px-1', className)}>
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">{children}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  )
}

export function CountUp({ value, duration = 0.9, delay = 0 }) {
  const [display, setDisplay] = useState(0)
  const str = String(value ?? '')
  const m = str.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/)
  const numeric = m ? parseFloat(m[2].replace(/,/g, '')) : NaN
  useEffect(() => {
    if (!Number.isFinite(numeric)) return
    let raf; const start = performance.now() + delay * 1000
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / (duration * 1000)))
      setDisplay(numeric * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [numeric, duration, delay])
  if (!Number.isFinite(numeric)) return <>{value}</>
  const decimals = (m[2].split('.')[1] || '').length
  const shown = m[2].includes(',') || numeric >= 1000 ? Math.round(display).toLocaleString('en-IN') : display.toFixed(decimals)
  return <>{m[1]}{shown}{m[3]}</>
}

const ACCENTS = {
  indigo: 'from-blue-500 via-blue-600 to-blue-700',
  sky: 'from-navy-600 via-navy-700 to-navy-900',
  emerald: 'from-emerald-500 via-emerald-600 to-teal-700',
  amber: 'from-amber-500 via-amber-600 to-orange-600',
  rose: 'from-rose-500 via-red-600 to-red-700',
  violet: 'from-red-500 via-red-600 to-red-700',
  slate: 'from-slate-600/90 via-slate-700/85 to-slate-800/80',
}

/** Gradient glass stat tile (MITK StatCourseCard). `progress` (0–100) and `to` are optional. */
export function Stat({ icon: Icon, label, value, hint, tone = 'indigo', progress, to, index = 0 }) {
  const body = (
    <div className={cls('relative h-full rounded-[22px] bg-gradient-to-br p-5 text-white border border-white/25 ring-1 ring-white/20 overflow-hidden backdrop-blur-xl',
      'shadow-[0_16px_40px_-12px_rgba(15,23,42,0.45)] group-hover:shadow-[0_26px_54px_-12px_rgba(15,23,42,0.5)] transition-all duration-500', ACCENTS[tone] || ACCENTS.indigo)}>
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -inset-y-10 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:translate-x-[380%] transition-transform duration-[1100ms] ease-out" />
      </div>
      <div className="pointer-events-none absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between mb-3">
        <motion.div whileHover={{ scale: 1.12, rotate: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}
          className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 grid place-items-center backdrop-blur-md shadow-inner">
          {Icon && <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />}
        </motion.div>
        {to ? <ArrowUpRight className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> : <MoreHorizontal className="w-5 h-5 text-white/40" />}
      </div>
      <p className="relative text-[11px] font-bold uppercase tracking-wide text-white/80">{label}</p>
      <h3 className="relative font-heading text-[1.7rem] leading-tight font-extrabold text-white tabular-nums mt-0.5"><CountUp value={value} delay={index * 0.07 + 0.15} /></h3>
      {progress != null && (
        <div className="relative mt-3">
          <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
            <motion.div className="h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ background: "#fff" }} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }} transition={{ duration: 0.9, delay: index * 0.07 + 0.25, ease: EASE }} />
          </div>
        </div>
      )}
      {hint && <div className="relative mt-3 pt-2.5 border-t border-white/20 text-[11px] font-semibold text-white/85 truncate">{hint}</div>}
    </div>
  )
  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: index * 0.07, duration: 0.5, ease: EASE }}
      whileHover={{ y: -5 }} className="group h-full">
      {to ? <Link to={to} className="block h-full">{body}</Link> : body}
    </motion.div>
  )
}

/** Card. `gradient` gives it the AI Prep blue→violet header bar. */
export function Card({ title, actions, children, className, bodyClass = 'p-5', gradient = true, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className={cls('card overflow-hidden', className)}>
      {(title || actions) && (
        <div className={cls('flex items-center justify-between gap-2 px-5 border-b border-slate-100', gradient ? 'py-3.5' : 'py-3')}>
          <p className="flex items-center gap-2.5 text-[15px] font-bold text-slate-800 font-heading">
            {gradient && <span className="h-5 w-1 rounded-full bg-red-600" />}
            {Icon && <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100"><Icon className="h-4 w-4" /></span>}
            {title}
          </p>
          <div className="flex gap-2 [&_a]:text-blue-600 [&_a]:font-semibold [&_a]:text-sm">{actions}</div>
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </motion.div>
  )
}

const badgeTones = {
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', red: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', blue: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200', slate: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}
export const Badge = ({ tone = 'slate', children }) => <span className={cls('badge capitalize', badgeTones[tone])}>{children}</span>

export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4" onMouseDown={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className={cls('bg-white/95 backdrop-blur-2xl w-full rounded-t-[26px] sm:rounded-[26px] border border-white shadow-[0_30px_80px_rgba(15,23,42,0.35)] max-h-[92vh] flex flex-col overflow-hidden', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
            onMouseDown={(e) => e.stopPropagation()} initial={{ y: 40, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.98 }} transition={{ duration: 0.3, ease: EASE }}>
            <div className="relative flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
              <h3 className="relative font-heading font-bold text-slate-800">{title}</h3>
              <button className="relative rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto nice-scroll">{children}</div>
            {footer && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex flex-wrap justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Field({ label, children, className }) {
  return <label className={cls('block', className)}><span className="label">{label}</span>{children}</label>
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9 w-full sm:w-64 rounded-full bg-slate-100/80 border-transparent focus:bg-white" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

export function Empty({ title = 'Nothing here yet', hint, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-500"><Icon size={22} /></div>
      <div className="font-semibold text-slate-700">{title}</div>
      {hint && <div className="text-sm text-slate-500">{hint}</div>}
    </div>
  )
}

export function Table({ columns, rows, empty, onRowClick }) {
  if (!rows.length) return <Empty {...(empty || {})} />
  return (
    <div className="overflow-x-auto nice-scroll">
      <table className="w-full">
        <thead><tr>{columns.map((c) => <th key={c.key || c.label} className={cls('th', c.className)}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i} className={cls('transition-colors hover:bg-blue-50/40', onRowClick && 'cursor-pointer')} onClick={() => onRowClick?.(r)}>
              {columns.map((c) => <td key={c.key || c.label} className={cls('td', c.className)}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Progress({ value, tone = 'bg-gradient-to-r from-blue-600 to-cyan-400' }) {
  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <motion.div className={cls('h-full rounded-full', tone)} initial={{ width: 0 }} animate={{ width: Math.min(100, Math.max(0, value)) + '%' }} transition={{ duration: 0.9, ease: EASE }} />
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex gap-1 p-1 bg-slate-100/80 rounded-xl overflow-x-auto max-w-full">
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)} className="relative px-3 py-1.5 text-sm rounded-lg whitespace-nowrap font-bold">
          {value === t.value && <motion.span layoutId={'tab-' + tabs.map((x) => x.value).join()} className="absolute inset-0 rounded-lg bg-white shadow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className={cls('relative', value === t.value ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800')}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Avatar({ name, size = 'h-9 w-9' }) {
  const hue = [...(name || 'x')].reduce((s, c) => s + c.charCodeAt(0), 0) % 360
  return <div className={cls(size, 'rounded-full grid place-items-center text-white text-xs font-bold shrink-0 ring-2 ring-white shadow-sm')} style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))` }}>
    {(name || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
  </div>
}

// ---------- toasts ----------
const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((msg, type = 'success') => {
    const id = Math.random(); setItems((x) => [...x, { id, msg, type }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3400)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] space-y-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}
              className={cls('flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl text-white backdrop-blur-xl', t.type === 'error' ? 'bg-rose-600/95' : 'bg-slate-900/95')}>
              {t.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}{t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)
export function confirmAction(msg) { return window.confirm(msg) }
