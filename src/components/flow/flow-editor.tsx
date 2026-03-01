'use client';

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  Node,
  Edge,
  Panel,
  NodeMouseHandler,
  EdgeMouseHandler,
  OnSelectionChangeParams,
  MarkerType,
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
import { Save, Zap, Undo2, Redo2 } from 'lucide-react';
import type { FlowNodeData, FlowEdgeData, SimulationResult } from '@/types';
import { simulateFlow } from '@/lib/engine/simulate';

const nodeTypes = {
  source: SourceNode,
  split: SplitNode,
  filter: FilterNode,
  recipient: RecipientNode,
};

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#6366f1', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
};

interface FlowEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onExecute?: (simulation: SimulationResult) => void;
}

function FlowEditorInner({ initialNodes = [], initialEdges = [], onSave, onExecute }: FlowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Undo/redo history
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);

  // Save snapshot for undo
  const saveSnapshot = useCallback(() => {
    if (isUndoRedo.current) return;
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, { nodes: [...nodes], edges: [...edges] }].slice(-30);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [nodes, edges, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    isUndoRedo.current = true;
    const prev = history[historyIndex - 1];
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setHistoryIndex((i) => i - 1);
    setSelectedNode(null);
    setTimeout(() => { isUndoRedo.current = false; }, 0);
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    isUndoRedo.current = true;
    const next = history[historyIndex + 1];
    setNodes(next.nodes);
    setEdges(next.edges);
    setHistoryIndex((i) => i + 1);
    setSelectedNode(null);
    setTimeout(() => { isUndoRedo.current = false; }, 0);
  }, [history, historyIndex, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace to remove selected nodes or edges
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if focus is on an input
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

        if (selectedNode) {
          saveSnapshot();
          setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
          setEdges((eds) => eds.filter((ed) => ed.source !== selectedNode.id && ed.target !== selectedNode.id));
          setSelectedNode(null);
        }
        if (selectedEdgeId) {
          saveSnapshot();
          setEdges((eds) => eds.filter((ed) => ed.id !== selectedEdgeId));
          setSelectedEdgeId(null);
        }
      }

      // Ctrl+Z / Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Ctrl+S / Cmd+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdgeId, saveSnapshot, undo, redo, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode(node);
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdgeId(null);
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
      saveSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges, saveSnapshot]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      saveSnapshot();
      setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
    },
    [setEdges, saveSnapshot]
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

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const id = `${type}-${Date.now()}`;

      const defaults: Record<string, Record<string, unknown>> = {
        source: { label: 'Treasury', amount: '1000', address: '' },
        split: { label: 'Split', splits: [{ percentage: 50, label: 'A' }, { percentage: 50, label: 'B' }] },
        filter: { label: 'Schedule', interval: 'monthly', amount: '100' },
        recipient: { label: 'Recipient', name: 'New Recipient', address: '' },
      };

      const newNode: Node = {
        id,
        type,
        position,
        data: defaults[type] || { label: type },
      };

      saveSnapshot();
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, screenToFlowPosition, saveSnapshot]
  );

  // Track selection changes for multi-select delete
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: OnSelectionChangeParams) => {
    if (selectedNodes.length === 1) {
      setSelectedNode(selectedNodes[0]);
    } else if (selectedNodes.length === 0) {
      // Don't clear if we're in the property panel
    }
  }, []);

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      saveSnapshot();
      setSelectedNode(null);
      // Also remove connected edges
      const deletedIds = new Set(deleted.map((n) => n.id));
      setEdges((eds) => eds.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
    },
    [setEdges, saveSnapshot]
  );

  const onEdgesDelete = useCallback(() => {
    saveSnapshot();
    setSelectedEdgeId(null);
  }, [saveSnapshot]);

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
    // Compute payout amounts from the graph
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
    if (result.items.length > 0 && onExecute) {
      onExecute(result);
    }
  }, [nodes, edges, onExecute]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className="flex h-full">
      <NodePalette />
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          proOptions={proOptions}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode="Shift"
          selectionOnDrag
          selectNodesOnDrag={false}
          fitView
          className="bg-background"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            className="!bg-muted/50"
          />
          <Panel position="top-right" className="flex gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Shift+Z)">
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} title="Save (Ctrl+S)">
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" onClick={handleExecute} className="bg-green-600 hover:bg-green-700">
              <Zap className="h-4 w-4 mr-1" />
              Execute Payout
            </Button>
          </Panel>
          <Panel position="bottom-left" className="text-[10px] text-muted-foreground space-y-0.5">
            <div>Drag nodes from palette • Click node to edit • Delete/Backspace to remove</div>
            <div>Shift+drag to multi-select • Ctrl+Z undo • Ctrl+S save</div>
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

export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
