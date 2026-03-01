'use client';

import { WalletProvider } from '@/components/providers/wallet-provider';
import { NavigationGuardProvider } from '@/components/providers/navigation-guard-provider';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <NavigationGuardProvider>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </NavigationGuardProvider>
    </WalletProvider>
  );
}
