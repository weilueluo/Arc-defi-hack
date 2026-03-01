'use client';

import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2 } from 'lucide-react';

const NETWORK_OPTIONS = [
  { value: 'arc', label: 'Arc Testnet' },
  { value: 'ethereum', label: 'Ethereum → Arc' },
  { value: 'polygon', label: 'Polygon → Arc' },
  { value: 'arbitrum', label: 'Arbitrum → Arc' },
  { value: 'base', label: 'Base → Arc' },
  { value: 'solana', label: 'Solana → Arc' },
];

interface PropertyPanelProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export function PropertyPanel({ node, onUpdate, onDelete, onClose }: PropertyPanelProps) {
  const data = node.data as Record<string, unknown>;

  const updateField = useCallback(
    (field: string, value: unknown) => {
      onUpdate(node.id, { ...data, [field]: value });
    },
    [node.id, data, onUpdate]
  );

  const updateSplit = useCallback(
    (index: number, field: string, value: unknown) => {
      const splits = [...((data.splits as Array<{ percentage: number; label: string }>) || [])];
      splits[index] = { ...splits[index], [field]: value };
      onUpdate(node.id, { ...data, splits });
    },
    [node.id, data, onUpdate]
  );

  const addSplit = useCallback(() => {
    const splits = [...((data.splits as Array<{ percentage: number; label: string }>) || [])];
    splits.push({ percentage: 0, label: `Split ${splits.length + 1}` });
    onUpdate(node.id, { ...data, splits });
  }, [node.id, data, onUpdate]);

  const removeSplit = useCallback(
    (index: number) => {
      const splits = [...((data.splits as Array<{ percentage: number; label: string }>) || [])];
      splits.splice(index, 1);
      onUpdate(node.id, { ...data, splits });
    },
    [node.id, data, onUpdate]
  );

  return (
    <div className="w-72 border-l bg-card p-4 space-y-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Common: Label */}
      <div className="space-y-1">
        <Label className="text-xs">Label</Label>
        <Input
          value={(data.label as string) || ''}
          onChange={(e) => updateField('label', e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Source node fields */}
      {node.type === 'source' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Amount (USDC)</Label>
            <Input
              type="number"
              value={(data.amount as string) || ''}
              onChange={(e) => updateField('amount', e.target.value)}
              placeholder="1000"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Wallet Address</Label>
            <Input
              value={(data.address as string) || ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="0x..."
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Source Network</Label>
            <Select
              value={(data.network as string) || 'arc'}
              onValueChange={(v) => updateField('network', v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORK_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Split node fields */}
      {node.type === 'split' && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Splits</Label>
            {((data.splits as Array<{ percentage: number; label: string }>) || []).map(
              (split, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={split.label}
                    onChange={(e) => updateSplit(i, 'label', e.target.value)}
                    placeholder="Label"
                    className="h-8 text-sm flex-1"
                  />
                  <Input
                    type="number"
                    value={split.percentage}
                    onChange={(e) => updateSplit(i, 'percentage', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm w-16"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSplit(i)}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            )}
            <Button variant="outline" size="sm" onClick={addSplit} className="w-full text-xs">
              + Add Split
            </Button>
          </div>
        </>
      )}

      {/* Schedule/Policy node fields */}
      {node.type === 'filter' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Pay Interval</Label>
            <Select
              value={(data.interval as string) || 'monthly'}
              onValueChange={(v) => updateField('interval', v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One-time</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Amount (USDC)</Label>
            <Input
              type="number"
              value={(data.amount as string) || ''}
              onChange={(e) => updateField('amount', e.target.value)}
              placeholder="100"
              className="h-8 text-sm"
            />
          </div>
        </>
      )}

      {/* Recipient node fields */}
      {node.type === 'recipient' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Recipient Name</Label>
            <Input
              value={(data.name as string) || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Alice"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Wallet Address</Label>
            <Input
              value={(data.address as string) || ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="0x..."
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Destination Network</Label>
            <Select
              value={(data.network as string) || 'arc'}
              onValueChange={(v) => updateField('network', v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORK_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Delete button */}
      <div className="pt-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(node.id)}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}
