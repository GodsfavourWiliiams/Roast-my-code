"use client"

import { useState } from "react"
import { useCompletion } from "ai/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Fire, ArrowLeft, CircleNotch } from "@phosphor-icons/react"
import { FileExplorer } from "@/components/file-explorer"
import { fetchFileContent } from "@/app/actions/github-files"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface ManualRoastDialogProps {
  repoName: string // username/repo
  repoId: number
}

export function ManualRoastDialog({ repoName, repoId }: ManualRoastDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'select' | 'roast'>('select')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const queryClient = useQueryClient()

  const { complete, completion, isLoading: isRoasting, error } = useCompletion({
    api: '/api/roast',
    onFinish: () => {
        toast.success("Roast completed and saved.")
        queryClient.invalidateQueries({ queryKey: ['repoDetails'] })
    },
    onError: (err) => {
        toast.error(`Roast failed: ${err.message}`)
    }
  })

  const handleFileSelect = async (path: string) => {
    setLoadingContent(true)
    const { content, error } = await fetchFileContent(repoName, path)
    if (error) {
        toast.error(error)
        setLoadingContent(false)
        return
    }
    setFileContent(content)
    setSelectedFile(path)
    setStep('roast')
    setLoadingContent(false)
    
    // Trigger roast immediately
    complete('', {
        body: {
            code: content,
            filename: path,
            repoId: repoId
        }
    })
  }

  const reset = () => {
    setStep('select')
    setSelectedFile(null)
    setFileContent(null)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
        setOpen(val)
        if (!val) reset()
    }}>
      <DialogTrigger asChild>
        <Button className="uppercase font-bold gap-2 shrink-0">
            <Fire size={18} weight="fill" />
            Roast Manually
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2">
            {step === 'roast' && (
                <Button variant="ghost" size="icon" className="h-6 w-6 mr-2" onClick={reset} disabled={isRoasting}>
                    <ArrowLeft />
                </Button>
            )}
            {step === 'select' ? "Select a File to Roast" : `Roasting ${selectedFile}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' 
                ? "Browse your repository and pick a file. Our AI will analyze it instantly." 
                : "Watch as your code gets torn apart in real-time."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative bg-muted/10">
            {loadingContent && (
                <div className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <CircleNotch size={32} className="animate-spin text-primary" />
                        <p className="text-sm font-bold animate-pulse">Fetching file...</p>
                    </div>
                </div>
            )}

            {step === 'select' ? (
                <div className="p-4 h-full">
                    <FileExplorer repoFullName={repoName} onFileSelect={handleFileSelect} />
                </div>
            ) : (
                <ScrollArea className="h-full p-6">
                    {isRoasting && !completion && (
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                            <CircleNotch className="animate-spin" />
                            <span>Reading code...</span>
                        </div>
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none font-mono whitespace-pre-wrap">
                        {completion}
                    </div>
                </ScrollArea>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
