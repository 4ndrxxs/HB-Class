import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSettingsStore } from '@/stores/settingsStore'
import { DAY_LABELS } from '@/lib/constants'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore()

  const [operatingDays, setOperatingDays] = useState<number[]>([])
  const [dayHours, setDayHours] = useState<Record<string, { start: string; end: string }>>({})
  const [maxCapacity, setMaxCapacity] = useState(14)
  const [gridSnap, setGridSnap] = useState(15)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Sync local state when settings load
  useEffect(() => {
    if (settings) {
      setOperatingDays(settings.operating_days)
      setDayHours(settings.day_hours)
      setMaxCapacity(settings.max_capacity)
      setGridSnap(settings.grid_snap_minutes)
    }
  }, [settings])

  const toggleDay = (day: number) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter((d) => d !== day))
      const updated = { ...dayHours }
      delete updated[String(day)]
      setDayHours(updated)
    } else {
      setOperatingDays([...operatingDays, day].sort((a, b) => a - b))
      setDayHours({ ...dayHours, [String(day)]: { start: '13:00', end: '22:00' } })
    }
  }

  const updateDayHour = (day: number, field: 'start' | 'end', value: string) => {
    setDayHours({
      ...dayHours,
      [String(day)]: { ...dayHours[String(day)], [field]: value },
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings({
        operating_days: operatingDays,
        day_hours: dayHours,
        max_capacity: maxCapacity,
        grid_snap_minutes: gridSnap,
      })
      toast.success('설정이 저장되었습니다')
    } catch {
      toast.error('설정 저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <Header title="설정" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          불러오는 중...
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Header title="설정" />
      <div className="p-4 space-y-6">
        {/* Operating Days */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">운영 요일</h3>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  operatingDays.includes(day)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </section>

        {/* Per-day Operating Hours */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">요일별 운영 시간</h3>
          <div className="space-y-2">
            {operatingDays
              .sort((a, b) => a - b)
              .map((day) => (
                <div key={day} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="w-8 text-sm font-medium text-gray-700">
                    {DAY_LABELS[day]}
                  </span>
                  <input
                    type="time"
                    value={dayHours[String(day)]?.start || '13:00'}
                    onChange={(e) => updateDayHour(day, 'start', e.target.value)}
                    className="flex-1 bg-white border rounded-md px-2 py-1.5 text-sm"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="time"
                    value={dayHours[String(day)]?.end || '22:00'}
                    onChange={(e) => updateDayHour(day, 'end', e.target.value)}
                    className="flex-1 bg-white border rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
              ))}
          </div>
        </section>

        {/* Max Capacity */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">최대 수용 인원</h3>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={50}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">명 (시간당)</span>
          </div>
        </section>

        {/* Grid Snap */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">시간표 스냅 간격</h3>
          <div className="flex gap-2">
            {[15, 30, 60].map((min) => (
              <button
                key={min}
                onClick={() => setGridSnap(min)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  gridSnap === min
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {min}분
              </button>
            ))}
          </div>
        </section>

        {/* Save */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </AppLayout>
  )
}
