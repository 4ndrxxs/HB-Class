import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import StudentList from '@/components/students/StudentList'

export default function StudentsPage() {
  return (
    <AppLayout>
      <Header title="학생 관리" />
      <StudentList />
    </AppLayout>
  )
}
