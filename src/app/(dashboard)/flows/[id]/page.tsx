'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Node, Edge } from '@xyflow/react';
import { FlowEditor } from '@/components/flow/flow-editor';
import { PayoutDialog } from '@/components/payout/payout-dialog';
import { useWallet } from '@/components/providers/wallet-provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { SimulationResult, Flow } from '@/types';

export default function FlowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;
  const { address, usdcBalance } = useWallet();

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [showPayout, setShowPayout] = useState(false);

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
      setLoading(false);
    };
    load();
  }, [flowId, router]);

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

  if (loading || !flow) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading flow...</div>;
  }

  // Convert stored flow data to React Flow format
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
    <div className="h-full">
      <FlowEditor
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        walletAddress={address || undefined}
        usdcBalance={usdcBalance}
        onSave={handleSave}
        onExecute={handleExecute}
      />
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
