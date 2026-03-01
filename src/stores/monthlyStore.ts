import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { ScheduleEventWithStudent } from '@/types'
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
} from 'date-fns'

interface MonthlyState {
  events: ScheduleEventWithStudent[]
  currentMonth: Date
  isLoading: boolean

  setMonth: (date: Date) => void
  nextMonth: () => void
  prevMonth: () => void
  goToday: () => void
  fetchMonthEvents: () => Promise<void>
}

export const useMonthlyStore = create<MonthlyState>((set, get) => ({
  events: [],
  currentMonth: startOfMonth(new Date()),
  isLoading: false,

  setMonth: (date) => {
    set({ currentMonth: startOfMonth(date) })
    get().fetchMonthEvents()
  },

  nextMonth: () => {
    set({ currentMonth: addMonths(get().currentMonth, 1) })
    get().fetchMonthEvents()
  },

  prevMonth: () => {
    set({ currentMonth: addMonths(get().currentMonth, -1) })
    get().fetchMonthEvents()
  },

  goToday: () => {
    set({ currentMonth: startOfMonth(new Date()) })
    get().fetchMonthEvents()
  },

  fetchMonthEvents: async () => {
    set({ isLoading: true })
    const { currentMonth } = get()
    const monthEnd = endOfMonth(currentMonth)

    const { data, error } = await supabase
      .from('schedule_events')
      .select('*, student:students(*)')
      .gte('date', format(currentMonth, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'))
      .order('date')
      .order('start_time')

    if (!error && data) {
      set({ events: data as ScheduleEventWithStudent[] })
    }
    set({ isLoading: false })
  },
}))
