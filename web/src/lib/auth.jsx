import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { db, MODE, supabase } from './db'

const Ctx = createContext(null)
const KEY = 'sa_session_v1'

// Role → permissions, modelled on the Educollo ERP role matrix.
export const ROLES = {
  admin: { label: 'Management', color: 'bg-indigo-100 text-indigo-700' },
  faculty: { label: 'Faculty', color: 'bg-emerald-100 text-emerald-700' },
  student: { label: 'Student', color: 'bg-sky-100 text-sky-700' },
  parent: { label: 'Parent', color: 'bg-amber-100 text-amber-700' },
}
export const can = (user, perm) => {
  if (!user) return false
  const m = {
    admin: ['*'],
    faculty: ['dashboard', 'students.view', 'batches.view', 'attendance', 'materials', 'tests', 'results', 'assignments', 'notices', 'timetable.view', 'messaging', 'enquiries.view'],
    student: ['dashboard', 'materials.view', 'tests.take', 'results.own', 'assignments.own', 'notices.view', 'timetable.view', 'attendance.own', 'fees.own'],
    parent: ['dashboard', 'results.own', 'attendance.own', 'fees.own', 'notices.view', 'timetable.view', 'assignments.own'],
  }[user.role] || []
  const base = perm.split('.')[0]
  return m.includes('*') || m.includes(perm) || m.includes(base) || m.some((x) => x.startsWith(base + '.'))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [authError, setAuthError] = useState('')

  async function profileByEmail(email) {
    const all = await db.list('users')
    return all.find((u) => (u.email || '').toLowerCase() === (email || '').toLowerCase()) || null
  }

  // Resolve a Supabase session (password or Google) to a Students Academy profile.
  async function adoptSession(session) {
    if (!session) return null
    const email = session.user.email
    const p = await profileByEmail(email)
    if (!p || p.status === 'inactive') {
      await supabase.auth.signOut()
      setUser(null)
      setAuthError(!p
        ? `${email} is not registered with Students Academy. Ask the office to add this email to your profile, then sign in again.`
        : 'Your account is inactive. Contact the office.')
      return null
    }
    setAuthError(''); setUser(p); return p
  }

  useEffect(() => {
    let sub
    (async () => {
      try {
        if (MODE === 'supabase') {
          // Errors returned by the OAuth provider (?error_description=… or #error_description=…)
          const qs = new URLSearchParams(window.location.search + '&' + window.location.hash.replace(/^#/, ''))
          if (qs.get('error_description')) setAuthError(decodeURIComponent(qs.get('error_description').replace(/\+/g, ' ')))
          const { data } = await supabase.auth.getSession()
          await adoptSession(data.session)
          sub = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') setTimeout(() => adoptSession(session), 0)
            if (event === 'SIGNED_OUT') setUser(null)
          }).data.subscription
        } else {
          const id = localStorage.getItem(KEY)
          if (id) setUser(await db.get('users', id))
        }
      } finally { setReady(true) }
    })()
    return () => sub?.unsubscribe()
  }, []) // eslint-disable-line

  /** Google sign-in. In the Android app it opens Chrome (Google blocks sign-in inside WebViews) and returns via a deep link. */
  async function loginWithGoogle() {
    setAuthError('')
    if (MODE !== 'supabase') throw new Error('Google sign-in works on the live portal (Supabase mode).')
    const inApp = typeof window !== 'undefined' && window.AndroidBridge && typeof window.AndroidBridge.openAuth === 'function'
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: inApp ? 'studentsacademy://auth' : `${window.location.origin}/portal/login`,
        queryParams: { prompt: 'select_account' },
        skipBrowserRedirect: inApp,
      },
    })
    if (error) throw new Error(error.message)
    if (inApp) window.AndroidBridge.openAuth(data.url)
  }

  async function resetPassword(email) {
    if (MODE !== 'supabase') throw new Error('Password reset works on the live portal.')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/portal/reset-password` })
    if (error) throw new Error(error.message)
  }

  async function login(identifier, password) {
    const id = identifier.trim().toLowerCase()
    if (MODE === 'supabase') {
      const { data, error } = await supabase.auth.signInWithPassword({ email: id, password })
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Invalid email or password.' : error.message)
      const p = await adoptSession(data.session)
      if (!p) throw new Error(authErrorFor(id))
      return p
    }
    const all = await db.list('users')
    const u = all.find((x) => (x.email || '').toLowerCase() === id || (x.phone || '') === id || (x.rollNo || '').toLowerCase() === id)
    if (!u || u.password !== password) throw new Error('Invalid credentials. Check your email / phone / roll no. and password.')
    if (u.status === 'inactive') throw new Error('Your account is inactive. Contact the office.')
    localStorage.setItem(KEY, u.id); setUser(u); return u
  }

  async function logout() {
    if (MODE === 'supabase') await supabase.auth.signOut()
    localStorage.removeItem(KEY); setUser(null)
  }

  async function refresh() { if (user) setUser(await db.get('users', user.id)) }

  return <Ctx.Provider value={{ user, ready, login, logout, refresh, loginWithGoogle, resetPassword, authError, setAuthError }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
const authErrorFor = (email) => `${email} is not registered with Students Academy (or is inactive). Contact the office.`

/** Is the Google provider switched on in Supabase? (public endpoint; hides the button until it is) */
export async function googleEnabled() {
  if (MODE !== 'supabase') return false
  try {
    const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } })
    const j = await r.json(); return !!j?.external?.google
  } catch { return false }
}

// Creates a login for a new user. In Supabase mode this registers an Auth account using a
// throw-away client so the admin's own session is not replaced.
export async function createLogin(email, password) {
  if (MODE !== 'supabase' || !email || !password) return
  const c = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await c.auth.signUp({ email, password, options: { data: { app: 'students-academy' } } })
  if (error && !/already registered/i.test(error.message)) throw error
  // Confirm the account straight away (scoped server function; works even if email confirmation is on)
  const prefix = import.meta.env.VITE_TABLE_PREFIX || ''
  await supabase.rpc(prefix + 'confirm_user', { p_email: email }).then(({ error: e }) => e && console.warn('confirm_user', e.message))
}
