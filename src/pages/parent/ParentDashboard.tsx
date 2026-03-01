import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { GRADE_LABELS, GRADE_BG_CLASSES, GRADE_TEXT_CLASSES, DAY_LABELS } from '@/lib/constants'
import type { ScheduleEventWithStudent, GradeLevel, Student } from '@/types'

const STATUS_CONFIG = {
  scheduled: { label: '예정', dot: 'bg-blue-500' },
  completed: { label: '완료', dot: 'bg-green-500' },
  absent: { label: '결석', dot: 'bg-red-500' },
} as const

export default function ParentDashboard() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const [student, setStudent] = useState<Student | null>(null)
  const [events, setEvents] = useState<ScheduleEventWithStudent[]>([])
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [isLoading, setIsLoading] = useState(true)

  // Fetch student linked to this parent
  useEffect(() => {
    const loadStudent = async () => {
      if (!profile) {
        setIsLoading(false)
        return
      }

      // 인증된 학부모: parent_id로 조회, dev 모드: 첫 번째 학생
      const query = profile.id === 'dev-admin'
        ? supabase.from('students').select('*').limit(1).single()
        : supabase.from('students').select('*').eq('parent_id', profile.id).limit(1).single()

      const { data } = await query
      if (data) setStudent(data)
      setIsLoading(false)
    }
    loadStudent()
  }, [profile])

  // Fetch events for current month
  useEffect(() => {
    if (!student) return
    const loadEvents = async () => {
      const monthEnd = endOfMonth(currentMonth)
      const { data } = await supabase
        .from('schedule_events')
        .select('*, student:students(*)')
        .eq('student_id', student.id)
        .gte('date', format(currentMonth, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'))
        .order('date')
        .order('start_time')
      if (data) setEvents(data as ScheduleEventWithStudent[])
    }
    loadEvents()
  }, [student, currentMonth])

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, ScheduleEventWithStudent[]> = {}
    for (const event of events) {
      if (!map[event.date]) map[event.date] = []
      map[event.date].push(event)
    }
    return map
  }, [events])

  // Stats
  const totalClasses = events.length
  const absentCount = events.filter((e) => e.status === 'absent').length
  const completedCount = events.filter((e) => e.status === 'completed').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <span className="text-muted-foreground">불러오는 중...</span>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <span className="text-muted-foreground">등록된 학생이 없습니다</span>
      </div>
    )
  }

  const grade = student.grade_level as GradeLevel

  return (
    <div className="max-w-lg mx-auto bg-white min-h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-rounded.png" alt="HB Class" className="w-8 h-8" />
            <span className="text-lg font-bold">{student.name}</span>
            <Badge className={`${GRADE_BG_CLASSES[grade]} ${GRADE_TEXT_CLASSES[grade]} border-0`}>
              {GRADE_LABELS[grade]}
            </Badge>
          </div>
          {profile?.id !== 'dev-admin' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut()
                navigate('/parent/login')
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Month stats summary */}
      <div className="grid grid-cols-3 gap-2 p-4">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalClasses}</div>
          <div className="text-xs text-blue-600/70">전체 수업</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          <div className="text-xs text-green-600/70">완료</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          <div className="text-xs text-red-600/70">결석</div>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between px-4 py-2">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Mini calendar */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-7 mb-1">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <div key={day} className="text-center text-[10px] font-medium text-gray-400 py-1">
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[dateStr] || []
            const inMonth = isSameMonth(day, currentMonth)
            const today = isToday(day)

            return (
              <div
                key={dateStr}
                className={`text-center py-1.5 ${!inMonth ? 'opacity-20' : ''}`}
              >
                <div
                  className={`text-xs mx-auto w-6 h-6 flex items-center justify-center rounded-full ${
                    today ? 'bg-blue-600 text-white font-bold' : 'text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                {inMonth && dayEvents.length > 0 && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {dayEvents.map((e) => (
                      <span
                        key={e.id}
                        className={`w-1 h-1 rounded-full ${STATUS_CONFIG[e.status].dot}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <div className="px-4 pb-20">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          {format(currentMonth, 'M월', { locale: ko })} 수업 일정
        </h3>
        <div className="space-y-1.5">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">일정이 없습니다</p>
          ) : (
            events.map((event) => {
              const config = STATUS_CONFIG[event.status]
              return (
                <div key={event.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {format(new Date(event.date), 'M/d (EEE)', { locale: ko })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.start_time.slice(0, 5)} ~ {event.end_time.slice(0, 5)}
                      {event.type === 'makeup' && ' (보강)'}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    event.status === 'absent' ? 'bg-red-100 text-red-700' :
                    event.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {config.label}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
