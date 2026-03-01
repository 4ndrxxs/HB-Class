import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { AcademySettings } from '@/types'
import { DEFAULT_OPERATING_DAYS, DEFAULT_DAY_HOURS } from '@/lib/constants'

interface SettingsState {
  settings: AcademySettings | null
  isLoading: boolean

  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<AcademySettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('academy_settings')
      .select('*')
      .limit(1)
      .single()

    if (!error && data) {
      set({ settings: data as AcademySettings })
    } else {
      // Fallback defaults
      set({
        settings: {
          id: '',
          operating_days: DEFAULT_OPERATING_DAYS,
          day_hours: DEFAULT_DAY_HOURS,
          max_capacity: 14,
          grid_snap_minutes: 15,
        },
      })
    }
    set({ isLoading: false })
  },

  updateSettings: async (updates) => {
    const current = get().settings
    if (!current?.id) return

    const { error } = await supabase
      .from('academy_settings')
      .update(updates)
      .eq('id', current.id)

    if (error) throw new Error(error.message)
    await get().fetchSettings()
  },
}))
