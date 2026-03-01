import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'

export default function WeeklyPage() {
  return (
    <AppLayout>
      <Header title="HB Class" />
      <div className="p-4">
        <p className="text-muted-foreground">주간 시간표 뷰 (구현 예정)</p>
      </div>
    </AppLayout>
  )
}
