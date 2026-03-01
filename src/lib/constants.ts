import type { GradeLevel } from '@/types'

export const GRADE_COLORS: Record<GradeLevel, string> = {
  elementary: '#FCD34D',
  middle: '#60A5FA',
  high: '#F87171',
}

export const GRADE_LABELS: Record<GradeLevel, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
}

export const GRADE_BG_CLASSES: Record<GradeLevel, string> = {
  elementary: 'bg-yellow-300/80',
  middle: 'bg-blue-400/80',
  high: 'bg-red-400/80',
}

export const GRADE_TEXT_CLASSES: Record<GradeLevel, string> = {
  elementary: 'text-yellow-900',
  middle: 'text-blue-900',
  high: 'text-red-900',
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
