import { GRADE_BG_CLASSES, GRADE_TEXT_CLASSES } from '@/lib/constants'
import type { ScheduleEventWithStudent } from '@/types'
import type { GradeLevel } from '@/types'

interface EventBlockProps {
  event: ScheduleEventWithStudent
  topPx: number
  heightPx: number
  onClick: (event: ScheduleEventWithStudent) => void
}

export default function EventBlock({ event, topPx, heightPx, onClick }: EventBlockProps) {
  const grade = event.student.grade_level as GradeLevel
  const isAbsent = event.status === 'absent'
  const isMakeup = event.type === 'makeup'

  return (
    <button
      onClick={() => onClick(event)}
      className={`absolute left-0.5 right-0.5 rounded-xl px-1.5 py-0.5 text-left overflow-hidden transition-opacity shadow-sm border border-black/[0.04]
        ${GRADE_BG_CLASSES[grade]} ${GRADE_TEXT_CLASSES[grade]}
        ${isAbsent ? 'opacity-40 line-through' : ''}
        ${isMakeup ? 'border-2 border-dashed border-current' : ''}
      `}
      style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 20)}px` }}
    >
      <div className="text-xs font-bold truncate leading-tight">
        {event.student.name}
        {isMakeup && ' (보강)'}
      </div>
      {heightPx > 28 && (
        <div className="text-[10px] opacity-70 truncate">
          {event.start_time.slice(0, 5)}~{event.end_time.slice(0, 5)}
        </div>
      )}
    </button>
  )
}
