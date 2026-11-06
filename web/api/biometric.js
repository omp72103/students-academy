// JSON webhook for biometric middleware (eTimeTrackLite, BioTime, custom scripts).
// POST https://students-academy.vercel.app/api/biometric
// { "deviceSn": "ABC123", "token": "<device token from the portal>", "records": [{ "pin": "1001", "time": "2026-11-07 09:02:11" }] }
const SB_URL = process.env.VITE_SUPABASE_URL
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const { deviceSn, token, records } = body
    if (!deviceSn || !token || !Array.isArray(records)) return res.status(400).json({ error: 'deviceSn, token and records[] are required' })
    const clean = records.map((r) => ({ pin: String(r.pin ?? r.userId ?? '').trim(), time: String(r.time ?? r.timestamp ?? '').replace('T', ' ').slice(0, 19) }))
      .filter((r) => r.pin && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(r.time))
    const r = await fetch(`${SB_URL}/rest/v1/rpc/sa_biometric_ingest`, {
      method: 'POST', headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_sn: String(deviceSn), p_token: String(token), p_records: clean }),
    })
    const text = await r.text()
    if (!r.ok) return res.status(/token|unknown/i.test(text) ? 401 : 500).json({ error: text })
    return res.status(200).json(JSON.parse(text))
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
