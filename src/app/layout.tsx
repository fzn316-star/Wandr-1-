import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import DeepDiveModal from '@/components/modals/DeepDiveModal';
import SideBySideComparisonModal from '@/components/modals/SideBySideComparisonModal';

export const metadata: Metadata = {
  title: 'Wandr — Discover Where You Didn\'t Know You Wanted to Go',
  description: 'AI-native travel discovery platform that starts with how you feel. Transparent, grounded recommendations from inspiration to conviction.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 relative bg-slate-950">
        {/* Lively Destination Background Photo & Translucent Overlay (z-0) */}
        <div className="travel-bg-layer">
          <div className="travel-bg-overlay" />
        </div>

        {/* Content Stack above background (z-10) */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navigation Bar */}
          <Navbar />

          {/* Main Content View */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>

        {/* Global Overlays & Modals */}
        <DeepDiveModal />
        <SideBySideComparisonModal />
      </body>
    </html>
  );
}
