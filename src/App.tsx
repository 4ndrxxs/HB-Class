import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/authStore'
import { initPushNotifications } from '@/lib/pushNotifications'
import WeeklyPage from '@/pages/admin/WeeklyPage'
import MonthlyPage from '@/pages/admin/MonthlyPage'
import StudentsPage from '@/pages/admin/StudentsPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import ParentDashboard from '@/pages/parent/ParentDashboard'

function App() {
  const { isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
    initPushNotifications()
  }, [initialize])

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
        <Route path="/" element={<Navigate to="/weekly" replace />} />
        <Route path="/weekly" element={<WeeklyPage />} />
        <Route path="/monthly" element={<MonthlyPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/parent" element={<ParentDashboard />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
