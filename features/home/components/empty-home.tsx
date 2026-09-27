import { AlertCircle } from 'lucide-react'

type GameHomeEmptyStateProps = {
  icon: typeof AlertCircle
  title: string
  description: string
  children?: React.ReactNode
}

export default function GameHomeEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: GameHomeEmptyStateProps) {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full overflow-x-hidden overflow-y-scroll p-4">
      <div className="flex min-h-[calc(100vh-102px)] items-center justify-center">
        <div className="bg-background/80 w-full max-w-xl rounded-2xl border px-6 py-10 text-center shadow-sm backdrop-blur-sm md:px-8">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 flex size-14 items-center justify-center rounded-full border">
            <Icon className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm leading-6">{description}</p>
          </div>
          {children ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
