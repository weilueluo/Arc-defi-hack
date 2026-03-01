import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/flows — List all flows
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('flows')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/flows — Create a new flow
export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('flows')
    .insert({
      org_id: body.org_id || '00000000-0000-0000-0000-000000000001',
      name: body.name || 'Untitled Flow',
      description: body.description,
      nodes: body.nodes || [],
      edges: body.edges || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
