import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { completeProfile, verifyAcademyCode } from '@/lib/parentAuth'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

type Step = 'profile' | 'academy'

export default function ParentOnboarding() {
  const navigate = useNavigate()
  const { setOnboardingComplete } = useAuthStore()
  const [step, setStep] = useState<Step>('profile')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [academyCode, setAcademyCode] = useState('')
  const [academyId, setAcademyId] = useState<string | null>(null)
  const [academyName, setAcademyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleProfileNext = () => {
    if (!name.trim()) {
      toast.error('이름을 입력하세요')
      return
    }
    const digits = phone.replace(/[^0-9]/g, '')
    if (digits.length < 10) {
      toast.error('올바른 전화번호를 입력하세요')
      return
    }
    setStep('academy')
  }

  const handleVerifyCode = async () => {
    if (!academyCode.trim()) {
      toast.error('학원 코드를 입력하세요')
      return
    }
    setIsLoading(true)
    try {
      const academy = await verifyAcademyCode(academyCode)
      if (!academy) {
        toast.error('유효하지 않은 학원 코드입니다')
        return
      }
      setAcademyId(academy.id)
      setAcademyName(academy.academy_name)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '코드 확인에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!academyId) return
    setIsLoading(true)
    try {
      await completeProfile({ name, phone, academyId })

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profile) {
          setOnboardingComplete(profile)
          toast.success('가입이 완료되었습니다!')
          navigate('/parent')
          return
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프로필 저장에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <img src="/logo-rounded.png" alt="HB Class" className="w-20 h-20 mx-auto" />
          <h1 className="text-xl font-bold text-foreground">HB Class</h1>
          <p className="text-sm text-muted-foreground">
            {step === 'profile' ? '기본 정보를 입력하세요' : '학원 코드를 입력하세요'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-8 h-1 rounded-full ${step === 'profile' ? 'bg-primary' : 'bg-primary'}`}
          />
          <div
            className={`w-8 h-1 rounded-full ${step === 'academy' ? 'bg-primary' : 'bg-border'}`}
          />
        </div>

        {/* Step 1: Profile */}
        {step === 'profile' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">이름</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">전화번호</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                type="tel"
                autoComplete="tel"
              />
              <p className="text-xs text-muted-foreground">
                학원에 등록된 전화번호를 입력하면 자녀가 자동으로 연결됩니다
              </p>
            </div>

            <Button className="w-full" onClick={handleProfileNext}>
              다음
            </Button>
          </div>
        )}

        {/* Step 2: Academy Code */}
        {step === 'academy' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">학원 코드</label>
              <div className="flex gap-2">
                <Input
                  value={academyCode}
                  onChange={(e) => {
                    setAcademyCode(e.target.value.toUpperCase())
                    setAcademyId(null)
                    setAcademyName('')
                  }}
                  placeholder="학원에서 받은 코드 입력"
                  className="flex-1"
                  disabled={!!academyId}
                />
                {!academyId && (
                  <Button variant="outline" onClick={handleVerifyCode} disabled={isLoading}>
                    확인
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">소속 학원의 관리자에게 코드를 문의하세요</p>
            </div>

            {academyId && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/50 rounded-xl p-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm text-emerald-700 font-medium">{academyName}</p>
                  <p className="text-xs text-emerald-600">학원이 확인되었습니다</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('profile')}
                disabled={isLoading}
              >
                이전
              </Button>
              <Button
                className="flex-1"
                onClick={handleComplete}
                disabled={!academyId || isLoading}
              >
                {isLoading ? '가입 중...' : '가입 완료'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
