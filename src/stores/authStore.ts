import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile, Role } from '@/types'

interface AuthState {
  profile: Profile | null
  role: Role
  isLoading: boolean
  isAuthenticated: boolean

  initialize: () => Promise<void>
  setDevAdmin: () => void
  signOut: () => Promise<void>
}

// 개발 단계에서는 인증 없이 관리자 모드로 진입
const DEV_ADMIN_PROFILE: Profile = {
  id: 'dev-admin',
  role: 'admin',
  name: '관리자',
  phone: '010-0000-0000',
  created_at: new Date().toISOString(),
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  role: 'admin',
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          set({
            profile,
            role: profile.role,
            isAuthenticated: true,
            isLoading: false,
          })
          return
        }
      }

      // 세션 없으면 dev mode
      set({
        profile: DEV_ADMIN_PROFILE,
        role: 'admin',
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      // 에러 시에도 dev mode로 진입
      set({
        profile: DEV_ADMIN_PROFILE,
        role: 'admin',
        isAuthenticated: true,
        isLoading: false,
      })
    }
  },

  setDevAdmin: () => {
    set({
      profile: DEV_ADMIN_PROFILE,
      role: 'admin',
      isAuthenticated: true,
      isLoading: false,
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({
      profile: null,
      role: 'admin',
      isAuthenticated: false,
    })
  },
}))
