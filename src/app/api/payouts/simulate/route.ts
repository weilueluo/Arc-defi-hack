import { NextRequest, NextResponse } from 'next/server';
import { simulateFlow } from '@/lib/engine/simulate';

// POST /api/payouts/simulate — Simulate a payout flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodes, edges } = body;

    if (!nodes || !edges) {
      return NextResponse.json(
        { error: 'Missing nodes or edges' },
        { status: 400 }
      );
    }

    const result = simulateFlow(nodes, edges);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Simulation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
