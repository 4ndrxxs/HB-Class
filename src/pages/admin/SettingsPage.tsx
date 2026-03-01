import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'

export default function SettingsPage() {
  return (
    <AppLayout>
      <Header title="설정" />
      <div className="p-4">
        <p className="text-muted-foreground">설정 페이지 (구현 예정)</p>
      </div>
    </AppLayout>
  )
}
