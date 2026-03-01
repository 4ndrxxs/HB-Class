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
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <Button variant="ghost" size="icon" onClick={onPrev}>
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </span>
        {!isCurrentMonth && (
          <Button variant="outline" size="sm" onClick={onToday} className="text-xs h-6 px-2">
            이번 달
          </Button>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={onNext}>
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  )
}
