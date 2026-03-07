import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { handleAuthCallback } from '@/lib/parentAuth'
import { initPushNotifications } from '@/lib/pushNotifications'
import MonthlyPage from '@/pages/admin/MonthlyPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import StudentsPage from '@/pages/admin/StudentsPage'
import WeeklyPage from '@/pages/admin/WeeklyPage'
import ParentDashboard from '@/pages/parent/ParentDashboard'
import ParentLogin from '@/pages/parent/ParentLogin'
import ParentOnboarding from '@/pages/parent/ParentOnboarding'
import { useAuthStore } from '@/stores/authStore'

function App() {
  const { isLoading, onboardingNeeded, profile, initialize, listenAuthChanges } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    initialize()
    initPushNotifications()
    const unsubscribe = listenAuthChanges()
    return unsubscribe
  }, [initialize, listenAuthChanges])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listener = CapApp.addListener('appUrlOpen', async (event) => {
      if (!event.url.includes('auth-callback')) return

      try {
        await handleAuthCallback(event.url)
        await initialize()
        navigate('/parent')
      } catch (err) {
        console.error('Auth callback error:', err)
        navigate('/parent/login')
      }
    })

    return () => {
      listener.then((registered) => registered.remove())
    }
  }, [initialize, navigate])

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return

    const { pathname, search, hash, href } = window.location
    const isAuthCallbackRoute = pathname === '/parent/auth-callback'
    const hasAuthParams =
      hash.includes('access_token') ||
      search.includes('code=') ||
      search.includes('error=') ||
      hash.includes('error=')

    if (!isAuthCallbackRoute || !hasAuthParams) return

    handleAuthCallback(href)
      .then(() => initialize())
      .then(() => navigate('/parent'))
      .catch(() => navigate('/parent/login'))
  }, [initialize, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/weekly" replace />} />
        <Route path="/weekly" element={<WeeklyPage />} />
        <Route path="/monthly" element={<MonthlyPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/parent/login" element={<ParentLogin />} />
        <Route path="/parent/onboarding" element={<ParentOnboarding />} />
        <Route path="/parent/auth-callback" element={<AuthCallback />} />
        <Route
          path="/parent"
          element={
            onboardingNeeded ? (
              <Navigate to="/parent/onboarding" replace />
            ) : profile?.role === 'parent' ? (
              <ParentDashboard />
            ) : (
              <Navigate to="/parent/login" replace />
            )
          }
        />
      </Routes>
      <Toaster />
    </>
  )
}

function AuthCallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-muted-foreground">인증 처리 중...</div>
    </div>
  )
}

export default App
