import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ferdii-AI-Asissten',
  description:
    'Ferdii-AI-Asissten, teman AI untuk menjawab pertanyaan Anda.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ferdii-AI-Asissten',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-180x180.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#f5f5f5" />
        <meta name="description" content={metadata.description as string} />
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ferdii-AI-Asissten" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-100 text-gray-900 dark:bg-[#111315] dark:text-gray-100 transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
