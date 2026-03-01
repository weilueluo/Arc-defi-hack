'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Plus, GitBranch, ArrowRight, Trash2 } from 'lucide-react';
import type { Flow } from '@/types';

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadFlows = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('flows')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setFlows(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFlows();
  }, []);

  const createFlow = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('flows')
      .insert({
        org_id: '00000000-0000-0000-0000-000000000001',
        name: 'New Payout Flow',
        nodes: [
          {
            id: 'source-1',
            type: 'source',
            position: { x: 250, y: 0 },
            data: { label: 'Treasury', amount: '1000', address: '', network: 'arc' },
          },
        ],
        edges: [],
      })
      .select()
      .single();

    if (data) {
      router.push(`/flows/${data.id}`);
    }
  };

  const deleteFlow = async (id: string) => {
    const supabase = createClient();
    await supabase.from('flows').delete().eq('id', id);
    setFlows((prev) => prev.filter((f) => f.id !== id));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payout Flows</h1>
          <p className="text-muted-foreground">Design and manage your payout flows</p>
        </div>
        <Button onClick={createFlow}>
          <Plus className="h-4 w-4 mr-2" />
          New Flow
        </Button>
      </div>

      {flows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flows yet</h3>
            <p className="text-muted-foreground mb-4">Create your first payout flow to get started.</p>
            <Button onClick={createFlow}>
              <Plus className="h-4 w-4 mr-2" />
              Create Flow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow) => (
            <Card key={flow.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{flow.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      deleteFlow(flow.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {flow.nodes?.length || 0} nodes · {flow.edges?.length || 0} connections
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  Updated {new Date(flow.updated_at).toLocaleDateString()}
                </div>
                <Link href={`/flows/${flow.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Open Editor <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
