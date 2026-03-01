'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getExplorerTxUrl } from '@/lib/web3/client';
import type { PayoutRun, PayoutItem } from '@/types';

export function PayoutHistory() {
  const [runs, setRuns] = useState<(PayoutRun & { items: PayoutItem[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: runsData } = await supabase
        .from('payout_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (runsData) {
        const runsWithItems = await Promise.all(
          runsData.map(async (run: PayoutRun) => {
            const { data: items } = await supabase
              .from('payout_items')
              .select('*')
              .eq('run_id', run.id)
              .order('created_at');
            return { ...run, items: items || [] };
          })
        );
        setRuns(runsWithItems);
      }
      setLoading(false);
    };
    load();
  }, []);

  const statusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
      completed: { variant: 'default', icon: CheckCircle },
      failed: { variant: 'destructive', icon: XCircle },
      executing: { variant: 'secondary', icon: Clock },
      simulated: { variant: 'outline', icon: Clock },
      pending: { variant: 'outline', icon: Clock },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        <config.icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>;
  }

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <p className="text-lg">No payout history yet</p>
        <p className="text-sm">Execute a payout from the flow editor to see results here.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-6">
        {runs.map((run) => (
          <Card key={run.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Payout Run
                </CardTitle>
                <div className="flex items-center gap-2">
                  {statusBadge(run.status)}
                  <span className="text-sm font-mono font-bold">
                    {parseFloat(run.total_amount).toFixed(2)} USDC
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(run.created_at).toLocaleString()} · {run.items_count} recipients
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {run.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                    <div className="flex items-center gap-2">
                      {item.status === 'confirmed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{item.recipient_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{parseFloat(item.amount).toFixed(2)} USDC</span>
                      {item.tx_hash && (
                        <a
                          href={getExplorerTxUrl(item.tx_hash)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:underline inline-flex items-center gap-1"
                        >
                          Tx <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
