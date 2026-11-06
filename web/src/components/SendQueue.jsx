// Guided sending queue for browsers (outside the Android app).
// Pop-up blockers stop scripts from opening many chats at once, so each message gets
// its own tap: "Open next" opens WhatsApp / SMS with the text pre-filled and marks it done.
import { useEffect, useState } from 'react'
import { MessageCircle, Send, Check, Smartphone } from 'lucide-react'
import { Modal } from './ui'
import { onQueue } from '../lib/messaging'
import { db } from '../lib/db'
import { cls } from '../lib/utils'

export default function SendQueue() {
  const [q, setQ] = useState(null)
  const [done, setDone] = useState({})
  useEffect(() => onQueue((x) => { setQ(x); setDone({}) }), [])
  if (!q) return null
  const isWa = q.channel === 'whatsapp'
  const next = q.items.find((i) => !done[i.id])
  function open(item) {
    const url = isWa ? `https://wa.me/${item.phone}?text=${encodeURIComponent(item.text)}` : `sms:${item.phone}?body=${encodeURIComponent(item.text)}`
    if (isWa) window.open(url, '_blank'); else window.location.href = url
    setDone((d) => ({ ...d, [item.id]: true }))
    db.update('messages', item.id, { status: 'opened' }).catch(() => {})
  }
  const count = Object.keys(done).length
  return (
    <Modal open wide onClose={() => setQ(null)} title={`${isWa ? 'WhatsApp' : 'SMS'} queue — ${count}/${q.items.length} opened`}
      footer={<>
        <button className="btn-outline mr-auto" onClick={() => setQ(null)}>Close</button>
        {next ? <button className={cls('btn text-white', isWa ? 'bg-[#25D366] hover:bg-[#1ebe5a]' : 'bg-brand-600 hover:bg-brand-700')} onClick={() => open(next)}>
          {isWa ? <MessageCircle size={16} /> : <Send size={16} />}Open next: {next.name}
        </button> : <button className="btn-primary" onClick={() => setQ(null)}><Check size={16} />All done</button>}
      </>}>
      <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-sm text-indigo-900 flex gap-2 mb-4">
        <Smartphone size={18} className="shrink-0" />
        <span>Each chat opens with the message ready — tap <b>Send</b>, come back here and tap <b>Open next</b>. In the Students Academy Android app this happens automatically{isWa ? ' (it opens the next chat when you return)' : ' and SMS are sent in the background from the SIM'}.</span>
      </div>
      <div className="divide-y divide-slate-100 border rounded-lg max-h-[50vh] overflow-y-auto">
        {q.items.map((i, k) => (
          <div key={i.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="text-xs text-slate-400 w-5">{k + 1}</span>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{i.name}</div><div className="text-xs text-slate-500 truncate">{i.text}</div></div>
            {done[i.id] ? <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"><Check size={12} className="mr-0.5" />Opened</span>
              : <button className="btn-outline btn-sm" onClick={() => open(i)}>Open</button>}
          </div>
        ))}
      </div>
    </Modal>
  )
}
