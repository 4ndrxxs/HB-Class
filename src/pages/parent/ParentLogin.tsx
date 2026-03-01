import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parentLogin } from '@/lib/parentAuth'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

export default function ParentLogin() {
  const navigate = useNavigate()
  const { initialize } = useAuthStore()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone.trim() || !password) {
      toast.error('전화번호와 비밀번호를 입력하세요')
      return
    }

    setIsLoading(true)
    try {
      await parentLogin(phone, password)
      await initialize()
      navigate('/parent')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '로그인에 실패했습니다')
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
          <p className="text-sm text-gray-500">학부모 로그인</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="비밀번호"
              type="password"
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/parent/register')}
            className="text-sm text-blue-600 hover:underline"
          >
            계정이 없으신가요? 회원가입
          </button>
        </div>
      </div>
    </div>
  )
}
