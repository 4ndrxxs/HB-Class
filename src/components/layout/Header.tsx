interface HeaderProps {
  title: string
  rightAction?: React.ReactNode
}

export default function Header({ title, rightAction }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-border/40 z-40">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <img src="/logo-rounded.png" alt="HB Class" className="w-8 h-8 rounded-xl" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  )
}
