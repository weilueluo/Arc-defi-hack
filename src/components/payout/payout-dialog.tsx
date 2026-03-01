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
import { Loader2, CheckCircle, XCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { useWallet } from '@/components/providers/wallet-provider';
import { batchSendUsdc, getExplorerTxUrl } from '@/lib/web3/client';
import type { SimulationResult } from '@/types';
import { createClient } from '@/lib/supabase/client';

const NETWORK_LABELS: Record<string, string> = {
  arc: 'Arc Testnet',
  ethereum: 'Ethereum → Arc',
  polygon: 'Polygon → Arc',
  arbitrum: 'Arbitrum → Arc',
  base: 'Base → Arc',
  solana: 'Solana → Arc',
};

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
  network?: string;
}

export function PayoutDialog({ simulation, flowId, open, onOpenChange }: PayoutDialogProps) {
  const { provider, isConnected, address } = useWallet();
  const [statuses, setStatuses] = useState<TransferStatus[]>([]);
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);

  const hasNonArcSource = simulation.sourceChain && simulation.sourceChain !== 'arc';
  const arcItems = simulation.items.filter((item) => !item.network || item.network === 'arc');
  const gatewayItems = simulation.items.filter((item) => item.network && item.network !== 'arc');

  const handleExecute = async () => {
    if (!provider || !isConnected) return;

    setExecuting(true);
    setDone(false);

    const initial: TransferStatus[] = simulation.items.map((item) => ({
      recipientName: item.recipientName,
      recipientAddress: item.recipientAddress,
      amount: item.amount,
      status: 'pending',
      network: item.network,
    }));
    setStatuses(initial);

    const supabase = createClient();

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

    // Execute Arc-native transfers via batchSendUsdc
    let arcResults: Array<{ to: string; amount: string; status: 'confirmed' | 'failed'; txHash?: string; error?: string }> = [];
    if (arcItems.length > 0) {
      const arcTransfers = arcItems.map((item) => ({
        to: item.recipientAddress,
        amount: parseFloat(item.amount).toFixed(6),
        name: item.recipientName,
      }));

      arcResults = await batchSendUsdc(provider, arcTransfers, (index, _total, txHash) => {
        const globalIndex = simulation.items.indexOf(arcItems[index]);
        setStatuses((prev) =>
          prev.map((s, i) => {
            if (i === globalIndex) return { ...s, status: 'confirmed', txHash };
            const nextGlobalIndex = simulation.items.indexOf(arcItems[index + 1]);
            if (i === nextGlobalIndex) return { ...s, status: 'sending' };
            return s;
          })
        );
      });
    }

    // Execute gateway transfers for non-Arc recipients
    const gatewayResults: Array<{ to: string; amount: string; status: 'confirmed' | 'failed'; txHash?: string; error?: string }> = [];
    for (const item of gatewayItems) {
      const globalIndex = simulation.items.indexOf(item);
      setStatuses((prev) =>
        prev.map((s, i) => (i === globalIndex ? { ...s, status: 'sending' } : s))
      );
      try {
        const quoteRes = await fetch('/api/circle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'quote',
            sourceChain: item.network,
            destinationChain: 'arc',
            amount: item.amount,
          }),
        });
        const quoteData = await quoteRes.json();

        if (!quoteRes.ok || !quoteData.quoteId) {
          throw new Error(quoteData.error || 'Quote failed');
        }

        const transferRes = await fetch('/api/circle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'transfer', quoteId: quoteData.quoteId }),
        });
        const transferData = await transferRes.json();

        if (!transferRes.ok) {
          throw new Error(transferData.error || 'Transfer failed');
        }

        gatewayResults.push({ to: item.recipientAddress, amount: item.amount, status: 'confirmed', txHash: transferData.txHash });
        setStatuses((prev) =>
          prev.map((s, i) => (i === globalIndex ? { ...s, status: 'confirmed', txHash: transferData.txHash } : s))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gateway transfer failed';
        gatewayResults.push({ to: item.recipientAddress, amount: item.amount, status: 'failed', error: msg });
        setStatuses((prev) =>
          prev.map((s, i) => (i === globalIndex ? { ...s, status: 'failed', error: msg } : s))
        );
      }
    }

    // Merge all results in original order
    const allResults = simulation.items.map((item) => {
      const arcIdx = arcItems.indexOf(item);
      if (arcIdx !== -1) return arcResults[arcIdx];
      const gwIdx = gatewayItems.indexOf(item);
      return gatewayResults[gwIdx];
    });

    if (run) {
      const dbItems = allResults.map((r, i) => ({
        run_id: run.id,
        recipient_address: r.to,
        recipient_name: simulation.items[i].recipientName,
        amount: r.amount,
        status: r.status,
        tx_hash: r.txHash || null,
        error: r.error || null,
      }));

      await supabase.from('payout_items').insert(dbItems);

      const allConfirmed = allResults.every((r) => r.status === 'confirmed');
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

        {/* Source bridge info when source is not Arc-native */}
        {hasNonArcSource && !executing && !done && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-amber-800 dark:text-amber-200">Bridge Required</div>
              <div className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                Source funds on {NETWORK_LABELS[simulation.sourceChain!] || simulation.sourceChain} will be bridged to Arc via Circle Gateway before distribution.
              </div>
            </div>
          </div>
        )}

        {/* Gateway items info */}
        {gatewayItems.length > 0 && !executing && !done && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-sm">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {gatewayItems.length} recipient{gatewayItems.length > 1 ? 's' : ''} will receive funds via Circle Gateway cross-chain transfer.
            </div>
          </div>
        )}

        {!executing && !done && (
          <div className="space-y-4">
            <div className="space-y-2">
              {simulation.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.recipientName}</span>
                    {item.network && item.network !== 'arc' && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {NETWORK_LABELS[item.network] || item.network}
                      </Badge>
                    )}
                  </div>
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
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-medium">{s.recipientName}</div>
                      {s.network && s.network !== 'arc' && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          via {NETWORK_LABELS[s.network] || s.network}
                        </Badge>
                      )}
                    </div>
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
