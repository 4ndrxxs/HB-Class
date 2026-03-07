import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { supabase } from './supabase'

type OAuthProvider = 'google' | 'kakao'

const REDIRECT_URL = 'com.hbclass.app://auth-callback'

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
    return
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/parent/auth-callback`,
    },
  })

  if (error) throw new Error(error.message)
}

export async function handleAuthCallback(url: string) {
  const parsedUrl = new URL(url)
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''))
  const searchParams = parsedUrl.searchParams
  const getParam = (key: string) => hashParams.get(key) ?? searchParams.get(key)

  const error = getParam('error')
  if (error) {
    const description = getParam('error_description') || '인증에 실패했습니다'
    throw new Error(description)
  }

  const code = getParam('code')
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) throw new Error(exchangeError.message)

    if (Capacitor.isNativePlatform()) {
      await Browser.close()
    }
    return
  }

  const accessToken = getParam('access_token')
  const refreshToken = getParam('refresh_token')

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

export async function getCompletedProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile && profile.name && profile.phone && profile.academy_id) {
    return profile
  }

  return null
}

export async function verifyAcademyCode(code: string) {
  const { data } = await supabase
    .from('academy_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .single()

  return data
}

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

  await supabase.from('students').update({ parent_id: user.id }).eq('parent_phone', normalizedPhone)

  return user
}
