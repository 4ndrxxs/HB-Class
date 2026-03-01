interface HeaderProps {
  title: string
  rightAction?: React.ReactNode
}

export default function Header({ title, rightAction }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-white border-b border-border z-40">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  )
}
