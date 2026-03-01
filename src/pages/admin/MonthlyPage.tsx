import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'

export default function MonthlyPage() {
  return (
    <AppLayout>
      <Header title="월간 달력" />
      <div className="p-4">
        <p className="text-muted-foreground">월간 달력 뷰 (구현 예정)</p>
      </div>
    </AppLayout>
  )
}
