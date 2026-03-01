'use client';

import { Wallet, Split, Filter, User } from 'lucide-react';

const nodeTypes = [
  {
    type: 'source',
    label: 'Treasury Source',
    icon: Wallet,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-300',
    description: 'Starting point with USDC amount',
  },
  {
    type: 'split',
    label: 'Split',
    icon: Split,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-300',
    description: 'Split funds by percentage',
  },
  {
    type: 'filter',
    label: 'Policy Filter',
    icon: Filter,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-300',
    description: 'Apply rules to payouts',
  },
  {
    type: 'recipient',
    label: 'Recipient',
    icon: User,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-300',
    description: 'Wallet address to receive funds',
  },
];

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-56 border-r bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Node Palette
      </h3>
      <p className="text-xs text-muted-foreground">
        Drag nodes onto the canvas to build your payout flow.
      </p>
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className={`flex items-center gap-3 rounded-lg border ${node.border} ${node.bg} p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow`}
          >
            <node.icon className={`h-5 w-5 ${node.color}`} />
            <div>
              <div className="text-sm font-medium">{node.label}</div>
              <div className="text-[10px] text-muted-foreground">{node.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
