import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Student, RegularSchedule } from '@/types'

export interface StudentWithSchedules extends Student {
  regular_schedules: RegularSchedule[]
}

interface StudentState {
  students: StudentWithSchedules[]
  isLoading: boolean
  searchQuery: string
  gradeFilter: string | null

  setSearchQuery: (query: string) => void
  setGradeFilter: (grade: string | null) => void
  fetchStudents: () => Promise<void>
  addStudent: (
    student: Pick<Student, 'name' | 'grade_level'> & { memo?: string | null; parent_phone?: string | null },
    schedules: Pick<RegularSchedule, 'day_of_week' | 'start_time' | 'end_time'>[]
  ) => Promise<void>
  updateStudent: (
    id: string,
    student: Pick<Student, 'name' | 'grade_level'> & { memo?: string | null; parent_phone?: string | null },
    schedules: Pick<RegularSchedule, 'day_of_week' | 'start_time' | 'end_time'>[]
  ) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  isLoading: false,
  searchQuery: '',
  gradeFilter: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setGradeFilter: (grade) => set({ gradeFilter: grade }),

  fetchStudents: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('students')
      .select('*, regular_schedules(*)')
      .order('name')

    if (!error && data) {
      set({ students: data as StudentWithSchedules[] })
    }
    set({ isLoading: false })
  },

  addStudent: async (student, schedules) => {
    const { data, error } = await supabase
      .from('students')
      .insert({
        name: student.name,
        grade_level: student.grade_level,
        parent_phone: student.parent_phone?.replace(/[^0-9]/g, '') || null,
        memo: student.memo || null,
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Failed to add student')

    if (schedules.length > 0) {
      const { error: schedError } = await supabase
        .from('regular_schedules')
        .insert(
          schedules.map((s) => ({
            student_id: data.id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
          }))
        )
      if (schedError) throw new Error(schedError.message)
    }

    await get().fetchStudents()
  },

  updateStudent: async (id, student, schedules) => {
    const { error } = await supabase
      .from('students')
      .update({
        name: student.name,
        grade_level: student.grade_level,
        parent_phone: student.parent_phone?.replace(/[^0-9]/g, '') || null,
        memo: student.memo || null,
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    // 기존 스케줄 삭제 후 재생성
    await supabase.from('regular_schedules').delete().eq('student_id', id)

    if (schedules.length > 0) {
      const { error: schedError } = await supabase
        .from('regular_schedules')
        .insert(
          schedules.map((s) => ({
            student_id: id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
          }))
        )
      if (schedError) throw new Error(schedError.message)
    }

    await get().fetchStudents()
  },

  deleteStudent: async (id) => {
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await get().fetchStudents()
  },
}))
