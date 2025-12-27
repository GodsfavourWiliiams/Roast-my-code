import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Lightning } from "@phosphor-icons/react/dist/ssr"
import { Flame } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 gap-8 text-center bg-background">
      <div className="max-w-2xl space-y-4">
        <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 text-primary animate-pulse">
                <Flame className="w-16 h-16" />
            </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
          Roast My Code
        </h1>
        <p className="text-xl text-muted-foreground">
          The AI-powered Senior Engineer that hates your code as much as you do.
          Get instant, brutal feedback on every Pull Request.
        </p>
      </div>

      <div className="flex gap-4">
        <Link href="/login">
            <Button size="lg" className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                Begin the Roast <Lightning size={18} weight="bold" />
            </Button>
        </Link>
        <Button variant="outline" size="lg">
            View My Shame (GitHub)
        </Button>
      </div>
      
      <div className="absolute bottom-8 text-sm text-muted-foreground">
        <p>Warning: emotional damage may occur.</p>
      </div>
    </div>
  );
}