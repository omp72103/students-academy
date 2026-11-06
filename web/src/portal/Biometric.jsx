// Biometric devices: register ZKTeco/eSSL devices, map device user IDs, view punch logs, import exports.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Fingerprint, Plus, Pencil, Trash2, Wifi, WifiOff, Copy, Upload, Users, Activity, AlertTriangle, CheckCircle2, Zap, Server, BookOpen, Search, Wand2 } from 'lucide-react'
import { db, useTable, MODE } from '../lib/db'
import { useAuth, canManage } from '../lib/auth'
import { PageHeader, Card, Table, Modal, Field, Badge, useToast, Empty, Stat, Avatar, Tabs } from '../components/ui'
import { fmtDateTime, today, cls } from '../lib/utils'
import { genToken, ingestPunches, parsePunchFile } from '../lib/biometric'
import { useSettings } from '../site/SiteLayout'

const HOST = typeof window !== 'undefined' ? window.location.host : 'students-academy.vercel.app'
const online = (d) => d.lastSeen && Date.now() - new Date(d.lastSeen).getTime() < 15 * 60 * 1000

export function Biometric() {
  const { user } = useAuth(); const manage = canManage(user, 'biometric')
  const [devices] = useTable('devices'); const [punches] = useTable('punches'); const [users] = useTable('users')
  const [tab, setTab] = useState('devices')
  const people = users.filter((u) => u.role !== 'parent' && u.status !== 'inactive')
  const mapped = people.filter((u) => u.biometricId).length
  const todays = punches.filter((p) => p.date === today())
  return (
    <>
      <PageHeader title="Biometric Devices" subtitle="Fingerprint / face attendance: punches mark student and staff attendance automatically" actions={manage && tab === 'devices' && <button className="btn-primary" onClick={() => setTab('devices') || window.dispatchEvent(new Event('sa-add-device'))}><Plus size={16} />Add device</button>} />
      <div className="mb-5 grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat index={0} tone="indigo" icon={Server} label="Devices online" value={`${devices.filter(online).length}/${devices.length}`} progress={devices.length ? (devices.filter(online).length / devices.length) * 100 : 0} hint="Seen in the last 15 min" />
        <Stat index={1} tone="emerald" icon={Activity} label="Punches today" value={todays.length} progress={100} hint={`${new Set(todays.map((p) => p.userId).filter(Boolean)).size} people`} />
        <Stat index={2} tone="sky" icon={Users} label="IDs mapped" value={`${mapped}/${people.length}`} progress={people.length ? (mapped / people.length) * 100 : 0} hint="Students + staff with a device ID" />
        <Stat index={3} tone="amber" icon={AlertTriangle} label="Unknown IDs today" value={todays.filter((p) => !p.userId).length} progress={todays.length ? (todays.filter((p) => p.userId).length / todays.length) * 100 : 100} hint="Punches not matched to anyone" />
      </div>
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ value: 'devices', label: 'Devices' }, { value: 'mapping', label: 'ID mapping' }, { value: 'log', label: 'Punch log' }, { value: 'import', label: 'Import / test' }, { value: 'setup', label: 'Setup guide' }]} /></div>
      {tab === 'devices' && <Devices devices={devices} manage={manage} />}
      {tab === 'mapping' && <Mapping people={people} manage={manage} />}
      {tab === 'log' && <PunchLog punches={punches} />}
      {tab === 'import' && <ImportTest devices={devices} people={people} manage={manage} />}
      {tab === 'setup' && <SetupGuide devices={devices} />}
    </>
  )
}

