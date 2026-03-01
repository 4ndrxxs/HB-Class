import { useMemo } from 'react'
import { format, addDays, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ScheduleEventWithStudent, AcademySettings } from '@/types'
import EventBlock from './EventBlock'

interface TimelineGridProps {
  weekStart: Date
  events: ScheduleEventWithStudent[]
  settings: AcademySettings
  onEventClick: (event: ScheduleEventWithStudent) => void
}

const HOUR_HEIGHT = 60 // px per hour
const MIN_HOUR = 9
const MAX_HOUR = 23

export default function TimelineGrid({
  weekStart,
  events,
  settings,
  onEventClick,
}: TimelineGridProps) {
  // Determine visible hour range from settings
  const { startHour, endHour } = useMemo(() => {
    let minStart = MAX_HOUR
    let maxEnd = MIN_HOUR
    for (const day of settings.operating_days) {
      const hours = settings.day_hours[String(day)]
      if (hours) {
        const s = parseInt(hours.start.split(':')[0])
        const e = parseInt(hours.end.split(':')[0])
        if (s < minStart) minStart = s
        if (e > maxEnd) maxEnd = e
      }
    }
    return {
      startHour: Math.max(MIN_HOUR, minStart),
      endHour: Math.min(MAX_HOUR, maxEnd),
    }
  }, [settings])

  const totalHours = endHour - startHour
  const gridHeight = totalHours * HOUR_HEIGHT

  // Generate hour labels
  const hours = Array.from({ length: totalHours }, (_, i) => startHour + i)

  // Generate day columns (only operating days)
  const dayColumns = useMemo(() => {
    return settings.operating_days
      .sort((a, b) => a - b)
      .map((dayOfWeek) => {
        // Monday=1 → offset 0
        const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        const date = addDays(weekStart, offset)
        return { dayOfWeek, date, dateStr: format(date, 'yyyy-MM-dd') }
      })
  }, [weekStart, settings.operating_days])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, ScheduleEventWithStudent[]> = {}
    for (const event of events) {
      if (!map[event.date]) map[event.date] = []
      map[event.date].push(event)
    }
    return map
  }, [events])

  // Calculate capacity warnings per hour slot
  const getSlotCount = (dateStr: string, hour: number) => {
    const dateEvents = eventsByDate[dateStr] || []
    return dateEvents.filter((e) => {
      const startH = parseInt(e.start_time.split(':')[0])
      const endH = parseInt(e.end_time.split(':')[0])
      const endM = parseInt(e.end_time.split(':')[1])
      const effectiveEnd = endM > 0 ? endH + 1 : endH
      return startH <= hour && effectiveEnd > hour
    }).length
  }

  // Time to pixel position
  const timeToY = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return (h - startHour + m / 60) * HOUR_HEIGHT
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex min-w-[500px]">
        {/* Time column */}
        <div className="w-12 shrink-0 border-r bg-gray-50">
          <div className="h-10 border-b" /> {/* Header spacer */}
          <div className="relative" style={{ height: `${gridHeight}px` }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-[10px] text-gray-400 text-right pr-1.5 -translate-y-1/2"
                style={{ top: `${(hour - startHour) * HOUR_HEIGHT}px` }}
              >
                {hour}:00
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        {dayColumns.map((col) => {
          const dateEvents = eventsByDate[col.dateStr] || []
          const today = isToday(col.date)

          return (
            <div key={col.dateStr} className="flex-1 min-w-[80px] border-r last:border-r-0">
              {/* Day header */}
              <div
                className={`h-10 flex flex-col items-center justify-center border-b text-xs ${
                  today ? 'bg-blue-50 font-bold text-blue-600' : 'text-gray-600'
                }`}
              >
                <span>{format(col.date, 'EEE', { locale: ko })}</span>
                <span className={today ? 'text-blue-600' : 'text-gray-400'}>
                  {format(col.date, 'd')}
                </span>
              </div>

              {/* Event area */}
              <div className="relative" style={{ height: `${gridHeight}px` }}>
                {/* Hour grid lines */}
                {hours.map((hour) => {
                  const count = getSlotCount(col.dateStr, hour)
                  const overCapacity = count > settings.max_capacity
                  return (
                    <div
                      key={hour}
                      className={`absolute w-full border-b border-gray-100 ${
                        overCapacity ? 'bg-red-50' : ''
                      }`}
                      style={{
                        top: `${(hour - startHour) * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                      }}
                    >
                      {overCapacity && (
                        <span className="absolute top-0 right-0.5 text-[9px] text-red-500 font-bold">
                          {count}/{settings.max_capacity}
                        </span>
                      )}
                    </div>
                  )
                })}

                {/* Event blocks */}
                {dateEvents.map((event) => {
                  const topPx = timeToY(event.start_time)
                  const bottomPx = timeToY(event.end_time)
                  const heightPx = bottomPx - topPx

                  return (
                    <EventBlock
                      key={event.id}
                      event={event}
                      topPx={topPx}
                      heightPx={heightPx}
                      onClick={onEventClick}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
