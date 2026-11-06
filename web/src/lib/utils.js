export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
export const today = () => new Date().toISOString().slice(0, 10)
export const cls = (...a) => a.filter(Boolean).join(' ')
export const initials = (n = '') => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()

export function feeSummary(student, fees) {
  const paid = fees.filter((f) => f.studentId === student.id).reduce((s, f) => s + Number(f.amount || 0), 0)
  const total = Number(student.feeTotal || 0) - Number(student.discount || 0)
  return { total, paid, balance: Math.max(0, total - paid) }
}

export function attendanceSummary(studentId, attendance) {
  let p = 0, a = 0, l = 0
  attendance.forEach((r) => { const v = r.records?.[studentId]; if (v === 'P') p++; else if (v === 'A') a++; else if (v === 'L') l++ })
  const total = p + a + l
  return { p, a, l, total, pct: total ? Math.round(((p + l * 0.5) / total) * 100) : 0 }
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename; a.click()
}

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const split = (l) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()).slice(0, -1)
  const head = split(lines[0])
  return lines.slice(1).filter(Boolean).map((l) => { const c = split(l); return Object.fromEntries(head.map((h, i) => [h, c[i] ?? ''])) })
}
