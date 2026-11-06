// Biometric punch processing.
// Production: punches go through the Supabase function sa_biometric_ingest (called by the device
// endpoint /iclock, the /api/biometric webhook, or CSV import below), so the logic lives in one place.
// Demo mode: the same rules run here in the browser.
import { db, MODE, supabase } from './db'

const PREFIX = import.meta.env.VITE_TABLE_PREFIX || ''
export const genToken = () => [...crypto.getRandomValues(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, '0')).join('')

/** records: [{ pin, time: 'YYYY-MM-DD HH:MM:SS' }] */
export async function ingestPunches(device, records) {
  if (MODE === 'supabase') {
    const { data, error } = await supabase.rpc(PREFIX + 'biometric_ingest', { p_sn: device.serialNo, p_token: device.token, p_records: records })
    if (error) throw new Error(error.message)
    return data
  }
  return ingestLocal(device, records)
}

async function ingestLocal(device, records) {
  const [users, batches, settingsRows, existing] = await Promise.all([db.list('users'), db.list('batches'), db.list('settings'), db.list('punches')])
  const grace = Number(settingsRows.find((s) => s.id === 'institute')?.bioGraceMinutes ?? 10)
  const seen = new Set(existing.map((p) => p.id))
  let inserted = 0, duplicates = 0, unknown = 0
  for (const r of records) {
    const time = r.time.replace('T', ' ').slice(0, 19)
    const date = time.slice(0, 10), hm = time.slice(11, 16)
    const id = `${device.serialNo}-${r.pin}-${time.replace(/\D/g, '')}`
    if (seen.has(id)) { duplicates++; continue }
    seen.add(id)
    const u = users.find((x) => String(x.biometricId || '') === String(r.pin) && x.status !== 'inactive')
    await db.insert('punches', { id, deviceSn: device.serialNo, deviceName: device.name, pin: r.pin, time: time.replace(' ', 'T'), date, userId: u?.id || null, userName: u?.name || null, role: u?.role || null })
    inserted++
    if (!u) { unknown++; continue }
    if (u.role === 'student') {
      const b = batches.find((x) => x.id === u.batchId)
      let status = 'P'
      if (b?.startTime) { const [h, m] = b.startTime.split(':').map(Number); const lim = h * 60 + m + grace; const [ph, pm] = hm.split(':').map(Number); if (ph * 60 + pm > lim) status = 'L' }
      const docId = `att-${u.batchId}-${date}`
      const doc = await db.get('attendance', docId)
      if (!doc) await db.insert('attendance', { id: docId, batchId: u.batchId, date, records: { [u.id]: status }, markedBy: 'biometric' })
      else if (!doc.records?.[u.id] || doc.records[u.id] === 'A') await db.update('attendance', docId, { records: { ...doc.records, [u.id]: status } })
    } else {
      const docId = `sat-${date}`
      const doc = await db.get('staff_attendance', docId)
      const cur = doc?.records?.[u.id] || {}
      const inT = cur.in && cur.in < hm ? cur.in : hm
      const outCand = [cur.out, cur.in, hm].filter(Boolean).sort().pop()
      const rec = { status: cur.status && cur.status !== 'A' ? cur.status : 'P', in: inT, out: outCand !== inT ? outCand : null, source: 'biometric' }
      if (!doc) await db.insert('staff_attendance', { id: docId, date, records: { [u.id]: rec }, markedBy: 'biometric' })
      else await db.update('staff_attendance', docId, { records: { ...doc.records, [u.id]: rec } })
    }
  }
  await db.update('devices', device.id, { lastSeen: new Date().toISOString(), punchCount: Number(device.punchCount || 0) + inserted })
  return { received: records.length, inserted, duplicates, unknown }
}

/** Parse exports from eTimeTrackLite / BioTime / ZKTime (CSV or tab-separated). */
export function parsePunchFile(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  const sep = lines[0].includes('\t') ? '\t' : ','
  const head = lines[0].split(sep).map((h) => h.replace(/"/g, '').trim().toLowerCase())
  const iPin = head.findIndex((h) => /^(pin|user ?id|emp(loyee)? ?(code|id|no)|enroll(ment)? ?(no|id)|ac-no\.?|badge)/.test(h))
  const iTime = head.findIndex((h) => /(date ?time|log ?date|punch ?time|^time$|check ?time|timestamp)/.test(h))
  const iDate = head.findIndex((h) => /^date$/.test(h)), iClock = head.findIndex((h) => /^(time|clock)$/.test(h))
  const hasHeader = iPin >= 0 && (iTime >= 0 || iDate >= 0)
  const rows = (hasHeader ? lines.slice(1) : lines).map((l) => l.split(sep).map((c) => c.replace(/"/g, '').trim()))
  const norm = (s) => {
    if (!s) return null
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')} ${m[4].padStart(2, '0')}:${m[5]}:${m[6] || '00'}`
    m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i) // DD-MM-YYYY
    if (m) { let h = Number(m[4]); if (m[7]) { if (/pm/i.test(m[7]) && h < 12) h += 12; if (/am/i.test(m[7]) && h === 12) h = 0 } return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')} ${String(h).padStart(2, '0')}:${m[5]}:${m[6] || '00'}` }
    return null
  }
  return rows.map((c) => {
    const pin = hasHeader ? c[iPin] : c[0]
    const t = hasHeader ? (iTime >= 0 ? c[iTime] : `${c[iDate]} ${c[iClock]}`) : c[1]
    return { pin, time: norm(t) }
  }).filter((r) => r.pin && r.time)
}
