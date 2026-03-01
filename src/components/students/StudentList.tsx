import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Users, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useStudentStore, type StudentWithSchedules } from '@/stores/studentStore'
import StudentCard from './StudentCard'
import StudentForm from './StudentForm'
import CsvImport from './CsvImport'

const GRADE_FILTERS: { value: string | null; label: string }[] = [
  { value: null, label: '전체' },
  { value: 'elementary', label: '초등' },
  { value: 'middle', label: '중등' },
  { value: 'high', label: '고등' },
]

export default function StudentList() {
  const {
    students,
    isLoading,
    searchQuery,
    gradeFilter,
    setSearchQuery,
    setGradeFilter,
    fetchStudents,
    deleteStudent,
  } = useStudentStore()

  const [formOpen, setFormOpen] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentWithSchedules | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (gradeFilter && s.grade_level !== gradeFilter) return false
      if (searchQuery && !s.name.includes(searchQuery)) return false
      return true
    })
  }, [students, gradeFilter, searchQuery])

  const handleEdit = (student: StudentWithSchedules) => {
    setEditingStudent(student)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await deleteStudent(id)
    } catch {
      // error handled in store
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingStudent(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + Add button */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 검색"
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => setCsvOpen(true)}
            size="icon"
            variant="outline"
            className="shrink-0"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)} size="icon" className="shrink-0">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Grade filter tabs */}
        <div className="flex gap-1">
          {GRADE_FILTERS.map((filter) => (
            <button
              key={filter.value ?? 'all'}
              onClick={() => setGradeFilter(filter.value)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                gradeFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student count */}
      <div className="px-4 py-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{filteredStudents.length}명</span>
      </div>

      {/* Student list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">불러오는 중...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {students.length === 0 ? '등록된 학생이 없습니다' : '검색 결과가 없습니다'}
          </div>
        ) : (
          filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Form sheet */}
      <StudentForm
        open={formOpen}
        onClose={handleFormClose}
        editingStudent={editingStudent}
      />

      {/* CSV import sheet */}
      <CsvImport open={csvOpen} onClose={() => setCsvOpen(false)} />
    </div>
  )
}
