import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { AuthProvider, useAuth, can } from './lib/auth'
import { ToastProvider, Empty } from './components/ui'
import SiteLayout from './site/SiteLayout'
import Home from './site/Home'
import { About, Courses, StudyMaterial, SaravPariksha, Results as SiteResults, Notices as SiteNotices, Contact, NotFound } from './site/pages'
import { lazy, Suspense } from 'react'
const L = (f, name) => lazy(() => f().then((m) => ({ default: name ? m[name] : m.default })))
const layout = () => import('./portal/Layout'), people = () => import('./portal/People'), acad = () => import('./portal/Academics')
const learn = () => import('./portal/Learning'), tests = () => import('./portal/Tests'), office = () => import('./portal/Office')
const PortalShell = L(layout, 'PortalShell'), Login = L(layout, 'Login'), ResetPassword = L(layout, 'ResetPassword'), Dashboard = L(() => import('./portal/Dashboard'))
const Students = L(people, 'Students'), Parents = L(people, 'Parents'), Faculty = L(people, 'Faculty')
const Batches = L(acad, 'Batches'), Timetable = L(acad, 'Timetable'), Attendance = L(acad, 'Attendance')
const Materials = L(learn, 'Materials'), Assignments = L(learn, 'Assignments')
const Tests = L(tests, 'Tests'), TakeTest = L(tests, 'TakeTest'), ReviewTest = L(tests, 'ReviewTest'), Results = L(tests, 'Results')
const Fees = L(office, 'Fees'), Enquiries = L(office, 'Enquiries'), Notices = L(office, 'Notices'), Messaging = L(office, 'Messaging'), WebsiteContent = L(office, 'WebsiteContent'), SettingsPage = L(office, 'SettingsPage')
const Loader = () => <div className="min-h-[50vh] grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" /></div>

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView(); else window.scrollTo(0, 0) }, [pathname, hash])
  return null
}

function Guard({ perm, children }) {
  const { user } = useAuth()
  return can(user, perm) ? children : <Empty title="You don't have access to this page" hint="Ask the academy office if you need access." />
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ScrollTop />
          <Suspense fallback={<Loader />}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="courses" element={<Courses />} />
              <Route path="study-material" element={<StudyMaterial />} />
              <Route path="sarav-pariksha" element={<SaravPariksha />} />
              <Route path="results" element={<SiteResults />} />
              <Route path="notices" element={<SiteNotices />} />
              <Route path="contact" element={<Contact />} />
            </Route>
            <Route path="portal/login" element={<Login />} />
            <Route path="portal/reset-password" element={<ResetPassword />} />
            <Route path="portal" element={<PortalShell />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<Guard perm="students"><Students /></Guard>} />
              <Route path="parents" element={<Guard perm="parents"><Parents /></Guard>} />
              <Route path="faculty" element={<Guard perm="faculty"><Faculty /></Guard>} />
              <Route path="batches" element={<Guard perm="batches"><Batches /></Guard>} />
              <Route path="timetable" element={<Guard perm="timetable"><Timetable /></Guard>} />
              <Route path="attendance" element={<Guard perm="attendance"><Attendance /></Guard>} />
              <Route path="materials" element={<Guard perm="materials"><Materials /></Guard>} />
              <Route path="assignments" element={<Guard perm="assignments"><Assignments /></Guard>} />
              <Route path="tests" element={<Guard perm="tests"><Tests /></Guard>} />
              <Route path="tests/:id/take" element={<Guard perm="tests.take"><TakeTest /></Guard>} />
              <Route path="tests/:id/review" element={<ReviewTest />} />
              <Route path="results" element={<Guard perm="results"><Results /></Guard>} />
              <Route path="fees" element={<Guard perm="fees"><Fees /></Guard>} />
              <Route path="enquiries" element={<Guard perm="enquiries"><Enquiries /></Guard>} />
              <Route path="notices" element={<Guard perm="notices"><Notices /></Guard>} />
              <Route path="messaging" element={<Guard perm="messaging"><Messaging /></Guard>} />
              <Route path="website" element={<Guard perm="website"><WebsiteContent /></Guard>} />
              <Route path="settings" element={<Guard perm="settings"><SettingsPage /></Guard>} />
            </Route>
            <Route path="*" element={<SiteLayout />}><Route path="*" element={<NotFound />} /></Route>
          </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
    </MotionConfig>
  )
}
