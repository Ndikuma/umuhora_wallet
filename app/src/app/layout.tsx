
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Source_Code_Pro } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/context/theme-provider';
import { SettingsProvider } from '@/context/settings-context';
import { UserProvider } from '@/context/user-provider';

const fontBody = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const fontCode = Source_Code_Pro({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-code',
});


export const metadata: Metadata = {
  title: 'Umuhora Tech Wallet',
  description: 'Un portefeuille Bitcoin simple et non-custodial',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn("font-body antialiased", fontBody.variable, fontCode.variable)}>
        <SettingsProvider>
          <ThemeProvider>
            <UserProvider>
              {children}
            </UserProvider>
            <Toaster />
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
