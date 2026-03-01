import { useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns'
import type { ScheduleEventWithStudent } from '@/types'
import { DAY_LABELS } from '@/lib/constants'

interface CalendarGridProps {
  currentMonth: Date
  events: ScheduleEventWithStudent[]
  onDateClick: (date: Date, events: ScheduleEventWithStudent[]) => void
}

export default function CalendarGrid({ currentMonth, events, onDateClick }: CalendarGridProps) {
  // Build calendar days (6 weeks grid)
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

  // Day headers (Mon~Sun)
  const dayHeaders = [1, 2, 3, 4, 5, 6, 0] // Mon=1 to Sun=0

  return (
    <div className="flex-1 p-2">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-1 ${
              day === 0 ? 'text-red-400' : day === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            {DAY_LABELS[day]}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate[dateStr] || []
          const inMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)

          const scheduledCount = dayEvents.filter((e) => e.status === 'scheduled').length
          const absentCount = dayEvents.filter((e) => e.status === 'absent').length
          const completedCount = dayEvents.filter((e) => e.status === 'completed').length

          return (
            <button
              key={dateStr}
              onClick={() => onDateClick(day, dayEvents)}
              className={`bg-white min-h-[60px] p-1 text-left transition-colors hover:bg-gray-50 ${
                !inMonth ? 'opacity-30' : ''
              }`}
            >
              <div
                className={`text-xs font-medium mb-0.5 ${
                  today
                    ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center'
                    : 'text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </div>

              {inMonth && dayEvents.length > 0 && (
                <div className="space-y-0.5">
                  {scheduledCount > 0 && (
                    <div className="text-[9px] bg-blue-100 text-blue-700 rounded px-1 truncate">
                      수업 {scheduledCount}
                    </div>
                  )}
                  {completedCount > 0 && (
                    <div className="text-[9px] bg-green-100 text-green-700 rounded px-1 truncate">
                      완료 {completedCount}
                    </div>
                  )}
                  {absentCount > 0 && (
                    <div className="text-[9px] bg-red-100 text-red-700 rounded px-1 truncate">
                      결석 {absentCount}
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
