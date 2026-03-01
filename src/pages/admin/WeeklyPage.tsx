import { useEffect, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import WeekNavigator from '@/components/weekly/WeekNavigator'
import TimelineGrid from '@/components/weekly/TimelineGrid'
import EventDetailSheet from '@/components/weekly/EventDetailSheet'
import { useEventStore } from '@/stores/eventStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { ScheduleEventWithStudent } from '@/types'
import { toast } from 'sonner'

export default function WeeklyPage() {
  const {
    events,
    currentWeekStart,
    isLoading,
    fetchEvents,
    nextWeek,
    prevWeek,
    goToday,
    generateWeekEvents,
  } = useEventStore()

  const { settings, fetchSettings } = useSettingsStore()

  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventWithStudent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchEvents()
  }, [fetchSettings, fetchEvents])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const count = await generateWeekEvents()
      if (count > 0) {
        toast.success(`${count}개 수업 일정이 생성되었습니다`)
      } else {
        toast.info('새로 생성할 일정이 없습니다')
      }
    } catch {
      toast.error('일정 생성에 실패했습니다')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleGenerate}
      disabled={isGenerating}
      title="이번 주 일정 생성"
    >
      <CalendarPlus className="w-5 h-5" />
    </Button>
  )

  return (
    <AppLayout>
      <Header title="HB Class" rightAction={generateButton} />

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
