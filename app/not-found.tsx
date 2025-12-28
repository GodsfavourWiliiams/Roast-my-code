import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuestionIcon, House } from '@phosphor-icons/react/dist/ssr'

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-none border-4 border-primary bg-muted">
        <QuestionIcon size={48} className="animate-pulse text-primary" />
      </div>
      <h1 className="mb-2 text-6xl font-black tracking-tighter text-primary">404</h1>
      <h2 className="mb-4 text-2xl font-bold uppercase tracking-widest text-foreground">
        Module Not Found
      </h2>
      <p className="mb-8 max-w-md font-mono text-muted-foreground">
        &gt; Error: The requested resource is missing. <br />
        &gt; Likely cause: Developer incompetence or broken routing. <br />
        &gt; Solution: Go back and try not to break things again.
      </p>
      <Button asChild size="lg" className="font-bold uppercase tracking-wide">
        <Link href="/dashboard" className="gap-2">
          <House size={20} weight="bold" />
          Return to Safety
        </Link>
      </Button>
    </div>
  )
}
