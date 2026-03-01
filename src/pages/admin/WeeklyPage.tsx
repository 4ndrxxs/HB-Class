import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import WeekNavigator from '@/components/weekly/WeekNavigator'
import TimelineGrid from '@/components/weekly/TimelineGrid'
import EventDetailSheet from '@/components/weekly/EventDetailSheet'
import { useEventStore } from '@/stores/eventStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { ScheduleEventWithStudent } from '@/types'

export default function WeeklyPage() {
  const {
    events,
    currentWeekStart,
    isLoading,
    fetchEvents,
    nextWeek,
    prevWeek,
    goToday,
  } = useEventStore()

  const { settings, fetchSettings } = useSettingsStore()

  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventWithStudent | null>(null)

  useEffect(() => {
    fetchSettings()
    fetchEvents()
  }, [fetchSettings, fetchEvents])

  return (
    <AppLayout>
      <Header title="HB Class" />

      <WeekNavigator
        weekStart={currentWeekStart}
        onPrev={prevWeek}
        onNext={nextWeek}
        onToday={goToday}
      />

      {settings ? (
        <TimelineGrid
          weekStart={currentWeekStart}
          events={events}
          settings={settings}
          onEventClick={setSelectedEvent}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          {isLoading ? '불러오는 중...' : '설정을 불러올 수 없습니다'}
        </div>
      )}

      <EventDetailSheet
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </AppLayout>
  )
}
