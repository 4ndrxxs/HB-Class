import { supabase } from './supabase'

// 전화번호를 Supabase Auth용 이메일로 변환
function phoneToEmail(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  return `${digits}@hbclass.app`
}

// 전화번호 정규화 (하이픈 제거)
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export async function parentRegister(phone: string, name: string, password: string) {
  const normalizedPhone = normalizePhone(phone)
  const email = phoneToEmail(normalizedPhone)

  // 1. Supabase Auth 회원 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new Error('이미 가입된 전화번호입니다')
    }
    throw new Error(authError.message)
  }

  if (!authData.user) throw new Error('회원가입에 실패했습니다')

  // 2. profiles 테이블에 학부모 프로필 생성
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      role: 'parent',
      name,
      phone: normalizedPhone,
    })

  if (profileError) throw new Error(profileError.message)

  // 3. 전화번호로 매칭되는 학생의 parent_id 업데이트
  await supabase
    .from('students')
    .update({ parent_id: authData.user.id })
    .eq('parent_phone', normalizedPhone)

  return authData.user
}

export async function parentLogin(phone: string, password: string) {
  const email = phoneToEmail(normalizePhone(phone))

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login')) {
      throw new Error('전화번호 또는 비밀번호가 올바르지 않습니다')
    }
    throw new Error(error.message)
  }

  return data.user
}
