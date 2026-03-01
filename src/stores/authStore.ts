import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { getCompletedProfile } from '@/lib/parentAuth'
import type { Profile, Role } from '@/types'

interface AuthState {
  profile: Profile | null
  role: Role
  isLoading: boolean
  isAuthenticated: boolean
  onboardingNeeded: boolean

  initialize: () => Promise<void>
  setDevAdmin: () => void
  setOnboardingComplete: (profile: Profile) => void
  signOut: () => Promise<void>
}

// 개발 단계에서는 인증 없이 관리자 모드로 진입
const DEV_ADMIN_PROFILE: Profile = {
  id: 'dev-admin',
  role: 'admin',
  name: '관리자',
  phone: '010-0000-0000',
  email: null,
  academy_id: null,
  created_at: new Date().toISOString(),
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  role: 'admin',
  isLoading: true,
  isAuthenticated: false,
  onboardingNeeded: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        // 세션 있음 → 프로필 완성 여부 확인
        const profile = await getCompletedProfile()

        if (profile) {
          // 온보딩 완료된 유저
          set({
            profile,
            role: profile.role,
            isAuthenticated: true,
            isLoading: false,
            onboardingNeeded: false,
          })
          return
        }

        // 세션은 있지만 프로필 미완성 (첫 소셜 로그인)
        set({
          profile: null,
          role: 'parent',
          isAuthenticated: true,
          isLoading: false,
          onboardingNeeded: true,
        })
        return
      }

      // 세션 없으면 dev mode
      set({
        profile: DEV_ADMIN_PROFILE,
        role: 'admin',
        isAuthenticated: true,
        isLoading: false,
        onboardingNeeded: false,
      })
    } catch {
      // 에러 시에도 dev mode로 진입
      set({
        profile: DEV_ADMIN_PROFILE,
        role: 'admin',
        isAuthenticated: true,
        isLoading: false,
        onboardingNeeded: false,
      })
    }
  },

  setDevAdmin: () => {
    set({
      profile: DEV_ADMIN_PROFILE,
      role: 'admin',
      isAuthenticated: true,
      isLoading: false,
      onboardingNeeded: false,
    })
  },

  setOnboardingComplete: (profile: Profile) => {
    set({
      profile,
      role: 'parent',
      isAuthenticated: true,
      isLoading: false,
      onboardingNeeded: false,
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({
      profile: null,
      role: 'admin',
      isAuthenticated: false,
      onboardingNeeded: false,
    })
  },
}))
