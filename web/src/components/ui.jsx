import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { X, Search, Inbox, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cls } from '../lib/utils'

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const tones = {
  indigo: 'from-indigo-500 to-violet-500', emerald: 'from-emerald-500 to-teal-500', amber: 'from-amber-500 to-orange-500',
  sky: 'from-sky-500 to-blue-500', rose: 'from-rose-500 to-pink-500', slate: 'from-slate-600 to-slate-800',
}
export function Stat({ icon: Icon, label, value, hint, tone = 'indigo' }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={cls('h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br text-white grid place-items-center shadow-sm', tones[tone])}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{value}</div>
        {hint && <div className="text-xs text-slate-500 mt-1 truncate">{hint}</div>}
      </div>
    </div>
  )
}

export function Card({ title, actions, children, className, bodyClass = 'p-5' }) {
  return (
    <div className={cls('card', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          <div className="flex gap-2">{actions}</div>
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  )
}

const badgeTones = {
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', red: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', blue: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200', slate: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}
export const Badge = ({ tone = 'slate', children }) => <span className={cls('badge', badgeTones[tone])}>{children}</span>

export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4" onMouseDown={onClose}>
      <div className={cls('bg-white w-full rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn-ghost p-1.5" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t bg-slate-50 rounded-b-2xl flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children, className }) {
  return <label className={cls('block', className)}><span className="label">{label}</span>{children}</label>
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9 w-full sm:w-64" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

export function Empty({ title = 'Nothing here yet', hint, icon: Icon = Inbox }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 grid place-items-center text-slate-400 mb-3"><Icon size={22} /></div>
      <div className="font-medium text-slate-700">{title}</div>
      {hint && <div className="text-sm text-slate-500 mt-1">{hint}</div>}
    </div>
  )
}

export function Table({ columns, rows, empty, onRowClick }) {
  if (!rows.length) return <Empty {...(empty || {})} />
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr>{columns.map((c) => <th key={c.key || c.label} className={cls('th', c.className)}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i} className={cls('hover:bg-slate-50/70', onRowClick && 'cursor-pointer')} onClick={() => onRowClick?.(r)}>
              {columns.map((c) => <td key={c.key || c.label} className={cls('td', c.className)}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Progress({ value, tone = 'bg-brand-600' }) {
  return <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={cls('h-full rounded-full', tone)} style={{ width: Math.min(100, Math.max(0, value)) + '%' }} /></div>
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={cls('px-3 py-1.5 text-sm rounded-md whitespace-nowrap font-medium', value === t.value ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900')}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Avatar({ name, size = 'h-9 w-9' }) {
  const hue = [...(name || 'x')].reduce((s, c) => s + c.charCodeAt(0), 0) % 360
  return <div className={cls(size, 'rounded-full grid place-items-center text-white text-xs font-semibold shrink-0')} style={{ background: `hsl(${hue} 55% 45%)` }}>
    {(name || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
  </div>
}

// ---------- toasts ----------
const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((msg, type = 'success') => {
    const id = Math.random(); setItems((x) => [...x, { id, msg, type }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] space-y-2">
        {items.map((t) => (
          <div key={t.id} className={cls('flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg text-white', t.type === 'error' ? 'bg-rose-600' : 'bg-slate-900')}>
            {t.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}{t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

export function confirmAction(msg) { return window.confirm(msg) }
