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
import {
  MoonIcon,
  SunIcon,
  MonitorIcon,
  RobotIcon,
  BellIcon,
  LockIcon,
  SkullIcon,
  SmileyXEyesIcon,
  GavelIcon,
  LightningIcon,
  GithubLogoIcon,
  CheckCircleIcon,
  WarningIcon,
  ArrowsClockwiseIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  getUserSettings,
  updateUserSettings,
  UserSettings,
} from '@/app/actions/settings';
import { toast } from 'sonner';
import { DangerZoneDialog } from '@/components/danger-zone-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { syncInstallation } from '@/app/actions/github-installation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/lib/routes';

export default function SettingsPage() {
  const { setTheme, theme } = useTheme();
  const queryClient = useQueryClient();

  // 1. Fetch Settings using useQuery
  const { data: settings, isLoading: is_loading_settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const { settings, error } = await getUserSettings();
      if (error) throw new Error(error);
      return settings;
    },
  });

  // 2. Update Settings using useMutation with Optimistic Update
  const { mutate: update_settings } = useMutation({
    mutationFn: async (new_settings: Partial<UserSettings>) => {
      const { error } = await updateUserSettings(new_settings)
      if (error) throw new Error(error)
      return new_settings
    },
    onMutate: async (new_settings) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['userSettings'] })

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(['userSettings'])

      // Optimistically update to the new value
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(['userSettings'], {
          ...previousSettings,
          ...new_settings,
        })
      }

      // Return a context object with the snapshotted value
      return { previousSettings }
    },
    onError: (error: unknown, new_settings, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSettings) {
        queryClient.setQueryData(['userSettings'], context.previousSettings)
      }
      const message = error instanceof Error ? error.message : "Failed to save setting"
      toast.error(message)
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
    },
  })

  // 3. Sync Installation using useMutation
  const { mutate: sync_app, isPending: is_syncing } = useMutation({
    mutationFn: async () => {
      const { success, error, installationId } = await syncInstallation();
      if (!success) throw new Error(error || 'Sync failed');
      return installationId;
    },
    onSuccess: () => {
      toast.success('Installation synced successfully!');
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to sync';
      toast.error(message);
    },
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  if (is_loading_settings) {
    return (
      <div className="space-y-6 max-w-4xl p-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 max-w-4xl pb-10"
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
              <MonitorIcon size={20} weight="bold" /> Visual Environment
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
              <SunIcon size={24} weight="bold" /> Light Mode
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => setTheme('dark')}
            >
              <MoonIcon size={24} weight="bold" /> Dark Mode
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => setTheme('system')}
            >
              <MonitorIcon size={24} weight="bold" /> System Auto
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bot Personality */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RobotIcon size={20} weight="bold" /> Bot Personality
            </CardTitle>
            <CardDescription>
              Adjust the toxicity level of the AI reviewer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings?.persona || 'toxic'}
              onValueChange={(val) => update_settings({ persona: val })}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="passive"
                  id="passive"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="passive"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full cursor-pointer transition-all"
                >
                  <SmileyXEyesIcon
                    size={32}
                    className="mb-3 text-muted-foreground"
                  />
                  <span className="font-bold">Passive Aggressive</span>
                  <span className="text-[10px] text-center text-muted-foreground mt-2">
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
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full cursor-pointer transition-all"
                >
                  <GavelIcon size={32} className="mb-3 text-primary" />
                  <span className="font-bold">Toxic Senior Dev</span>
                  <span className="text-[10px] text-center text-muted-foreground mt-2">
                    &quot;This is absolute garbage. Rewrite it or quit.&quot;
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="honest"
                  id="honest"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="honest"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full cursor-pointer transition-all"
                >
                  <RobotIcon size={32} className="mb-3 text-blue-500" />
                  <span className="font-bold text-blue-600">
                    Honest Senior Dev
                  </span>
                  <span className="text-[10px] text-center text-muted-foreground mt-2">
                    &quot;Constructive feedback. I&apos;ll show you how to fix
                    it.&quot;
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="shakespearean"
                  id="shakespearean"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="shakespearean"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full cursor-pointer transition-all"
                >
                  <SkullIcon size={32} className="mb-3 text-purple-500" />
                  <span className="font-bold text-purple-600">
                    Shakespearean
                  </span>
                  <span className="text-[10px] text-center text-muted-foreground mt-2">
                    &quot;Thou art a boil, a plague sore, an embossed
                    carbuncle.&quot;
                  </span>
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
              <LightningIcon size={20} weight="bold" /> Intelligence Model
            </CardTitle>
            <CardDescription>Choose the brain that roasts you.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings?.model || 'gemini-flash-latest'}
              onValueChange={(val) => update_settings({ model: val })}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="gemini-flash-latest"
                  id="gemini"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="gemini"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <span className="font-bold">Google Gemini Flash</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Fast &amp; Free
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="gpt-4o"
                  id="gpt"
                  className="peer sr-only"
                  disabled
                />
                <Label
                  htmlFor="gpt"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-muted/50 p-4 opacity-50 cursor-not-allowed"
                >
                  <span className="font-bold">OpenAI GPT-4o</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Coming Soon (Paid Tier)
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
              <BellIcon size={20} weight="bold" /> Notification Harassment
            </CardTitle>
            <CardDescription>
              Where should we send the hate mail?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="notifs" className="font-medium">
                  Enable Notifications
                </Label>
                <span className="text-xs text-muted-foreground">
                  Receive a summary of your failures.
                </span>
              </div>
              <Switch
                id="notifs"
                checked={settings?.notifications}
                onCheckedChange={(val) =>
                  update_settings({ notifications: val })
                }
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="autorun" className="font-medium">
                  Auto-Run New Repos
                </Label>
                <span className="text-xs text-muted-foreground">
                  Automatically set new imported repos to &apos;Running&apos;.
                </span>
              </div>
              <Switch
                id="autorun"
                checked={settings?.auto_run_new_repos}
                onCheckedChange={(val) =>
                  update_settings({ auto_run_new_repos: val })
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* GitHub App Settings */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GithubLogoIcon size={20} weight="bold" /> GitHub App Connection
            </CardTitle>
            <CardDescription>
              Manage the RoastBot app installation on your GitHub account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.installation_id ? (
              <div
                className={`flex items-center justify-between p-4 border rounded-md ${
                  settings.suspended
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-green-500/10 border-green-500/20'
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-medium ${
                    settings.suspended ? 'text-yellow-600' : 'text-green-600'
                  }`}
                >
                  {settings.suspended ? (
                    <WarningIcon size={20} weight="fill" />
                  ) : (
                    <CheckCircleIcon size={20} weight="fill" />
                  )}
                  {settings.suspended
                    ? 'App Suspended by User'
                    : `App Installed (ID: ${settings.installation_id})`}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={ROUTES.EXTERNAL.GITHUB_APP_MANAGE_INSTALL(settings.installation_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {settings.suspended
                      ? 'Unsuspend on GitHub'
                      : 'Manage on GitHub'}
                  </a>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <div className="flex items-center gap-2 text-yellow-600 font-medium">
                    <WarningIcon size={20} weight="fill" />
                    App Not Installed
                  </div>
                  <Button size="sm" asChild>
                    <a
                      href={ROUTES.EXTERNAL.GITHUB_APP_INITIAL_INSTALL('roastbot-godsfavourwilliams')}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Install App
                    </a>
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sync_app()}
                    disabled={is_syncing}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowsClockwiseIcon
                      className={`mr-2 ${is_syncing ? 'animate-spin' : ''}`}
                    />
                    Sync Installation Status
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={item}>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LockIcon size={20} weight="bold" /> Danger Zone
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