function Devices({ devices, manage }) {
  const toast = useToast(); const [edit, setEdit] = useState(null); const s = useSettings()
  useEffect(() => { const h = () => setEdit({ model: 'ZKTeco', purpose: 'both', active: true }); window.addEventListener('sa-add-device', h); return () => window.removeEventListener('sa-add-device', h) }, [])
  async function save() {
    if (!edit.name || !edit.serialNo) return toast('Name and serial number are required', 'error')
    const row = { ...edit, serialNo: edit.serialNo.trim().toUpperCase(), token: edit.token || genToken() }
    if (devices.some((d) => d.serialNo === row.serialNo && d.id !== edit.id)) return toast('A device with this serial number already exists', 'error')
    edit.id ? await db.update('devices', edit.id, row) : await db.insert('devices', row)
    toast('Device saved'); setEdit(null)
  }
  return (
    <>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {devices.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card overflow-hidden">
            <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 p-5 text-white">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center shadow-lg"><Fingerprint size={24} /></div>
                <span className={cls('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', online(d) ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/60')}>
                  {online(d) ? <><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />Online</> : <><WifiOff size={12} />Offline</>}
                </span>
              </div>
              <div className="relative mt-4 font-heading text-lg font-bold">{d.name}</div>
              <div className="relative text-xs text-white/70">{d.model} · SN {d.serialNo}</div>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-semibold">{d.location || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Used for</span><span className="font-semibold capitalize">{d.purpose === 'both' ? 'Students & staff' : d.purpose}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Last seen</span><span className="font-semibold">{d.lastSeen ? fmtDateTime(d.lastSeen) : 'Never'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Punches received</span><span className="font-semibold">{d.punchCount || 0}</span></div>
              {!d.active && <Badge tone="red">Disabled</Badge>}
              {manage && <div className="pt-2 flex gap-2"><button className="btn-outline btn-sm flex-1" onClick={() => setEdit(d)}><Pencil size={13} />Edit</button></div>}
            </div>
          </motion.div>
        ))}
      </div>
      {!devices.length && <Card gradient={false}><Empty title="No devices registered" hint="Add your fingerprint / face device with its serial number, then point it to this portal (see Setup guide)." icon={Fingerprint} /></Card>}
      {edit && <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Edit device' : 'Add biometric device'} footer={<>
        {edit.id && <button className="btn-outline text-rose-600 mr-auto" onClick={async () => { if (window.confirm('Remove this device? Its punch history stays.')) { await db.remove('devices', edit.id); setEdit(null) } }}><Trash2 size={15} />Remove</button>}
        <button className="btn-outline" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Device name *"><input className="input" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Main entrance" /></Field>
          <Field label="Serial number (SN) *"><input className="input font-mono" value={edit.serialNo || ''} onChange={(e) => setEdit({ ...edit, serialNo: e.target.value })} placeholder="From device: Menu → System Info" /></Field>
          <Field label="Make / model"><select className="input" value={edit.model} onChange={(e) => setEdit({ ...edit, model: e.target.value })}>{['ZKTeco', 'eSSL', 'Realtime', 'Identix', 'Mantra', 'Other (ADMS push)'].map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Location"><input className="input" value={edit.location || ''} onChange={(e) => setEdit({ ...edit, location: e.target.value })} placeholder="Ground floor reception" /></Field>
          <Field label="Used for"><select className="input" value={edit.purpose} onChange={(e) => setEdit({ ...edit, purpose: e.target.value })}><option value="both">Students & staff</option><option value="students">Students only</option><option value="staff">Staff only</option></select></Field>
          <Field label="Status"><select className="input" value={edit.active === false ? 'off' : 'on'} onChange={(e) => setEdit({ ...edit, active: e.target.value === 'on' })}><option value="on">Active</option><option value="off">Disabled (ignore punches)</option></select></Field>
          {edit.token && <Field label="Webhook token (for middleware / CSV import)" className="sm:col-span-2"><div className="flex gap-2"><input readOnly className="input font-mono text-xs" value={edit.token} /><button className="btn-outline" onClick={() => { navigator.clipboard?.writeText(edit.token); toast('Token copied') }}><Copy size={14} /></button><button className="btn-outline" onClick={() => setEdit({ ...edit, token: genToken() })} title="Regenerate">↻</button></div></Field>}
        </div>
        <div className="mt-4 rounded-xl bg-blue-50/70 border border-blue-100 p-3 text-xs text-slate-600">Late marking: a student punching after the batch's start time + <b>{s.bioGraceMinutes ?? 10} min</b> grace is marked <b>L</b> (set the start time in Batches, grace in Settings).</div>
      </Modal>}
    </>
  )
}

function Mapping({ people, manage }) {
  const toast = useToast(); const [q, setQ] = useState(''); const [only, setOnly] = useState('all'); const [batches] = useTable('batches')
  const [draft, setDraft] = useState({})
  const list = people.filter((u) => (only === 'all' || (only === 'unmapped' ? !u.biometricId : only === 'students' ? u.role === 'student' : u.role !== 'student')) && (!q || (u.name + (u.rollNo || '') + (u.biometricId || '')).toLowerCase().includes(q.toLowerCase())))
  const dupes = (() => { const c = {}; people.forEach((u) => { if (u.biometricId) c[u.biometricId] = (c[u.biometricId] || 0) + 1 }); return c })()
  async function saveOne(u) {
    const v = (draft[u.id] ?? u.biometricId ?? '').trim()
    if (v && people.some((x) => x.id !== u.id && x.biometricId === v)) return toast(`ID ${v} is already used by ${people.find((x) => x.biometricId === v).name}`, 'error')
    await db.update('users', u.id, { biometricId: v || null }); setDraft((d) => { const n = { ...d }; delete n[u.id]; return n }); toast('Saved')
  }
  async function autoAssign() {
    const used = new Set(people.map((u) => u.biometricId).filter(Boolean)); let n = 0
    for (const u of people.filter((x) => !x.biometricId)) {
      let id = u.rollNo ? String(Number(u.rollNo.replace(/\D/g, '').slice(-4)) + 1000) : null
      if (!id || used.has(id)) { let k = u.role === 'student' ? 1001 : 9001; while (used.has(String(k))) k++; id = String(k) }
      used.add(id); await db.update('users', u.id, { biometricId: id }); n++
    }
    toast(`${n} IDs assigned: enrol the same IDs on the device`)
  }
  return (
    <Card title="Device user ID ↔ person" icon={Users} bodyClass="p-0" actions={manage && <a onClick={autoAssign} className="cursor-pointer text-xs font-bold flex items-center gap-1"><Wand2 size={13} />Auto-assign missing IDs</a>}>
      <div className="flex flex-wrap gap-3 p-4 border-b border-slate-100 items-center">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9 w-60" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, roll no, ID" /></div>
        <Tabs value={only} onChange={setOnly} tabs={[{ value: 'all', label: 'All' }, { value: 'students', label: 'Students' }, { value: 'staff', label: 'Staff' }, { value: 'unmapped', label: 'Unmapped' }]} />
        <span className="text-xs text-slate-500 ml-auto">The ID must match the user number enrolled on the device.</span>
      </div>
      <Table rows={list} columns={[
        { label: 'Person', render: (u) => <div className="flex items-center gap-2"><Avatar name={u.name} size="h-8 w-8" /><div><div className="font-semibold">{u.name}</div><div className="text-[11px] text-slate-500">{u.role === 'student' ? `${u.rollNo} · ${batches.find((b) => b.id === u.batchId)?.name || ''}` : u.designation || u.role}</div></div></div> },
        { label: 'Device user ID', render: (u) => manage ? (
          <div className="flex items-center gap-2"><input className={cls('input w-28 py-1.5 font-mono', dupes[u.biometricId] > 1 && 'border-rose-300')} value={draft[u.id] ?? u.biometricId ?? ''} onChange={(e) => setDraft({ ...draft, [u.id]: e.target.value.replace(/\s/g, '') })} onKeyDown={(e) => e.key === 'Enter' && saveOne(u)} placeholder="—" />
            {draft[u.id] !== undefined && <button className="btn-primary btn-sm" onClick={() => saveOne(u)}>Save</button>}</div>) : <span className="font-mono">{u.biometricId || '—'}</span> },
        { label: 'Status', render: (u) => u.biometricId ? (dupes[u.biometricId] > 1 ? <Badge tone="red">Duplicate</Badge> : <Badge tone="green">Mapped</Badge>) : <Badge tone="amber">Not mapped</Badge> },
      ]} />
    </Card>
  )
}

function PunchLog({ punches }) {
  const [date, setDate] = useState(today()); const [q, setQ] = useState('')
  const list = punches.filter((p) => (!date || p.date === date) && (!q || ((p.userName || '') + p.pin + p.deviceName).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.time.localeCompare(a.time))
  return (
    <Card title={`Punch log · ${list.length}`} icon={Activity} bodyClass="p-0">
      <div className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
        <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9 w-56" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, ID or device" /></div>
        <button className="btn-ghost btn-sm" onClick={() => setDate('')}>All dates</button>
      </div>
      <Table rows={list.slice(0, 300)} empty={{ title: 'No punches for this date', icon: Fingerprint }} columns={[
        { label: 'Time', render: (p) => <span className="font-mono text-xs">{p.time.replace('T', ' ')}</span> },
        { label: 'Person', render: (p) => p.userId ? <div className="flex items-center gap-2"><Avatar name={p.userName} size="h-7 w-7" /><span className="font-semibold">{p.userName}</span></div> : <span className="text-rose-600 font-semibold">Unknown ID {p.pin}</span> },
        { label: 'Role', render: (p) => p.role ? <Badge tone={p.role === 'student' ? 'blue' : 'indigo'}>{p.role}</Badge> : '—' },
        { label: 'Device ID', render: (p) => <span className="font-mono">{p.pin}</span> },
        { label: 'Device', key: 'deviceName' },
      ]} />
    </Card>
  )
}

function ImportTest({ devices, people, manage }) {
  const toast = useToast(); const fileRef = useRef()
  const [dev, setDev] = useState(''); const [preview, setPreview] = useState(null); const [busy, setBusy] = useState(false); const [result, setResult] = useState(null)
  const device = devices.find((d) => d.id === (dev || devices[0]?.id))
  const [who, setWho] = useState('')
  async function onFile(e) { const f = e.target.files[0]; if (!f) return; const rows = parsePunchFile(await f.text()); setPreview(rows); setResult(null); e.target.value = ''; if (!rows.length) toast('No punches found. Check the file has user ID and date-time columns', 'error') }
  async function run(records) {
    if (!device) return toast('Add a device first', 'error')
    setBusy(true)
    try { const r = await ingestPunches(device, records); setResult(r); toast(`${r.inserted} punches processed`) } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }
  if (!manage) return <Card gradient={false}><Empty title="You need the Biometric privilege to import punches" /></Card>
  const now = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card title="Import attendance export" icon={Upload}>
        <p className="text-sm text-slate-600 mb-4">For devices without cloud push: export the attendance log from eTimeTrackLite, ZKTime or BioTime as CSV/Excel-CSV (columns like <b>User ID</b> and <b>Date Time</b>) and upload it here. Duplicates are ignored automatically.</p>
        <Field label="Device"><select className="input" value={device?.id || ''} onChange={(e) => setDev(e.target.value)}>{devices.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.serialNo})</option>)}</select></Field>
        <input ref={fileRef} type="file" hidden accept=".csv,.txt,.dat" onChange={onFile} />
        <button className="btn-outline mt-4" onClick={() => fileRef.current.click()} disabled={!device}><Upload size={15} />Choose file</button>
        {preview && <div className="mt-4">
          <div className="text-sm font-semibold mb-2">{preview.length} punches found · {preview.filter((p) => people.some((u) => u.biometricId === p.pin)).length} match a person</div>
          <div className="max-h-48 overflow-y-auto nice-scroll rounded-xl border border-slate-200 text-xs font-mono p-2 space-y-0.5">{preview.slice(0, 50).map((p, i) => <div key={i}>{p.pin} · {p.time}</div>)}</div>
          <button className="btn-primary mt-3" disabled={busy} onClick={() => run(preview)}>{busy ? 'Processing…' : `Import ${preview.length} punches`}</button>
        </div>}
      </Card>
      <Card title="Test a punch" icon={Zap}>
        <p className="text-sm text-slate-600 mb-4">Simulate a fingerprint punch right now to check that mapping and auto-attendance work end to end.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Device"><select className="input" value={device?.id || ''} onChange={(e) => setDev(e.target.value)}>{devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <Field label="Person"><select className="input" value={who} onChange={(e) => setWho(e.target.value)}><option value="">Select…</option>{people.filter((u) => u.biometricId).map((u) => <option key={u.id} value={u.biometricId}>{u.name} (ID {u.biometricId})</option>)}</select></Field>
        </div>
        <button className="btn-primary mt-4" disabled={!who || !device || busy} onClick={() => run([{ pin: who, time: now() }])}><Fingerprint size={15} />Punch now</button>
        {result && <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex gap-2"><CheckCircle2 size={17} className="shrink-0" />Received {result.received} · new {result.inserted} · duplicates {result.duplicates} · unknown IDs {result.unknown}. Attendance has been updated.</div>}
      </Card>
    </div>
  )
}

