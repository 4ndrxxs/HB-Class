import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar, CalendarDays, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const adminTabs = [
  { path: '/weekly', label: '주간', icon: Calendar },
  { path: '/monthly', label: '월간', icon: CalendarDays },
  { path: '/students', label: '학생', icon: Users },
  { path: '/settings', label: '설정', icon: Settings },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {adminTabs.map((tab) => {
          const isActive = location.pathname === tab.path
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
