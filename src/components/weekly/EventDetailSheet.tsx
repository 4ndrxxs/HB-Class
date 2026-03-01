import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GRADE_LABELS, GRADE_BG_CLASSES, GRADE_TEXT_CLASSES } from '@/lib/constants'
import type { ScheduleEventWithStudent, GradeLevel } from '@/types'
import { useEventStore } from '@/stores/eventStore'
import { toast } from 'sonner'

interface EventDetailSheetProps {
  event: ScheduleEventWithStudent | null
  open: boolean
  onClose: () => void
}

export default function EventDetailSheet({ event, open, onClose }: EventDetailSheetProps) {
  const { updateEventStatus } = useEventStore()

  if (!event) return null

  const grade = event.student.grade_level as GradeLevel

  const handleStatus = async (status: 'scheduled' | 'absent' | 'completed') => {
    try {
      await updateEventStatus(event.id, status)
      toast.success(
        status === 'absent' ? '결석 처리되었습니다' :
        status === 'completed' ? '수업 완료 처리되었습니다' :
        '상태가 변경되었습니다'
      )
      onClose()
    } catch {
      toast.error('상태 변경에 실패했습니다')
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {event.student.name}
            <Badge className={`${GRADE_BG_CLASSES[grade]} ${GRADE_TEXT_CLASSES[grade]} border-0`}>
              {GRADE_LABELS[grade]}
            </Badge>
            {event.type === 'makeup' && (
              <Badge variant="outline">보강</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {event.date} {event.start_time.slice(0, 5)} ~ {event.end_time.slice(0, 5)}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-2">
          {/* Current status */}
          <div className="text-sm text-muted-foreground mb-3">
            현재 상태:{' '}
            <span className="font-medium text-foreground">
              {event.status === 'scheduled' && '예정'}
              {event.status === 'absent' && '결석'}
              {event.status === 'completed' && '완료'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={event.status === 'scheduled' ? 'default' : 'outline'}
              onClick={() => handleStatus('scheduled')}
              className="text-sm"
            >
              예정
            </Button>
            <Button
              variant={event.status === 'absent' ? 'destructive' : 'outline'}
              onClick={() => handleStatus('absent')}
              className="text-sm"
            >
              결석
            </Button>
            <Button
              variant={event.status === 'completed' ? 'default' : 'outline'}
              onClick={() => handleStatus('completed')}
              className="text-sm bg-green-600 hover:bg-green-700 text-white"
              disabled={event.status === 'completed'}
            >
              완료
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