function SetupGuide({ devices }) {
  const toast = useToast()
  const copy = (t) => { navigator.clipboard?.writeText(t); toast('Copied') }
  const Row = ({ k, v }) => <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="text-xs font-bold text-slate-500">{k}</span><span className="flex items-center gap-2 font-mono text-sm font-semibold">{v}<button onClick={() => copy(v)} className="text-slate-400 hover:text-blue-600"><Copy size={13} /></button></span></div>
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card title="Option 1: Cloud push (recommended)" icon={Wifi}>
        <p className="text-sm text-slate-600 mb-4">Most ZKTeco and eSSL devices (models with <b>ADMS / Cloud Server / iclock</b> support, e.g. K40, K90, MB160, SpeedFace, eSSL X990, F22, uFace) can send every punch to this portal over the internet in real time.</p>
        <ol className="space-y-3 text-sm text-slate-700 list-decimal pl-5">
          <li>Register the device on the <b>Devices</b> tab with its serial number (Menu → System Info → Device Info).</li>
          <li>Connect the device to the internet (Wi-Fi or LAN) and open <b>Menu → Comm. → Cloud Server Setting</b> (eSSL: <i>ADMS</i>).</li>
          <li>Enter these values and save. Turn <b>Domain Name / HTTPS</b> on if the device asks:</li>
        </ol>
        <div className="mt-3 space-y-2"><Row k="Server address" v={HOST} /><Row k="Server port" v="443" /><Row k="Enable proxy" v="Off" /></div>
        <ol start={4} className="mt-3 space-y-3 text-sm text-slate-700 list-decimal pl-5">
          <li>Enrol each person on the device with the <b>same user ID</b> shown on the ID mapping tab.</li>
          <li>The device shows a cloud icon when connected; its status here turns <b>Online</b> within a minute.</li>
        </ol>
        <p className="mt-4 text-xs text-slate-500">Older firmware without HTTPS: ask your eSSL/ZKTeco dealer to update the ADMS firmware, or use Option 2.</p>
      </Card>
      <div className="space-y-6">
        <Card title="Option 2: Middleware / webhook" icon={Server}>
          <p className="text-sm text-slate-600 mb-3">If the device is managed by eTimeTrackLite, BioTime or your own script on the office PC, post punches as JSON:</p>
          <pre className="rounded-xl bg-slate-900 text-slate-100 text-xs p-4 overflow-x-auto nice-scroll">{`POST https://${HOST}/api/biometric
Content-Type: application/json

{
  "deviceSn": "${devices[0]?.serialNo || 'DEVICE_SN'}",
  "token": "<device token from the Devices tab>",
  "records": [
    { "pin": "1001", "time": "2026-11-07 09:02:11" }
  ]
}`}</pre>
        </Card>
        <Card title="Option 3: Upload an export" icon={BookOpen}>
          <p className="text-sm text-slate-600">No internet on the device? Export the log (USB or software) and upload it on the <b>Import / test</b> tab. Works with eTimeTrackLite, ZKTime.Net, BioTime and generic CSV.</p>
        </Card>
        <Card title="How punches are used" icon={CheckCircle2}>
          <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
            <li><b>Students:</b> first punch of the day marks <b>P</b> for their batch, or <b>L</b> if after the batch start time + grace. A manual "A" is corrected to P/L when they punch.</li>
            <li><b>Faculty & staff:</b> first punch = in-time, last punch = out-time, status P, shown in Attendance → Staff attendance.</li>
            <li>Unknown IDs are kept in the punch log so you can map them later.</li>
            {MODE === 'demo' && <li className="text-amber-700">Demo mode: device push needs the live (Supabase) portal; Import / test works here.</li>}
          </ul>
        </Card>
      </div>
    </div>
  )
}
