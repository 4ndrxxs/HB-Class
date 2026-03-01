import { supabase } from './supabase'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

type OAuthProvider = 'google' | 'kakao'

const REDIRECT_URL = 'com.hbclass.app://auth-callback'

/**
 * OAuth 소셜 로그인 시작.
 * Native: URL을 받아서 Browser 플러그인으로 오픈.
 * Web: 기본 리다이렉트 동작 사용.
 */
export async function signInWithProvider(provider: OAuthProvider) {
  if (Capacitor.isNativePlatform()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: REDIRECT_URL,
        skipBrowserRedirect: true,
      },
    })

    if (error) throw new Error(error.message)
    if (!data.url) throw new Error('OAuth URL을 가져올 수 없습니다')

    await Browser.open({ url: data.url })
  } else {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/parent/auth-callback',
      },
    })
    if (error) throw new Error(error.message)
  }
}

/**
 * OAuth 콜백 URL 처리.
 * URL fragment에서 access_token, refresh_token 추출 → 세션 설정.
 */
export async function handleAuthCallback(url: string) {
  const hashPart = url.includes('#') ? url.split('#')[1] : url.split('?')[1]
  if (!hashPart) throw new Error('인증 콜백에 토큰 정보가 없습니다')

  const params = new URLSearchParams(hashPart)

  const error = params.get('error')
  if (error) {
    const description = params.get('error_description') || '인증에 실패했습니다'
    throw new Error(description)
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) {
    throw new Error('인증 토큰을 받지 못했습니다')
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (sessionError) throw new Error(sessionError.message)

  if (Capacitor.isNativePlatform()) {
    await Browser.close()
  }
}

/**
 * 프로필 완성 여부 확인.
 * name, phone, academy_id가 모두 있으면 완성된 프로필 반환.
 */
export async function getCompletedProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile && profile.name && profile.phone && profile.academy_id) {
    return profile
  }

  return null
}

/**
 * 학원 코드 검증.
 */
export async function verifyAcademyCode(code: string) {
  const { data } = await supabase
    .from('academy_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .single()

  return data
}

/**
 * 프로필 완성 + 학생 자동 매칭.
 */
export async function completeProfile(params: {
  name: string
  phone: string
  academyId: string
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('인증 정보를 찾을 수 없습니다')

  const normalizedPhone = params.phone.replace(/[^0-9]/g, '')

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    role: 'parent' as const,
    name: params.name,
    phone: normalizedPhone,
    email: user.email || null,
    academy_id: params.academyId,
  })

  if (profileError) {
    if (profileError.message.includes('duplicate') || profileError.message.includes('unique')) {
      throw new Error('이미 등록된 전화번호입니다')
    }
    throw new Error(profileError.message)
  }

  // 전화번호로 학생 자동 매칭
  await supabase.from('students').update({ parent_id: user.id }).eq('parent_phone', normalizedPhone)

  return user
}
