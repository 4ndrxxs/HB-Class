import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { GRADE_LABELS, GRADE_BG_CLASSES, GRADE_TEXT_CLASSES } from '@/lib/constants'
import type { ScheduleEventWithStudent, GradeLevel } from '@/types'

interface DayDetailSheetProps {
  date: Date | null
  events: ScheduleEventWithStudent[]
  open: boolean
  onClose: () => void
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: '예정', className: 'bg-blue-100 text-blue-700' },
  completed: { label: '완료', className: 'bg-green-100 text-green-700' },
  absent: { label: '결석', className: 'bg-red-100 text-red-700' },
}

export default function DayDetailSheet({ date, events, open, onClose }: DayDetailSheetProps) {
  if (!date) return null

  const sortedEvents = [...events].sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[60dvh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{format(date, 'M월 d일 (EEE)', { locale: ko })}</SheetTitle>
          <SheetDescription>총 {events.length}개 수업</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {sortedEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">일정이 없습니다</p>
          ) : (
            sortedEvents.map((event) => {
              const grade = event.student.grade_level as GradeLevel
              const status = STATUS_LABELS[event.status]

              return (
                <div key={event.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 shrink-0 w-20">
                    {event.start_time.slice(0, 5)}~{event.end_time.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{event.student.name}</span>
                      <Badge
                        className={`${GRADE_BG_CLASSES[grade]} ${GRADE_TEXT_CLASSES[grade]} border-0 text-[10px] px-1.5 py-0`}
                      >
                        {GRADE_LABELS[grade]}
                      </Badge>
                      {event.type === 'makeup' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          보강
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={`${status.className} border-0 text-[10px]`}>
                    {status.label}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
