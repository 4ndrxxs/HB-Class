import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signInWithProvider } from '@/lib/parentAuth'
import { toast } from 'sonner'

export default function ParentLogin() {
  const [isLoading, setIsLoading] = useState<'google' | 'kakao' | null>(null)

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    setIsLoading(provider)
    try {
      await signInWithProvider(provider)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '로그인에 실패했습니다')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <img src="/logo-rounded.png" alt="HB Class" className="w-24 h-24 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">HB Class</h1>
          <p className="text-sm text-gray-500">학부모 전용 앱</p>
        </div>

        {/* Social login buttons */}
        <div className="space-y-3">
          <Button
            className="w-full h-12 bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] gap-3 text-base font-medium"
            onClick={() => handleSocialLogin('kakao')}
            disabled={isLoading !== null}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.76 5.01 4.41 6.34l-1.12 4.11a.3.3 0 00.45.33l4.77-3.15c.49.05.99.08 1.49.08 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"
                fill="#191919"
              />
            </svg>
            {isLoading === 'kakao' ? '로그인 중...' : '카카오로 시작하기'}
          </Button>

          <Button
            className="w-full h-12 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 gap-3 text-base font-medium"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading !== null}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isLoading === 'google' ? '로그인 중...' : 'Google로 시작하기'}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400">
          로그인하면 서비스 이용약관에 동의하게 됩니다
        </p>
      </div>
    </div>
  )
}
