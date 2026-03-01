'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  Edge,
  Panel,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SourceNode from './source-node';
import SplitNode from './split-node';
import FilterNode from './filter-node';
import RecipientNode from './recipient-node';
import { NodePalette } from './node-palette';
import { PropertyPanel } from './property-panel';
import { SimulationPanel } from './simulation-panel';
import { Button } from '@/components/ui/button';
import { Save, Play, Zap } from 'lucide-react';
import type { FlowNodeData, FlowEdgeData, SimulationResult } from '@/types';
import { simulateFlow } from '@/lib/engine/simulate';

const nodeTypes = {
  source: SourceNode,
  split: SplitNode,
  filter: FilterNode,
  recipient: RecipientNode,
};

interface FlowEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onExecute?: (simulation: SimulationResult) => void;
}

export function FlowEditor({ initialNodes = [], initialEdges = [], onSave, onExecute }: FlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data } : n))
      );
      setSelectedNode((prev) => (prev && prev.id === nodeId ? { ...prev, data } : prev));
    },
    [setNodes]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = { x: event.clientX - 250, y: event.clientY - 50 };
      const id = `${type}-${Date.now()}`;

      const defaults: Record<string, Record<string, unknown>> = {
        source: { label: 'Treasury', amount: '1000', address: '' },
        split: { label: 'Split', splits: [{ percentage: 50, label: 'A' }, { percentage: 50, label: 'B' }] },
        filter: { label: 'Policy Filter', condition: 'min_amount', value: '10' },
        recipient: { label: 'Recipient', name: 'New Recipient', address: '' },
      };

      const newNode: Node = {
        id,
        type,
        position,
        data: defaults[type] || { label: type },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const handleSimulate = useCallback(() => {
    const flowNodes: FlowNodeData[] = nodes.map((n) => ({
      id: n.id,
      type: n.type as FlowNodeData['type'],
      position: n.position,
      data: n.data as Record<string, unknown>,
    }));
    const flowEdges: FlowEdgeData[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }));
    const result = simulateFlow(flowNodes, flowEdges);
    setSimulation(result);
  }, [nodes, edges]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(nodes, edges);
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, onSave]);

  const handleExecute = useCallback(() => {
    if (simulation && onExecute) {
      onExecute(simulation);
    }
  }, [simulation, onExecute]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className="flex h-full">
      <NodePalette />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          fitView
          className="bg-background"
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right" className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSimulate}>
              <Play className="h-4 w-4 mr-1" />
              Simulate
            </Button>
            {simulation && simulation.items.length > 0 && (
              <Button size="sm" onClick={handleExecute} className="bg-green-600 hover:bg-green-700">
                <Zap className="h-4 w-4 mr-1" />
                Execute Payout
              </Button>
            )}
          </Panel>
        </ReactFlow>
        {simulation && <SimulationPanel simulation={simulation} onClose={() => setSimulation(null)} />}
      </div>
      {selectedNode && (
        <PropertyPanel
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
