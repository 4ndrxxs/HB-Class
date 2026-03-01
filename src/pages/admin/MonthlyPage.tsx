import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import MonthNavigator from '@/components/monthly/MonthNavigator'
import CalendarGrid from '@/components/monthly/CalendarGrid'
import DayDetailSheet from '@/components/monthly/DayDetailSheet'
import { useMonthlyStore } from '@/stores/monthlyStore'
import type { ScheduleEventWithStudent } from '@/types'

export default function MonthlyPage() {
  const {
    events,
    currentMonth,
    fetchMonthEvents,
    nextMonth,
    prevMonth,
    goToday,
  } = useMonthlyStore()

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<ScheduleEventWithStudent[]>([])

  useEffect(() => {
    fetchMonthEvents()
  }, [fetchMonthEvents])

  const handleDateClick = (date: Date, dayEvents: ScheduleEventWithStudent[]) => {
    setSelectedDate(date)
    setSelectedEvents(dayEvents)
  }

  return (
    <AppLayout>
      <Header title="월간 달력" />

      <MonthNavigator
        currentMonth={currentMonth}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={goToday}
      />

      <CalendarGrid
        currentMonth={currentMonth}
        events={events}
        onDateClick={handleDateClick}
      />

      <DayDetailSheet
        date={selectedDate}
        events={selectedEvents}
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </AppLayout>
  )
}
