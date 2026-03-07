import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSettingsStore } from '@/stores/settingsStore'
import { DAY_LABELS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Copy, Plus } from 'lucide-react'

export default function SettingsPage() {
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore()

  const [operatingDays, setOperatingDays] = useState<number[]>([])
  const [dayHours, setDayHours] = useState<Record<string, { start: string; end: string }>>({})
  const [maxCapacity, setMaxCapacity] = useState(14)
  const [gridSnap, setGridSnap] = useState(15)
  const [isSaving, setIsSaving] = useState(false)

  // Academy code management
  const [academyCode, setAcademyCode] = useState('')
  const [academyName, setAcademyName] = useState('')
  const [academyCodeId, setAcademyCodeId] = useState<string | null>(null)
  const [newCode, setNewCode] = useState('')
  const [newAcademyName, setNewAcademyName] = useState('')
  const [isCodeSaving, setIsCodeSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
    // Fetch academy code
    supabase
      .from('academy_codes')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setAcademyCodeId(data.id)
          setAcademyCode(data.code)
          setAcademyName(data.academy_name)
        }
      })
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
          <h3 className="text-sm font-semibold text-foreground">운영 요일</h3>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  operatingDays.includes(day)
                    ? 'gradient-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </section>

        {/* Per-day Operating Hours */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">요일별 운영 시간</h3>
          <div className="space-y-2">
            {operatingDays
              .sort((a, b) => a - b)
              .map((day) => (
                <div key={day} className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2">
                  <span className="w-8 text-sm font-medium text-foreground/80">
                    {DAY_LABELS[day]}
                  </span>
                  <input
                    type="time"
                    value={dayHours[String(day)]?.start || '13:00'}
                    onChange={(e) => updateDayHour(day, 'start', e.target.value)}
                    className="flex-1 bg-white border rounded-md px-2 py-1.5 text-sm"
                  />
                  <span className="text-muted-foreground">~</span>
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
          <h3 className="text-sm font-semibold text-foreground">최대 수용 인원</h3>
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
          <h3 className="text-sm font-semibold text-foreground">시간표 스냅 간격</h3>
          <div className="flex gap-2">
            {[15, 30, 60].map((min) => (
              <button
                key={min}
                onClick={() => setGridSnap(min)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  gridSnap === min
                    ? 'gradient-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {min}분
              </button>
            ))}
          </div>
        </section>

        {/* Academy Code Management */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">학원 코드 (학부모 가입용)</h3>
          {academyCodeId ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-2xl px-3 py-2.5">
                <div className="flex-1">
                  <p className="text-xs text-primary">{academyName}</p>
                  <p className="text-lg font-mono font-bold text-primary tracking-wider">
                    {academyCode}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(academyCode)
                    toast.success('코드가 복사되었습니다')
                  }}
                  className="p-2 hover:bg-primary/15 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-primary" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                이 코드를 학부모에게 안내하세요. 학부모가 앱 가입 시 이 코드를 입력해야 합니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                value={newAcademyName}
                onChange={(e) => setNewAcademyName(e.target.value)}
                placeholder="학원 이름 (예: HB Class)"
              />
              <div className="flex gap-2">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="코드 (예: HBCLASS)"
                  className="flex-1 font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isCodeSaving || !newCode.trim() || !newAcademyName.trim()}
                  onClick={async () => {
                    setIsCodeSaving(true)
                    try {
                      const { data, error } = await supabase
                        .from('academy_codes')
                        .insert({
                          code: newCode.trim().toUpperCase(),
                          academy_name: newAcademyName.trim(),
                        })
                        .select()
                        .single()
                      if (error) throw error
                      setAcademyCodeId(data.id)
                      setAcademyCode(data.code)
                      setAcademyName(data.academy_name)
                      setNewCode('')
                      setNewAcademyName('')
                      toast.success('학원 코드가 생성되었습니다')
                    } catch {
                      toast.error('코드 생성에 실패했습니다')
                    } finally {
                      setIsCodeSaving(false)
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Save */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </AppLayout>
  )
}
