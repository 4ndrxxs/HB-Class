import BottomNav from './BottomNav'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-dvh max-w-lg mx-auto bg-white">
      <main className="flex-1 pb-16">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
