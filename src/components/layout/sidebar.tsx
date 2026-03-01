'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, GitBranch, History, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/components/providers/wallet-provider';
import { useNavigationGuard } from '@/components/providers/navigation-guard-provider';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/flows', label: 'Flows', icon: GitBranch },
  { href: '/history', label: 'History', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const { address, usdcBalance, isConnected, isConnecting, connect } = useWallet();
  const { requestNavigation } = useNavigationGuard();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold">FlowPay</span>
        <Badge variant="secondary" className="text-[10px]">Arc Testnet</Badge>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => requestNavigation(item.href)}
              className="w-full"
            >
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-2', isActive && 'font-semibold')}
                asChild={false}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </button>
          );
        })}
      </nav>

      {/* Wallet */}
      <div className="border-t p-4 space-y-2">
        {isConnected ? (
          <>
            <div className="text-sm text-muted-foreground">Wallet</div>
            <div className="font-mono text-xs truncate">{address}</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {parseFloat(usdcBalance).toFixed(2)} USDC
              </Badge>
            </div>
          </>
        ) : (
          <Button onClick={connect} disabled={isConnecting} className="w-full">
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        )}
      </div>
    </div>
  );
}
