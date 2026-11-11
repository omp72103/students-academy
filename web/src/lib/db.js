// Unified data layer.
//  • Demo mode (no env vars): data lives in localStorage, seeded on first load.
//  • Production mode (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set): every table is a
//    Supabase table with columns (id text pk, data jsonb, created_at timestamptz).
//    See /supabase/schema.sql for tables + row-level-security policies.
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState, useCallback } from 'react'
import { buildSeed } from './seed'

const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const MODE = SB_URL && SB_KEY ? 'supabase' : 'demo'
export const supabase = MODE === 'supabase' ? createClient(SB_URL, SB_KEY, { auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true } }) : null
// Optional table prefix lets several apps share one Supabase project (e.g. sa_users, sa_fees…)
const PREFIX = import.meta.env.VITE_TABLE_PREFIX || ''
export const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'files'

export const TABLES = ['settings', 'users', 'batches', 'materials', 'attendance', 'tests', 'attempts', 'assignments',
  'submissions', 'fees', 'notices', 'enquiries', 'timetable', 'messages', 'toppers', 'exams', 'devices', 'punches', 'staff_attendance']

export const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// ---------------- change notifications ----------------
const listeners = new Set()
const emit = (table) => listeners.forEach((fn) => fn(table))
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

// ---------------- local adapter ----------------
const KEY = 'students_academy_db_v3'
let mem = null
function loadLocal() {
  if (mem) return mem
  try { mem = JSON.parse(localStorage.getItem(KEY) || 'null') } catch { mem = null }
  if (!mem) { mem = buildSeed(); saveLocal() }
  TABLES.forEach((t) => { if (!mem[t]) mem[t] = [] })
  return mem
}
function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(mem)) } catch (e) { console.warn('storage full', e) } }

const local = {
  async list(t) { return [...loadLocal()[t]] },
  async get(t, id) { return loadLocal()[t].find((r) => r.id === id) || null },
  async insert(t, row) {
    const r = { id: row.id || uid(t[0]), createdAt: new Date().toISOString(), ...row }
    loadLocal()[t].unshift(r); saveLocal(); emit(t); return r
  },
  async insertMany(t, rows) {
    const out = rows.map((row) => ({ id: row.id || uid(t[0]), createdAt: new Date().toISOString(), ...row }))
    loadLocal()[t].unshift(...out); saveLocal(); emit(t); return out
  },
  async update(t, id, patch) {
    const arr = loadLocal()[t]; const i = arr.findIndex((r) => r.id === id)
    if (i < 0) return null
    arr[i] = { ...arr[i], ...patch, updatedAt: new Date().toISOString() }; saveLocal(); emit(t); return arr[i]
  },
  async upsert(t, row) { return (await local.get(t, row.id)) ? local.update(t, row.id, row) : local.insert(t, row) },
  async remove(t, id) { const d = loadLocal(); d[t] = d[t].filter((r) => r.id !== id); saveLocal(); emit(t) },
  reset() { localStorage.removeItem(KEY); mem = null; loadLocal(); TABLES.forEach(emit) },
}

// ---------------- supabase adapter ----------------
// Never persist plaintext passwords in production — Supabase Auth owns credentials.
const scrub = (t, b) => { if (t === 'users') { const { password, ...rest } = b; return rest } return b }
const unwrap = (r) => (r ? { ...r.data, id: r.id, createdAt: r.data?.createdAt || r.created_at } : null)
const sb = {
  async list(t) {
    const { data, error } = await supabase.from(PREFIX + t).select('id,data,created_at').order('created_at', { ascending: false }).limit(5000)
    if (error) throw error; return data.map(unwrap)
  },
  async get(t, id) {
    const { data, error } = await supabase.from(PREFIX + t).select('id,data,created_at').eq('id', id).maybeSingle()
    if (error) throw error; return unwrap(data)
  },
  async insert(t, row) {
    const id = row.id || uid(t[0]); const body = { ...row, id, createdAt: row.createdAt || new Date().toISOString() }
    const { error } = await supabase.from(PREFIX + t).insert({ id, data: scrub(t, body) })
    if (error) throw error; emit(t); return body
  },
  async insertMany(t, rows) {
    const bodies = rows.map((row) => ({ ...row, id: row.id || uid(t[0]), createdAt: new Date().toISOString() }))
    const { error } = await supabase.from(PREFIX + t).insert(bodies.map((b) => ({ id: b.id, data: scrub(t, b) })))
    if (error) throw error; emit(t); return bodies
  },
  async update(t, id, patch) {
    const cur = await sb.get(t, id); if (!cur) return null
    const body = { ...cur, ...patch, updatedAt: new Date().toISOString() }
    const { error } = await supabase.from(PREFIX + t).update({ data: scrub(t, body) }).eq('id', id)
    if (error) throw error; emit(t); return body
  },
  async upsert(t, row) {
    const { error } = await supabase.from(PREFIX + t).upsert({ id: row.id, data: scrub(t, row) })
    if (error) throw error; emit(t); return row
  },
  async remove(t, id) { const { error } = await supabase.from(PREFIX + t).delete().eq('id', id); if (error) throw error; emit(t) },
  reset() {},
}

export const db = MODE === 'supabase' ? sb : local

// ---------------- React hook ----------------
export function useTable(table) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    try { setRows(await db.list(table)) } catch (e) { console.error(table, e) } finally { setLoading(false) }
  }, [table])
  useEffect(() => { reload(); return subscribe((t) => t === table && reload()) }, [table, reload])
  return [rows, loading, reload]
}
