// SMS + WhatsApp messaging — zero cost.
//
// Inside the Students Academy Android app (`window.AndroidBridge`):
//   • SMS are sent in the background from the phone's own SIM (uses the SIM's SMS pack — no gateway, no per-SMS fee).
//     Delivery status is reported back and stored in the message log. Dual-SIM phones can choose the SIM.
//   • WhatsApp uses the free click-to-chat intent: the app opens each chat with the message pre-filled and,
//     after you tap Send and come back, automatically opens the next one (queue). No WhatsApp Business API fees.
// In a normal browser it falls back to a guided queue that opens sms: / wa.me links one by one.
import { db } from './db'

export const isAndroidApp = () => typeof window !== 'undefined' && !!window.AndroidBridge
export const cleanPhone = (p = '') => {
  const d = String(p).replace(/\D/g, '')
  return d.length === 10 ? '91' + d : d
}
const local10 = (p) => String(p).replace(/\D/g, '').slice(-10)
const bridgeHas = (fn) => isAndroidApp() && typeof window.AndroidBridge[fn] === 'function'

// ---------- callbacks from the Android app ----------
if (typeof window !== 'undefined') {
  window.SAApp = {
    onSmsStatus: (id, status) => { if (id) db.update('messages', id, { status }).catch(() => {}) },
    onWaStatus: (id, status) => { if (id) db.update('messages', id, { status }).catch(() => {}) },
  }
}

// ---------- SIM selection (dual-SIM phones) ----------
const SIM_KEY = 'sa_sms_sim'
export const getSelectedSim = () => Number(localStorage.getItem(SIM_KEY) || -1)
export const setSelectedSim = (id) => localStorage.setItem(SIM_KEY, String(id))
export function getSims() {
  if (!bridgeHas('getSims')) return []
  try { return JSON.parse(window.AndroidBridge.getSims() || '[]') } catch { return [] }
}

// ---------- single message helpers ----------
export function openWhatsApp(phone, text) {
  const num = cleanPhone(phone)
  if (bridgeHas('openWhatsApp')) return window.AndroidBridge.openWhatsApp(num, text)
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank')
}
export function openSms(phone, text) {
  window.location.href = `sms:${local10(phone)}?body=${encodeURIComponent(text)}`
}
export function sendSms(phone, text) {
  if (bridgeHas('sendSMS')) { window.AndroidBridge.sendSMS(local10(phone), text, getSelectedSim()); return 'sent' }
  openSms(phone, text); return 'opened'
}

// ---------- browser fallback queue (rendered by <SendQueue/>) ----------
const queueListeners = new Set()
export const onQueue = (fn) => { queueListeners.add(fn); return () => queueListeners.delete(fn) }

/**
 * Send many messages. msgs: [{ phone, name, text }]
 * Logs every message, then hands them to the Android app (automatic) or the browser queue (guided).
 * Returns { mode: 'app' | 'queue', count }
 */
export async function dispatch(channel, msgs, { sentBy, purpose } = {}) {
  const valid = msgs.filter((m) => m && local10(m.phone).length === 10)
  if (!valid.length) return { mode: 'none', count: 0 }
  const logs = await db.insertMany('messages', valid.map((m) => ({ channel, to: m.phone, name: m.name, text: m.text, sentBy, purpose, status: 'queued' })))
  const items = logs.map((l) => ({ id: l.id, phone: channel === 'sms' ? local10(l.to) : cleanPhone(l.to), text: l.text, name: l.name }))
  if (channel === 'sms' && bridgeHas('sendBulkSMS')) { window.AndroidBridge.sendBulkSMS(JSON.stringify(items), getSelectedSim()); return { mode: 'app', count: items.length } }
  if (channel === 'whatsapp' && bridgeHas('openWhatsAppQueue')) { window.AndroidBridge.openWhatsAppQueue(JSON.stringify(items)); return { mode: 'app', count: items.length } }
  queueListeners.forEach((fn) => fn({ channel, items }))
  return { mode: 'queue', count: items.length }
}

/** @deprecated use dispatch */
export function sendBulkSms(list) {
  if (!bridgeHas('sendBulkSMS')) return false
  window.AndroidBridge.sendBulkSMS(JSON.stringify(list.map((m) => ({ id: '', phone: local10(m.phone), text: m.text }))), getSelectedSim())
  return true
}
export async function logMessage({ channel, to, name, text, sentBy, purpose, status }) {
  return db.insert('messages', { channel, to, name, text, sentBy, purpose, status })
}

export const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`))

export const TEMPLATES = [
  { key: 'absent', label: 'Absent today', text: 'Dear Parent, {student} was absent from {batch} today ({date}). Kindly ensure regular attendance. {sig}' },
  { key: 'fee', label: 'Fee reminder', text: 'Dear Parent, a fee balance of Rs. {balance} is pending for {student}. Kindly clear it at the earliest. {sig}' },
  { key: 'result', label: 'Test result', text: 'Dear Parent, {student} scored {score} in "{test}". Login to the Students Academy portal for detailed analysis. {sig}' },
  { key: 'notice', label: 'General notice', text: 'Dear {name}, {message} {sig}' },
  { key: 'holiday', label: 'Holiday', text: 'Dear {name}, the academy will remain closed on {date}. Classes resume as per timetable. {sig}' },
  { key: 'welcome', label: 'Admission welcome', text: 'Welcome to Students Academy, {student}! Your roll no. is {roll}. Portal login: {email}. {sig}' },
]
