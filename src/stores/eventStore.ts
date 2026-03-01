import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { ScheduleEventWithStudent } from '@/types'
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns'

interface EventState {
  events: ScheduleEventWithStudent[]
  currentWeekStart: Date
  isLoading: boolean

  setWeek: (date: Date) => void
  nextWeek: () => void
  prevWeek: () => void
  goToday: () => void
  fetchEvents: () => Promise<void>
  updateEventTime: (
    eventId: string,
    date: string,
    startTime: string,
    endTime: string
  ) => Promise<void>
  updateEventStatus: (
    eventId: string,
    status: 'scheduled' | 'absent' | 'completed'
  ) => Promise<void>
  addMakeupEvent: (
    studentId: string,
    date: string,
    startTime: string,
    endTime: string,
    sourceEventId?: string
  ) => Promise<void>
}

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }) // Monday
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  currentWeekStart: getWeekStart(new Date()),
  isLoading: false,

  setWeek: (date) => {
    set({ currentWeekStart: getWeekStart(date) })
    get().fetchEvents()
  },

  nextWeek: () => {
    const next = addWeeks(get().currentWeekStart, 1)
    set({ currentWeekStart: next })
    get().fetchEvents()
  },

  prevWeek: () => {
    const prev = addWeeks(get().currentWeekStart, -1)
    set({ currentWeekStart: prev })
    get().fetchEvents()
  },

  goToday: () => {
    set({ currentWeekStart: getWeekStart(new Date()) })
    get().fetchEvents()
  },

  fetchEvents: async () => {
    set({ isLoading: true })
    const { currentWeekStart } = get()
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

    const { data, error } = await supabase
      .from('schedule_events')
      .select('*, student:students(*)')
      .gte('date', format(currentWeekStart, 'yyyy-MM-dd'))
      .lte('date', format(weekEnd, 'yyyy-MM-dd'))
      .order('date')
      .order('start_time')

    if (!error && data) {
      set({ events: data as ScheduleEventWithStudent[] })
    }
    set({ isLoading: false })
  },

  updateEventTime: async (eventId, date, startTime, endTime) => {
    const { error } = await supabase
      .from('schedule_events')
      .update({ date, start_time: startTime, end_time: endTime })
      .eq('id', eventId)

    if (error) throw new Error(error.message)
    await get().fetchEvents()
  },

  updateEventStatus: async (eventId, status) => {
    const { error } = await supabase
      .from('schedule_events')
      .update({ status })
      .eq('id', eventId)

    if (error) throw new Error(error.message)
    await get().fetchEvents()
  },

  addMakeupEvent: async (studentId, date, startTime, endTime, sourceEventId) => {
    const { error } = await supabase.from('schedule_events').insert({
      student_id: studentId,
      date,
      start_time: startTime,
      end_time: endTime,
      type: 'makeup',
      status: 'scheduled',
      source_event_id: sourceEventId || null,
    })

    if (error) throw new Error(error.message)
    await get().fetchEvents()
  },
}))
