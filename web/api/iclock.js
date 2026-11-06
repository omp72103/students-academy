// ZKTeco / eSSL "ADMS" (iclock push) endpoint.
// On the device: Comm → Cloud Server (ADMS): Server = students-academy.vercel.app, Port 443, HTTPS on.
// The device then calls /iclock/cdata, /iclock/getrequest, /iclock/devicecmd (rewritten here by vercel.json).
// Punches are passed to the Supabase function sa_biometric_ingest, which matches device user IDs to
// students/staff, marks attendance (late after batch start + grace) and logs every punch.

const SB_URL = process.env.VITE_SUPABASE_URL
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY

async function rpc(fn, args) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(text)
  return text ? JSON.parse(text) : null
}

function readBody(req) {
  if (typeof req.body === 'string') return Promise.resolve(req.body)
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString('utf8'))
  return new Promise((res) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => res(d)); req.on('error', () => res(d)) })
}

/** "PIN\tYYYY-MM-DD HH:MM:SS\tstatus\tverify..." per line → [{ pin, time, status, verify }] */
export function parseAttlog(body) {
  return String(body || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const f = l.split('\t')
    return { pin: (f[0] || '').trim(), time: (f[1] || '').trim(), status: f[2], verify: f[3] }
  }).filter((x) => x.pin && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(x.time))
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x')
  const path = (url.searchParams.get('path') || url.pathname.split('/iclock/')[1] || '').replace(/^\/+/, '')
  const sn = url.searchParams.get('SN') || url.searchParams.get('sn') || ''
  res.setHeader('Content-Type', 'text/plain')
  try {
    if (!sn) return res.status(400).send('ERROR: missing SN')
    // Initial handshake: device asks for options
    if (path.startsWith('cdata') && req.method === 'GET') {
      await rpc('sa_biometric_heartbeat', { p_sn: sn }).catch(() => null)
      return res.status(200).send([
        `GET OPTION FROM: ${sn}`, 'ATTLOGStamp=None', 'OPERLOGStamp=9999', 'ATTPHOTOStamp=None', 'ErrorDelay=30', 'Delay=10',
        'TransTimes=00:00;14:05', 'TransInterval=1', 'TransFlag=TransData AttLog', 'Realtime=1', 'Encrypt=None',
      ].join('\n'))
    }
    // Attendance upload
    if (path.startsWith('cdata') && req.method === 'POST') {
      const table = (url.searchParams.get('table') || '').toUpperCase()
      const body = await readBody(req)
      if (table !== 'ATTLOG') return res.status(200).send('OK')
      const records = parseAttlog(body).map((r) => ({ pin: r.pin, time: r.time.length === 16 ? r.time + ':00' : r.time }))
      if (!records.length) return res.status(200).send('OK: 0')
      const out = await rpc('sa_biometric_ingest', { p_sn: sn, p_token: null, p_records: records })
      return res.status(200).send(`OK: ${out?.received ?? records.length}`)
    }
    // Command polling / acknowledgements
    if (path.startsWith('getrequest')) { await rpc('sa_biometric_heartbeat', { p_sn: sn }).catch(() => null); return res.status(200).send('OK') }
    if (path.startsWith('devicecmd')) return res.status(200).send('OK')
    return res.status(200).send('OK')
  } catch (e) {
    console.error('iclock', sn, e.message)
    // Unknown/blocked device: tell it to retry later rather than resend forever
    return res.status(200).send(/unknown device/i.test(e.message) ? 'ERROR: device not registered in Students Academy portal' : 'ERROR')
  }
}
