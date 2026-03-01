export type Role = 'admin' | 'parent'
export type GradeLevel = 'elementary' | 'middle' | 'high'
export type EventType = 'regular' | 'makeup'
export type EventStatus = 'scheduled' | 'absent' | 'completed'

export interface Profile {
  id: string
  role: Role
  name: string
  phone: string | null
  email: string | null
  academy_id: string | null
  created_at: string
}

export interface AcademyCode {
  id: string
  code: string
  academy_name: string
  is_active: boolean
  created_at: string
}

export interface Student {
  id: string
  name: string
  grade_level: GradeLevel
  parent_id: string | null
  parent_phone: string | null
  memo: string | null
  created_at: string
}

export interface RegularSchedule {
  id: string
  student_id: string
  day_of_week: number
  start_time: string // "HH:MM"
  end_time: string   // "HH:MM"
}

export interface ScheduleEvent {
  id: string
  student_id: string
  date: string       // "YYYY-MM-DD"
  start_time: string // "HH:MM"
  end_time: string   // "HH:MM"
  type: EventType
  status: EventStatus
  source_event_id: string | null
  created_at: string
  updated_at: string
}

export interface AcademySettings {
  id: string
  operating_days: number[]
  day_hours: Record<string, { start: string; end: string }>
  max_capacity: number
  grid_snap_minutes: number
}

export interface ScheduleEventWithStudent extends ScheduleEvent {
  student: Student
}
