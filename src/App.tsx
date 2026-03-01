import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import WeeklyPage from '@/pages/admin/WeeklyPage'
import MonthlyPage from '@/pages/admin/MonthlyPage'
import StudentsPage from '@/pages/admin/StudentsPage'
import SettingsPage from '@/pages/admin/SettingsPage'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/weekly" replace />} />
        <Route path="/weekly" element={<WeeklyPage />} />
        <Route path="/monthly" element={<MonthlyPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
