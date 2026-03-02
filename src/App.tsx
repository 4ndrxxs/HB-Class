import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/authStore'
import { initPushNotifications } from '@/lib/pushNotifications'
import { handleAuthCallback } from '@/lib/parentAuth'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import WeeklyPage from '@/pages/admin/WeeklyPage'
import MonthlyPage from '@/pages/admin/MonthlyPage'
import StudentsPage from '@/pages/admin/StudentsPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import ParentDashboard from '@/pages/parent/ParentDashboard'
import ParentLogin from '@/pages/parent/ParentLogin'
import ParentOnboarding from '@/pages/parent/ParentOnboarding'

function App() {
  const { isLoading, onboardingNeeded, profile, initialize, listenAuthChanges } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    initialize()
    initPushNotifications()
    const unsubscribe = listenAuthChanges()
    return unsubscribe
  }, [initialize, listenAuthChanges])

  // Native 딥링크 리스너 (OAuth 콜백)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listener = CapApp.addListener('appUrlOpen', async (event) => {
      if (event.url.includes('auth-callback')) {
        try {
          await handleAuthCallback(event.url)
          await initialize()
          navigate('/parent')
        } catch (err) {
          console.error('Auth callback error:', err)
          navigate('/parent/login')
        }
      }
    })

    return () => {
      listener.then((l) => l.remove())
    }
  }, [initialize, navigate])

  // Web OAuth 콜백 (개발용)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      handleAuthCallback(window.location.href)
        .then(() => initialize())
        .then(() => navigate('/parent'))
        .catch(() => navigate('/parent/login'))
    }
  }, [initialize, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        {/* Admin routes */}
        <Route path="/" element={<Navigate to="/weekly" replace />} />
        <Route path="/weekly" element={<WeeklyPage />} />
        <Route path="/monthly" element={<MonthlyPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Parent routes */}
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
    <div className="flex items-center justify-center min-h-dvh">
      <div className="text-muted-foreground">인증 처리 중...</div>
    </div>
  )
}

export default App
