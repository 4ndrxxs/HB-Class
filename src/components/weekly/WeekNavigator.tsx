import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, addDays, isThisWeek } from 'date-fns'
import { ko } from 'date-fns/locale'

interface WeekNavigatorProps {
  weekStart: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export default function WeekNavigator({ weekStart, onPrev, onNext, onToday }: WeekNavigatorProps) {
  const weekEnd = addDays(weekStart, 6)
  const isCurrentWeek = isThisWeek(weekStart, { weekStartsOn: 1 })

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
      <Button variant="ghost" size="icon" onClick={onPrev}>
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          {format(weekStart, 'M.d', { locale: ko })} ~ {format(weekEnd, 'M.d', { locale: ko })}
        </span>
        {!isCurrentWeek && (
          <button
            onClick={onToday}
            className="rounded-full bg-primary/10 text-primary text-xs px-3 h-7 font-medium hover:bg-primary/20 transition-colors"
          >
            오늘
          </button>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={onNext}>
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  )
}
