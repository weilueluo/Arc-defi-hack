// Flow Simulation Engine
// Traverses a React Flow graph and computes payout amounts per recipient

import type { FlowNodeData, FlowEdgeData, SimulationResult, SimulationItem } from '@/types';

interface NodeMap {
  [id: string]: FlowNodeData;
}

interface AdjacencyList {
  [sourceId: string]: string[]; // source -> [target ids]
}

export function simulateFlow(
  nodes: FlowNodeData[],
  edges: FlowEdgeData[],
): SimulationResult {
  const nodeMap: NodeMap = {};
  nodes.forEach((n) => (nodeMap[n.id] = n));

  // Build adjacency list
  const adj: AdjacencyList = {};
  edges.forEach((e) => {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
  });

  // Find source nodes
  const sourceNodes = nodes.filter((n) => n.type === 'source');
  if (sourceNodes.length === 0) {
    return { items: [], totalAmount: '0', sourceAddress: '' };
  }

  const items: SimulationItem[] = [];
  let totalAmount = 0;
  const sourceAddress = (sourceNodes[0].data as { address?: string }).address || '';

  // BFS/DFS from each source node
  for (const source of sourceNodes) {
    const sourceAmount = parseFloat((source.data as { amount?: string }).amount || '0');
    if (sourceAmount <= 0) continue;

    // Traverse graph: (nodeId, amountFlowing, path)
    const queue: Array<{ nodeId: string; amount: number; path: string[] }> = [
      { nodeId: source.id, amount: sourceAmount, path: [source.id] },
    ];

    while (queue.length > 0) {
      const { nodeId, amount, path } = queue.shift()!;
      const node = nodeMap[nodeId];
      if (!node) continue;

      const children = adj[nodeId] || [];

      if (node.type === 'recipient') {
        // Terminal node: record payout
        const data = node.data as { name?: string; address?: string };
        items.push({
          recipientAddress: data.address || '',
          recipientName: data.name || 'Unknown',
          amount: amount.toFixed(6),
          nodePath: path,
        });
        totalAmount += amount;
      } else if (node.type === 'split') {
        // Split node: distribute amount by percentages
        const data = node.data as { splits?: Array<{ percentage: number }> };
        const splits = data.splits || [];

        // Map splits to children by index
        for (let i = 0; i < Math.min(splits.length, children.length); i++) {
          const splitAmount = (amount * splits[i].percentage) / 100;
          queue.push({
            nodeId: children[i],
            amount: splitAmount,
            path: [...path, children[i]],
          });
        }
      } else if (node.type === 'filter') {
        // Schedule node: overrides the flowing amount with its configured amount
        const data = node.data as { interval?: string; amount?: string };
        const scheduleAmount = parseFloat(data.amount || '0');
        const flowAmount = scheduleAmount > 0 ? scheduleAmount : amount;

        for (const childId of children) {
          queue.push({
            nodeId: childId,
            amount: flowAmount,
            path: [...path, childId],
          });
        }
      } else {
        // Source or unknown: pass through to children
        for (const childId of children) {
          queue.push({
            nodeId: childId,
            amount,
            path: [...path, childId],
          });
        }
      }
    }
  }

  return {
    items,
    totalAmount: totalAmount.toFixed(6),
    sourceAddress,
  };
}
