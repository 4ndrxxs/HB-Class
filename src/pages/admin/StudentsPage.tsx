import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'

export default function StudentsPage() {
  return (
    <AppLayout>
      <Header title="학생 관리" />
      <div className="p-4">
        <p className="text-muted-foreground">학생 관리 페이지 (구현 예정)</p>
      </div>
    </AppLayout>
  )
}
