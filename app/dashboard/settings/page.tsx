"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Moon, Sun, Monitor, Robot, Bell, Lock, Skull, SmileyXEyes, Gavel, Lightning } from "@phosphor-icons/react/dist/ssr"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect, useState } from "react"
import { getUserSettings, updateUserSettings, UserSettings } from "@/app/actions/settings"
import { toast } from "sonner"
import { DangerZoneDialog } from "@/components/danger-zone-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { settings, error } = await getUserSettings()
    if (error) {
      toast.error("Failed to load settings")
    } else {
      setSettings(settings)
    }
    setLoading(false)
  }

  const handleUpdate = async (key: keyof UserSettings, value: any) => {
    if (!settings) return
    
    // Optimistic update
    setSettings({ ...settings, [key]: value })
    
    const { error } = await updateUserSettings({ [key]: value })
    if (error) {
      toast.error("Failed to save setting")
      // Revert would be here in a robust app
    } else {
      toast.success("Preference updated")
    }
  }

  if (!mounted) return null

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  if (loading) {
    return <div className="space-y-6 max-w-4xl p-6"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div>
  }

  return (
    <motion.div
      className="space-y-6 max-w-4xl pb-10"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Compliance & Settings</h1>
        <p className="text-muted-foreground">
          Configure how much you want to be insulted and manage your security.
        </p>
      </motion.div>

      {/* Theme Settings */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor size={20} weight="bold" /> Visual Environment
            </CardTitle>
            <CardDescription>Choose how you want to view your failures.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant={theme === 'light' ? 'default' : 'outline'} className="h-24 flex flex-col gap-2" onClick={() => setTheme('light')}>
              <Sun size={24} weight="bold" /> Light Mode
            </Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} className="h-24 flex flex-col gap-2" onClick={() => setTheme('dark')}>
              <Moon size={24} weight="bold" /> Dark Mode
            </Button>
            <Button variant={theme === 'system' ? 'default' : 'outline'} className="h-24 flex flex-col gap-2" onClick={() => setTheme('system')}>
              <Monitor size={24} weight="bold" /> System Auto
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bot Personality */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Robot size={20} weight="bold" /> Bot Personality
            </CardTitle>
            <CardDescription>Adjust the toxicity level of the AI reviewer.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings?.persona || 'toxic'}
              onValueChange={(val) => handleUpdate('persona', val)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="passive" id="passive" className="peer sr-only" />
                <Label htmlFor="passive" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full cursor-pointer transition-all">
                  <SmileyXEyes size={32} className="mb-3 text-muted-foreground" />
                  <span className="font-bold">Passive Aggressive</span>
                  <span className="text-xs text-center text-muted-foreground mt-2">"It works, I guess. If that's what you were going for."</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="toxic" id="toxic" className="peer sr-only" />
                <Label htmlFor="toxic" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full cursor-pointer transition-all">
                  <Gavel size={32} className="mb-3 text-primary" />
                  <span className="font-bold">Toxic Senior Dev</span>
                  <span className="text-xs text-center text-muted-foreground mt-2">"This is absolute garbage. Rewrite it or quit."</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="honest" id="honest" className="peer sr-only" />
                <Label htmlFor="honest" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full cursor-pointer transition-all">
                  <Robot size={32} className="mb-3 text-blue-500" />
                  <span className="font-bold text-blue-600">Honest Senior Dev</span>
                  <span className="text-xs text-center text-muted-foreground mt-2">"Constructive feedback. I'll show you how to fix it."</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="shakespearean" id="shakespearean" className="peer sr-only" />
                <Label htmlFor="shakespearean" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full cursor-pointer transition-all">
                  <Skull size={32} className="mb-3 text-purple-500" />
                  <span className="font-bold text-purple-600">Shakespearean</span>
                  <span className="text-xs text-center text-muted-foreground mt-2">"Thou art a boil, a plague sore, an embossed carbuncle."</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Model */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightning size={20} weight="bold" /> Intelligence Model
            </CardTitle>
            <CardDescription>Choose the brain that roasts you.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings?.model || 'gemini-flash-latest'}
              onValueChange={(val) => handleUpdate('model', val)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="gemini-flash-latest" id="gemini" className="peer sr-only" />
                <Label htmlFor="gemini" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                  <span className="font-bold">Google Gemini Flash</span>
                  <span className="text-xs text-muted-foreground mt-1">Fast & Free</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="gpt-4o" id="gpt" className="peer sr-only" disabled />
                <Label htmlFor="gpt" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-muted/50 p-4 opacity-50 cursor-not-allowed">
                  <span className="font-bold">OpenAI GPT-4o</span>
                  <span className="text-xs text-muted-foreground mt-1">Coming Soon (Paid Tier)</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} weight="bold" /> Notification Harassment
            </CardTitle>
            <CardDescription>Where should we send the hate mail?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="notifs" className="font-medium">Enable Notifications</Label>
                <span className="text-xs text-muted-foreground">Receive a summary of your failures.</span>
              </div>
              <Switch 
                id="notifs" 
                checked={settings?.notifications}
                onCheckedChange={(val) => handleUpdate('notifications', val)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="webhook" className="font-medium">GitHub Webhook Integration</Label>
                <span className="text-xs text-muted-foreground">Automatically roast PRs upon creation.</span>
              </div>
              <Switch 
                id="webhook" 
                checked={settings?.webhook_enabled}
                onCheckedChange={(val) => handleUpdate('webhook_enabled', val)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={item}>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock size={20} weight="bold" /> Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions. Tread carefully.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <DangerZoneDialog />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}