'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';

function FilterNode({ data }: NodeProps) {
  const d = data as { label?: string; interval?: string; amount?: string; startDate?: string };

  const intervalLabel: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    one_time: 'One-time',
  };

  return (
    <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 px-4 py-3 shadow-md min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-yellow-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
          {d.label || 'Schedule'}
        </span>
      </div>
      <div className="text-xs space-y-1">
        <div>
          <span className="text-muted-foreground">Pay </span>
          <span className="font-mono font-semibold">{d.amount || '0'} USDC</span>
        </div>
        <div>
          <span className="text-muted-foreground">Every </span>
          <span className="font-semibold">{intervalLabel[d.interval || 'monthly'] || d.interval}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-500 !w-3 !h-3" />
    </div>
  );
}

export default memo(FilterNode);
