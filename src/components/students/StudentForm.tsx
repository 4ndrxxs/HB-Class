import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ScheduleInput, { type ScheduleRow } from './ScheduleInput'
import { useStudentStore, type StudentWithSchedules } from '@/stores/studentStore'
import type { GradeLevel } from '@/types'
import { GRADE_LABELS } from '@/lib/constants'
import { toast } from 'sonner'

interface StudentFormProps {
  open: boolean
  onClose: () => void
  editingStudent?: StudentWithSchedules | null
}

export default function StudentForm({ open, onClose, editingStudent }: StudentFormProps) {
  const { addStudent, updateStudent } = useStudentStore()

  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('middle')
  const [parentPhone, setParentPhone] = useState('')
  const [memo, setMemo] = useState('')
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingStudent

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name)
      setGradeLevel(editingStudent.grade_level as GradeLevel)
      setParentPhone(editingStudent.parent_phone || '')
      setMemo(editingStudent.memo || '')
      setSchedules(
        editingStudent.regular_schedules.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time.slice(0, 5),
          end_time: s.end_time.slice(0, 5),
        }))
      )
    } else {
      setName('')
      setGradeLevel('middle')
      setParentPhone('')
      setMemo('')
      setSchedules([])
    }
  }, [editingStudent, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('이름을 입력하세요')
      return
    }

    setIsSubmitting(true)
    try {
      const studentData = {
        name: name.trim(),
        grade_level: gradeLevel,
        parent_phone: parentPhone.replace(/[^0-9]/g, '') || null,
        memo: memo.trim() || null,
      }

      if (isEditing && editingStudent) {
        await updateStudent(editingStudent.id, studentData, schedules)
        toast.success('학생 정보가 수정되었습니다')
      } else {
        await addStudent(studentData, schedules)
        toast.success('학생이 등록되었습니다')
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? '학생 수정' : '학생 등록'}</SheetTitle>
          <SheetDescription>
            {isEditing ? '학생 정보를 수정합니다' : '새 학생을 등록합니다'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">이름</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="학생 이름"
              autoFocus
            />
          </div>

          {/* Grade */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">학년</label>
            <Select value={gradeLevel} onValueChange={(v) => setGradeLevel(v as GradeLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(GRADE_LABELS) as [GradeLevel, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parent Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">학부모 전화번호</label>
            <Input
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="01012345678"
              type="tel"
            />
          </div>

          {/* Memo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">메모</label>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 (선택사항)"
            />
          </div>

          {/* Schedules */}
          <ScheduleInput schedules={schedules} onChange={setSchedules} />

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : isEditing ? '수정 완료' : '등록'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
