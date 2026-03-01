'use client';

import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SimulationResult } from '@/types';

interface SimulationPanelProps {
  simulation: SimulationResult;
  onClose: () => void;
}

export function SimulationPanel({ simulation, onClose }: SimulationPanelProps) {
  return (
    <Card className="absolute bottom-4 right-4 w-96 max-h-80 shadow-xl z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Simulation Results</h3>
          <Badge variant="secondary">{simulation.items.length} recipients</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="max-h-52">
        <div className="p-4 space-y-3">
          {simulation.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div>
                <div className="text-sm font-medium">{item.recipientName}</div>
                <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                  {item.recipientAddress}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{parseFloat(item.amount).toFixed(2)} USDC</div>
                {item.percentage && (
                  <div className="text-[10px] text-muted-foreground">{item.percentage}%</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <div>
          <div className="text-xs text-muted-foreground">Total Payout</div>
          <div className="text-lg font-bold">{parseFloat(simulation.totalAmount).toFixed(2)} USDC</div>
        </div>
      </div>
    </Card>
  );
}
