import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DAY_LABELS } from '@/lib/constants'

export interface ScheduleRow {
  day_of_week: number
  start_time: string
  end_time: string
}

interface ScheduleInputProps {
  schedules: ScheduleRow[]
  onChange: (schedules: ScheduleRow[]) => void
}

const WEEKDAYS = [1, 2, 3, 4, 5] // 월~금
const WEEKEND = [0, 6] // 일, 토

export default function ScheduleInput({ schedules, onChange }: ScheduleInputProps) {
  const addSchedule = (dayOfWeek: number) => {
    onChange([...schedules, { day_of_week: dayOfWeek, start_time: '16:00', end_time: '18:00' }])
  }

  const removeSchedule = (index: number) => {
    onChange(schedules.filter((_, i) => i !== index))
  }

  const updateTime = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const updated = schedules.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    onChange(updated)
  }

  const selectedDays = new Set(schedules.map((s) => s.day_of_week))

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">정규 수업 요일</label>

      {/* Day selector */}
      <div className="flex gap-1.5">
        {[...WEEKDAYS, ...WEEKEND].map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => {
              if (selectedDays.has(day)) {
                onChange(schedules.filter((s) => s.day_of_week !== day))
              } else {
                addSchedule(day)
              }
            }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedDays.has(day)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>

      {/* Time inputs per day */}
      {schedules
        .sort((a, b) => a.day_of_week - b.day_of_week)
        .map((schedule, index) => (
          <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <Badge variant="secondary" className="shrink-0">
              {DAY_LABELS[schedule.day_of_week]}
            </Badge>
            <input
              type="time"
              value={schedule.start_time}
              onChange={(e) => updateTime(index, 'start_time', e.target.value)}
              className="flex-1 bg-white border rounded-md px-2 py-1 text-sm"
            />
            <span className="text-gray-400">~</span>
            <input
              type="time"
              value={schedule.end_time}
              onChange={(e) => updateTime(index, 'end_time', e.target.value)}
              className="flex-1 bg-white border rounded-md px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeSchedule(index)}
              className="text-gray-400 hover:text-red-500 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

      {schedules.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          위 요일 버튼을 눌러 수업 요일을 선택하세요
        </p>
      )}
    </div>
  )
}
