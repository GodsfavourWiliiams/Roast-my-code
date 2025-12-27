"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Moon, Sun, Monitor, Robot, Bell, Lock, Key, Skull, SmileyXEyes, Gavel } from "@phosphor-icons/react/dist/ssr"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 100);
  }, []);

  if (!mounted) {
    return null;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      className="space-y-6 max-w-4xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">
          Compliance & Settings
        </h1>
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
            <CardDescription>
              Choose how you want to view your failures.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => setTheme('light')}
            >
              <Sun size={24} weight="bold" />
              Light Mode
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => setTheme('dark')}
            >
              <Moon size={24} weight="bold" />
              Dark Mode
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => setTheme('system')}
            >
              <Monitor size={24} weight="bold" />
              System Auto
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
            <CardDescription>
              Adjust the toxicity level of the AI reviewer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              defaultValue="toxic"
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="passive"
                  id="passive"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="passive"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <SmileyXEyes
                    size={32}
                    className="mb-3 text-muted-foreground"
                  />
                  <span className="font-bold">Passive Aggressive</span>
                  <span className="text-xs text-center text-muted-foreground mt-2">
                    &quot;It works, I guess. If that&apos;s what you were going
                    for.&quot;
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="toxic"
                  id="toxic"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="toxic"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Gavel size={32} className="mb-3 text-primary" />
                  <span className="font-bold">Toxic Senior Dev</span>
                  <span className="text-xs text-center text-muted-foreground mt-2">
                    &quot;This is absolute garbage. Rewrite it or quit.&quot;
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="psycho"
                  id="psycho"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="psycho"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Skull size={32} className="mb-3 text-destructive" />
                  <span className="font-bold text-destructive">
                    Unhinged Psycho
                  </span>
                  <span className="text-xs text-center text-muted-foreground mt-2">
                    [REDACTED] [PROFANITY] DELETE YOUR REPO.
                  </span>
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
            <CardDescription>
              Where should we send the hate mail?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="email-notifs" className="font-medium">
                  Email Alerts
                </Label>
                <span className="text-xs text-muted-foreground">
                  Receive a summary of your failures daily.
                </span>
              </div>
              <Switch id="email-notifs" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="slack-notifs" className="font-medium">
                  Slack/Discord Webhook
                </Label>
                <span className="text-xs text-muted-foreground">
                  Publicly shame you in the team channel.
                </span>
              </div>
              <Switch id="slack-notifs" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} weight="bold" /> Security & Webhooks
            </CardTitle>
            <CardDescription>
              Manage your access tokens and GitHub connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type="password"
                  value="sk_live_XXXXXXXXXXXXXXXXXXXXXXXX"
                  readOnly
                  className="font-mono bg-muted"
                />
                <Button variant="outline">
                  <Key size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook"
                  type="password"
                  value="whsec_XXXXXXXXXXXXXXXXXXXXXXXX"
                  readOnly
                  className="font-mono bg-muted"
                />
                <Button variant="outline">Regenerate</Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" className="w-full">
              Revoke All Access
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}
