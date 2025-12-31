import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/auth-provider';
import { QueryProvider } from '@/components/query-provider';
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Roast My Code - AI Code Reviewer with Attitude',
    template: '%s | Roast My Code',
  },
  description:
    'Get brutally honest AI-powered code reviews that hurt your feelings. Connect your GitHub repository and let our AI Senior Engineer roast your pull requests with automated feedback, code quality analysis, and ruthless honesty.',
  keywords: [
    'AI code review',
    'automated code review',
    'GitHub code reviewer',
    'AI code analysis',
    'pull request review',
    'code quality checker',
    'AI developer tools',
    'code review automation',
    'GitHub integration',
    'AI senior engineer',
    'code feedback',
    'programming code review',
  ],
  authors: [{ name: 'Roast My Code Team' }],
  creator: 'Roast My Code',
  publisher: 'Roast My Code',
  metadataBase: new URL('https://www.roastmycode.online'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.roastmycode.online',
    siteName: 'Roast My Code',
    title: 'Roast My Code - AI Code Reviewer with Attitude',
    description:
      'Get brutally honest AI-powered code reviews that hurt your feelings. Connect your GitHub repository and let our AI Senior Engineer roast your pull requests.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Roast My Code - AI Code Reviewer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roast My Code - AI Code Reviewer with Attitude',
    description:
      'Get brutally honest AI-powered code reviews. Connect your GitHub repository and let our AI Senior Engineer roast your pull requests.',
    images: ['/og-image.png'],
    creator: '@roastmycode',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  category: 'developer tools',
  classification: 'Developer Tools',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#09090B' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <div className="font-[family-name:var(--font-space-grotesk)] min-h-screen">
                {children}
              </div>
              <Toaster position="top-center" richColors />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
