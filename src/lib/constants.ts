import type { GradeLevel } from '@/types'

export const GRADE_COLORS: Record<GradeLevel, string> = {
  elementary: '#FDE68A',
  middle: '#93C5FD',
  high: '#FCA5A5',
}

export const GRADE_LABELS: Record<GradeLevel, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
}

export const GRADE_BG_CLASSES: Record<GradeLevel, string> = {
  elementary: 'bg-amber-100',
  middle: 'bg-blue-100',
  high: 'bg-rose-100',
}

export const GRADE_TEXT_CLASSES: Record<GradeLevel, string> = {
  elementary: 'text-amber-700',
  middle: 'text-blue-700',
  high: 'text-rose-700',
}

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export const DEFAULT_OPERATING_DAYS = [1, 2, 3, 4, 5]

export const DEFAULT_DAY_HOURS: Record<string, { start: string; end: string }> = {
  '1': { start: '13:00', end: '22:00' },
  '2': { start: '13:00', end: '22:00' },
  '3': { start: '13:00', end: '22:00' },
  '4': { start: '13:00', end: '22:00' },
  '5': { start: '13:00', end: '22:00' },
}
