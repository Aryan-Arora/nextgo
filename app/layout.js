import { Source_Sans_3, IBM_Plex_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AppStateProvider } from '@/lib/AppStateContext';
import BootOverlay from '@/components/BootOverlay';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'NEXGO — Multi-courier shipping platform',
  description: 'Compare live rates, book with any courier, and track every shipment in one console.',
};

const THEME_INIT = `
(function () {
  try {
    var stored = localStorage.getItem('nx-theme');
    var theme = stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body>
        <Script id="nx-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <AppStateProvider>{children}</AppStateProvider>
        <BootOverlay />
      </body>
    </html>
  );
}
