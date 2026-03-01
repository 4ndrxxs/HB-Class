import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { ScheduleEventWithStudent } from '@/types'
import { format, startOfWeek, endOfWeek, addWeeks, addDays } from 'date-fns'

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
  generateWeekEvents: () => Promise<number>
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

  generateWeekEvents: async () => {
    const { currentWeekStart } = get()
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

    // Check existing events for the week
    const { data: existing } = await supabase
      .from('schedule_events')
      .select('student_id, date')
      .gte('date', format(currentWeekStart, 'yyyy-MM-dd'))
      .lte('date', format(weekEnd, 'yyyy-MM-dd'))
      .eq('type', 'regular')

    const existingSet = new Set(
      (existing || []).map((e) => `${e.student_id}_${e.date}`)
    )

    // Fetch all regular schedules
    const { data: schedules } = await supabase
      .from('regular_schedules')
      .select('*')

    if (!schedules || schedules.length === 0) return 0

    // Generate events for each schedule entry
    const newEvents: {
      student_id: string
      date: string
      start_time: string
      end_time: string
      type: string
      status: string
    }[] = []

    for (const sched of schedules) {
      // Calculate the date for this day_of_week within the current week
      // Monday=1, Sunday=0 → offset from Monday
      const offset = sched.day_of_week === 0 ? 6 : sched.day_of_week - 1
      const eventDate = addDays(currentWeekStart, offset)
      const dateStr = format(eventDate, 'yyyy-MM-dd')
      const key = `${sched.student_id}_${dateStr}`

      if (!existingSet.has(key)) {
        newEvents.push({
          student_id: sched.student_id,
          date: dateStr,
          start_time: sched.start_time,
          end_time: sched.end_time,
          type: 'regular',
          status: 'scheduled',
        })
      }
    }

    if (newEvents.length > 0) {
      const { error } = await supabase.from('schedule_events').insert(newEvents)
      if (error) throw new Error(error.message)
    }

    await get().fetchEvents()
    return newEvents.length
  },
}))
