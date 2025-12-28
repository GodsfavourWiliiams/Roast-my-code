"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WarningOctagon, Trash, CircleNotch } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { deleteUserAccount } from "@/app/actions/settings"

export function DangerZoneDialog() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const CONFIRMATION_PHRASE = "DELETE-MY-ACCOUNT"

  const handleDelete = async () => {
    if (confirmText !== CONFIRMATION_PHRASE) return

    setIsDeleting(true)
    try {
      const result = await deleteUserAccount()
      if (result.error) {
        toast.error(result.error)
        setIsDeleting(false)
      } else {
        toast.success("Account deleted. Good riddance.")
        setOpen(false)
        router.push("/login")
      }
    } catch (error) {
      toast.error("Failed to delete account.")
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full gap-2 font-bold uppercase tracking-wider">
          <Trash size={18} weight="bold" />
          Disconnect GitHub Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-destructive/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
            <WarningOctagon size={24} weight="fill" />
            DANGER ZONE
          </DialogTitle>
          <DialogDescription className="pt-2 font-medium text-foreground">
            This action is irreversible. It will:
          </DialogDescription>
        </DialogHeader>
        
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground mb-4">
            <li>Remove the bot from all your repositories.</li>
            <li>Permanently delete all roast history and stats.</li>
            <li>Delete your user account and preferences.</li>
            <li>Stop all roastings immediately.</li>
        </ul>

        <div className="space-y-4 bg-destructive/10 p-4 rounded-md border border-destructive/20">
            <Label htmlFor="confirm" className="text-destructive font-bold text-xs uppercase">
                Type "{CONFIRMATION_PHRASE}" to confirm:
            </Label>
            <Input 
                id="confirm" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="border-destructive/30 focus-visible:ring-destructive"
                placeholder={CONFIRMATION_PHRASE}
                autoComplete="off"
            />
        </div>

        <Button 
            variant="destructive" 
            className="w-full font-bold mt-2" 
            disabled={confirmText !== CONFIRMATION_PHRASE || isDeleting}
            onClick={handleDelete}
        >
            {isDeleting ? <CircleNotch className="animate-spin mr-2" /> : null}
            {isDeleting ? "Erasing Everything..." : "I Understand, Delete Everything"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
