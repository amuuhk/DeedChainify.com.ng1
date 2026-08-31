import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { LogoProvider } from '@/lib/logo-context';
import { LanguageProvider } from '@/lib/language-context';
import { ThemeProvider } from '@/lib/theme-context';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://deedchainify.com'),
  title: 'DeedChainify — Rebuilding Trust in Property',
  description: 'Verify land in 60 seconds. Make every land in Nigeria bankable with DCID, QR, and Community Verification.',
  openGraph: {
    title: 'DeedChainify',
    description: 'Verify land in 60 seconds. Make every land in Nigeria bankable.',
    images: [{ url: '/og-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <LogoProvider>
              <LanguageProvider>
                {children}
                <Toaster />
              </LanguageProvider>
            </LogoProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
