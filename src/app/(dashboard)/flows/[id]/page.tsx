'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Node, Edge } from '@xyflow/react';
import { FlowEditor } from '@/components/flow/flow-editor';
import { PayoutDialog } from '@/components/payout/payout-dialog';
import { useWallet } from '@/components/providers/wallet-provider';
import { useNavigationGuard } from '@/components/providers/navigation-guard-provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import type { SimulationResult, Flow } from '@/types';

export default function FlowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;
  const { address, usdcBalance } = useWallet();
  const { registerGuard, unregisterGuard, requestNavigation } = useNavigationGuard();

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [showPayout, setShowPayout] = useState(false);

  // Editable flow name (Task 1)
  const [flowName, setFlowName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Unsaved changes guard (Task 2)
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (error || !data) {
        toast.error('Flow not found');
        router.push('/flows');
        return;
      }
      setFlow(data);
      setFlowName(data.name);
      setLoading(false);
    };
    load();
  }, [flowId, router]);

  // Register/unregister navigation guard when dirty state changes
  useEffect(() => {
    if (isDirty) {
      registerGuard(() => isDirty);
    } else {
      unregisterGuard();
    }
  }, [isDirty, registerGuard, unregisterGuard]);

  // Browser reload/close guard
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Browser back/forward guard
  useEffect(() => {
    if (!isDirty) return;
    const currentUrl = window.location.href;
    const handler = () => {
      window.history.pushState(null, '', currentUrl);
      requestNavigation(currentUrl);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [isDirty, requestNavigation]);

  // Cleanup guard on unmount
  useEffect(() => {
    return () => unregisterGuard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNameSave = useCallback(async () => {
    setEditingName(false);
    const trimmed = flowName.trim();
    if (!trimmed || trimmed === flow?.name) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('flows')
      .update({ name: trimmed })
      .eq('id', flowId);

    if (error) {
      toast.error('Failed to save name');
    } else {
      setFlow((prev) => (prev ? { ...prev, name: trimmed } : prev));
      toast.success('Name saved');
    }
  }, [flowName, flow?.name, flowId]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleNameSave();
      if (e.key === 'Escape') {
        setFlowName(flow?.name || '');
        setEditingName(false);
      }
    },
    [handleNameSave, flow?.name]
  );

  const handleSave = useCallback(
    async (nodes: Node[], edges: Edge[]) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('flows')
        .update({
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
          })),
        })
        .eq('id', flowId);

      if (error) {
        toast.error('Failed to save flow');
      } else {
        toast.success('Flow saved');
      }
    },
    [flowId]
  );

  const handleExecute = useCallback((sim: SimulationResult) => {
    setSimulation(sim);
    setShowPayout(true);
  }, []);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  if (loading || !flow) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading flow...</div>;
  }

  const initialNodes: Node[] = (flow.nodes || []).map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }));

  const initialEdges: Edge[] = (flow.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: '#6366f1' },
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Inline editable flow name header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-card shrink-0">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
            className="text-lg font-semibold bg-transparent border-b border-primary outline-none px-1 min-w-[200px]"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex items-center gap-1.5 group text-lg font-semibold hover:text-primary transition-colors"
          >
            <span>{flowName}</span>
            <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
        )}
        {isDirty && (
          <span className="text-xs text-muted-foreground ml-2">Unsaved changes</span>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <FlowEditor
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          walletAddress={address || undefined}
          usdcBalance={usdcBalance}
          onSave={handleSave}
          onExecute={handleExecute}
          onDirtyChange={setIsDirty}
        />
      </div>

      {simulation && (
        <PayoutDialog
          simulation={simulation}
          flowId={flowId}
          open={showPayout}
          onOpenChange={setShowPayout}
        />
      )}
    </div>
  );
}
