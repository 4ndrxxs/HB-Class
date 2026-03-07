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
    <nav className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-white/90 backdrop-blur-xl rounded-2xl shadow-nav z-50">
      <div className="flex justify-around items-center h-14">
        {adminTabs.map((tab) => {
          const isActive = location.pathname === tab.path
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[11px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
