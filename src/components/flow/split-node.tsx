'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Split } from 'lucide-react';

function SplitNode({ data }: NodeProps) {
  const d = data as { label?: string; splits?: Array<{ percentage: number; label: string }> };
  const splits = d.splits || [{ percentage: 50, label: 'A' }, { percentage: 50, label: 'B' }];

  return (
    <div className="rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 px-4 py-3 shadow-md min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <Split className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          {d.label || 'Split'}
        </span>
      </div>
      <div className="space-y-1">
        {splits.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span>{s.label}</span>
            <span className="font-mono font-semibold">{s.percentage}%</span>
          </div>
        ))}
      </div>
      {splits.map((_, i) => (
        <Handle
          key={i}
          type="source"
          position={Position.Bottom}
          id={`split-${i}`}
          className="!bg-blue-500 !w-3 !h-3"
          style={{ left: `${((i + 1) / (splits.length + 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default memo(SplitNode);
