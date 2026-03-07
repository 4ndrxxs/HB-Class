import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GRADE_LABELS, GRADE_BG_CLASSES, GRADE_TEXT_CLASSES, DAY_LABELS } from '@/lib/constants'
import type { StudentWithSchedules } from '@/stores/studentStore'
import type { GradeLevel } from '@/types'

interface StudentCardProps {
  student: StudentWithSchedules
  onEdit: (student: StudentWithSchedules) => void
  onDelete: (id: string) => void
}

export default function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  const grade = student.grade_level as GradeLevel
  const sortedSchedules = [...student.regular_schedules].sort(
    (a, b) => a.day_of_week - b.day_of_week
  )

  return (
    <div className="bg-card rounded-2xl shadow-soft p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base">{student.name}</span>
          <Badge className={`${GRADE_BG_CLASSES[grade]} ${GRADE_TEXT_CLASSES[grade]} border-0`}>
            {GRADE_LABELS[grade]}
          </Badge>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(student)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(student.id)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Schedule chips */}
      {sortedSchedules.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sortedSchedules.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 bg-muted text-foreground/80 rounded-lg px-2 py-0.5 text-xs"
            >
              <span className="font-medium">{DAY_LABELS[s.day_of_week]}</span>
              <span className="text-muted-foreground">
                {s.start_time.slice(0, 5)}~{s.end_time.slice(0, 5)}
              </span>
            </span>
          ))}
        </div>
      )}

      {student.memo && (
        <p className="text-xs text-muted-foreground">{student.memo}</p>
      )}
    </div>
  )
}
