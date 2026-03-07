import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, isSameMonth } from 'date-fns'
import { ko } from 'date-fns/locale'

interface MonthNavigatorProps {
  currentMonth: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export default function MonthNavigator({
  currentMonth,
  onPrev,
  onNext,
  onToday,
}: MonthNavigatorProps) {
  const isCurrentMonth = isSameMonth(currentMonth, new Date())

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
      <Button variant="ghost" size="icon" onClick={onPrev}>
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </span>
        {!isCurrentMonth && (
          <button
            onClick={onToday}
            className="rounded-full bg-primary/10 text-primary text-xs px-3 h-7 font-medium hover:bg-primary/20 transition-colors"
          >
            이번 달
          </button>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={onNext}>
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  )
}
