import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parentRegister } from '@/lib/parentAuth'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

export default function ParentRegister() {
  const navigate = useNavigate()
  const { initialize } = useAuthStore()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('이름을 입력하세요')
      return
    }
    if (!phone.trim()) {
      toast.error('전화번호를 입력하세요')
      return
    }
    if (password.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다')
      return
    }
    if (password !== passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다')
      return
    }

    setIsLoading(true)
    try {
      await parentRegister(phone, name, password)
      await initialize()
      toast.success('회원가입이 완료되었습니다')
      navigate('/parent')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '회원가입에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <img src="/logo-rounded.png" alt="HB Class" className="w-20 h-20 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900">HB Class</h1>
          <p className="text-sm text-gray-500">학부모 회원가입</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">비밀번호</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">비밀번호 확인</label>
            <Input
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 다시 입력"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '가입 중...' : '회원가입'}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/parent/login')}
            className="text-sm text-blue-600 hover:underline"
          >
            이미 계정이 있으신가요? 로그인
          </button>
        </div>
      </div>
    </div>
  )
}
