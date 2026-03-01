'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useWallet } from '@/components/providers/wallet-provider';
import { batchSendUsdc, getExplorerTxUrl } from '@/lib/web3/client';
import type { SimulationResult } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface PayoutDialogProps {
  simulation: SimulationResult;
  flowId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TransferStatus {
  recipientName: string;
  recipientAddress: string;
  amount: string;
  status: 'pending' | 'sending' | 'confirmed' | 'failed';
  txHash?: string;
  error?: string;
}

export function PayoutDialog({ simulation, flowId, open, onOpenChange }: PayoutDialogProps) {
  const { provider, isConnected, address } = useWallet();
  const [statuses, setStatuses] = useState<TransferStatus[]>([]);
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExecute = async () => {
    if (!provider || !isConnected) return;

    setExecuting(true);
    setDone(false);

    // Initialize statuses
    const initial: TransferStatus[] = simulation.items.map((item) => ({
      recipientName: item.recipientName,
      recipientAddress: item.recipientAddress,
      amount: item.amount,
      status: 'pending',
    }));
    setStatuses(initial);

    const supabase = createClient();

    // Create payout run in DB
    const { data: run } = await supabase
      .from('payout_runs')
      .insert({
        flow_id: flowId || null,
        org_id: '00000000-0000-0000-0000-000000000001',
        status: 'executing',
        total_amount: simulation.totalAmount,
        source_address: address || '',
        items_count: simulation.items.length,
      })
      .select()
      .single();

    const transfers = simulation.items.map((item) => ({
      to: item.recipientAddress,
      amount: parseFloat(item.amount).toFixed(6),
      name: item.recipientName,
    }));

    // Execute transfers
    const results = await batchSendUsdc(provider, transfers, (index, total, txHash) => {
      setStatuses((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, status: 'confirmed', txHash } : i === index + 1 ? { ...s, status: 'sending' } : s
        )
      );
    });

    // Update statuses from results
    setStatuses(
      results.map((r, i) => ({
        recipientName: simulation.items[i].recipientName,
        recipientAddress: r.to,
        amount: r.amount,
        status: r.status,
        txHash: r.txHash || undefined,
        error: r.error,
      }))
    );

    // Save payout items to DB
    if (run) {
      const items = results.map((r, i) => ({
        run_id: run.id,
        recipient_address: r.to,
        recipient_name: simulation.items[i].recipientName,
        amount: r.amount,
        status: r.status,
        tx_hash: r.txHash || null,
        error: r.error || null,
      }));

      await supabase.from('payout_items').insert(items);

      const allConfirmed = results.every((r) => r.status === 'confirmed');
      await supabase
        .from('payout_runs')
        .update({
          status: allConfirmed ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    setExecuting(false);
    setDone(true);
  };

  const statusIcon = (status: TransferStatus['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full bg-muted" />;
      case 'sending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Execute Payout</DialogTitle>
          <DialogDescription>
            Send {parseFloat(simulation.totalAmount).toFixed(2)} USDC to {simulation.items.length} recipients on Arc Testnet.
          </DialogDescription>
        </DialogHeader>

        {!executing && !done && (
          <div className="space-y-4">
            <div className="space-y-2">
              {simulation.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">{item.recipientName}</span>
                  <span className="text-sm font-mono font-bold">{parseFloat(item.amount).toFixed(2)} USDC</span>
                </div>
              ))}
            </div>
            <Button onClick={handleExecute} disabled={!isConnected} className="w-full">
              {isConnected ? 'Confirm & Execute' : 'Connect Wallet First'}
            </Button>
          </div>
        )}

        {(executing || done) && (
          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              {statuses.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                  {statusIcon(s.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{s.recipientName}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {s.recipientAddress}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono">{parseFloat(s.amount).toFixed(2)}</div>
                    {s.txHash && (
                      <a
                        href={getExplorerTxUrl(s.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-500 hover:underline inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {s.error && <div className="text-[10px] text-red-500">{s.error}</div>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {done && (
          <div className="text-center py-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              Payout Complete
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
