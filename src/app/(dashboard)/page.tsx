'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/components/providers/wallet-provider';
import { createClient } from '@/lib/supabase/client';
import { Wallet, GitBranch, History, Plus, ArrowRight, Zap } from 'lucide-react';
import type { Flow, PayoutRun } from '@/types';

export default function DashboardPage() {
  const { isConnected, address, usdcBalance, ethBalance, connect, isConnecting, disconnect } = useWallet();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [recentRuns, setRecentRuns] = useState<PayoutRun[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: flowsData } = await supabase
        .from('flows')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);
      if (flowsData) setFlows(flowsData);

      const { data: runsData } = await supabase
        .from('payout_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (runsData) setRecentRuns(runsData);
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            FlowPay Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visual payout flows on Arc Testnet
          </p>
        </div>
        <Link href="/flows">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Flow
          </Button>
        </Link>
      </div>

      {/* Wallet Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Treasury Wallet
            </CardTitle>
            {isConnected && (
              <Button variant="outline" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Address</div>
                <div className="font-mono text-sm truncate">{address}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">USDC Balance</div>
                <div className="text-2xl font-bold">{parseFloat(usdcBalance).toFixed(2)} USDC</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ETH (Gas)</div>
                <div className="text-2xl font-bold">{parseFloat(ethBalance).toFixed(4)} ETH</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                Connect your wallet to see your Arc Testnet balance
              </p>
              <Button onClick={connect} disabled={isConnecting}>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Flows */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Recent Flows
              </CardTitle>
              <Link href="/flows">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {flows.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No flows yet</p>
                <Link href="/flows">
                  <Button variant="link" className="mt-2">
                    Create your first flow <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {flows.map((flow) => (
                  <Link key={flow.id} href={`/flows/${flow.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium">{flow.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(flow.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payouts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Payouts
              </CardTitle>
              <Link href="/history">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentRuns.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No payouts executed yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <div className="text-sm font-mono">{parseFloat(run.total_amount).toFixed(2)} USDC</div>
                      <div className="text-xs text-muted-foreground">
                        {run.items_count} recipients · {new Date(run.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={run.status === 'completed' ? 'default' : 'destructive'}>
                      {run.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Circle Gateway Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔄 Cross-Chain Settlement (Circle Gateway)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Use Circle Gateway to settle USDC from any chain to Arc Testnet. Arc serves as a unified liquidity hub — 
            recipients get paid on Arc regardless of where the source funds originate.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Ethereum', 'Polygon', 'Arbitrum', 'Base', 'Solana'].map((chain) => (
              <Badge key={chain} variant="outline">{chain} → Arc</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
