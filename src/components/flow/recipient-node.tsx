'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';

const NETWORK_LABELS: Record<string, string> = {
  arc: 'Arc Testnet',
  ethereum: 'Ethereum → Arc',
  polygon: 'Polygon → Arc',
  arbitrum: 'Arbitrum → Arc',
  base: 'Base → Arc',
  solana: 'Solana → Arc',
};

function RecipientNode({ data }: NodeProps) {
  const d = data as { label?: string; name?: string; address?: string; network?: string };

  return (
    <div className="rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-950 px-4 py-3 shadow-md min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
          {d.label || 'Recipient'}
        </span>
      </div>
      <div className="text-sm font-medium">{d.name || 'Unknown'}</div>
      {d.address && (
        <div className="text-[10px] font-mono text-muted-foreground mt-1 truncate max-w-[160px]">
          {d.address}
        </div>
      )}
      {d.network && d.network !== 'arc' && (
        <div className="text-[10px] text-purple-600 mt-1">
          {NETWORK_LABELS[d.network] || d.network}
        </div>
      )}
    </div>
  );
}

export default memo(RecipientNode);
