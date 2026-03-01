'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Wallet } from 'lucide-react';

const NETWORK_LABELS: Record<string, string> = {
  arc: 'Arc Testnet',
  ethereum: 'Ethereum → Arc',
  polygon: 'Polygon → Arc',
  arbitrum: 'Arbitrum → Arc',
  base: 'Base → Arc',
  solana: 'Solana → Arc',
};

function SourceNode({ data }: NodeProps) {
  const d = data as { label?: string; amount?: string; address?: string; network?: string };
  return (
    <div className="rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 px-4 py-3 shadow-md min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="h-4 w-4 text-green-600" />
        <span className="text-sm font-semibold text-green-700 dark:text-green-300">
          {d.label || 'Treasury'}
        </span>
      </div>
      <div className="text-lg font-bold">{d.amount || '0'} USDC</div>
      {d.address && (
        <div className="text-[10px] font-mono text-muted-foreground mt-1 truncate max-w-[160px]">
          {d.address}
        </div>
      )}
      {d.network && d.network !== 'arc' && (
        <div className="text-[10px] text-green-600 mt-1">
          {NETWORK_LABELS[d.network] || d.network}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3" />
    </div>
  );
}

export default memo(SourceNode);
