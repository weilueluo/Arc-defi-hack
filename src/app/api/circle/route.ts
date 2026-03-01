import { NextRequest, NextResponse } from 'next/server';
import { getGatewayQuote, executeGatewayTransfer, getSupportedChains, isCircleConfigured } from '@/lib/circle/gateway';

// GET /api/circle — Get Circle integration status
export async function GET() {
  return NextResponse.json({
    configured: isCircleConfigured(),
    supportedChains: getSupportedChains(),
    note: isCircleConfigured()
      ? 'Circle Gateway is configured and ready.'
      : 'Circle API key not set. Using mock responses for demo.',
  });
}

// POST /api/circle — Get a gateway quote or execute transfer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'quote') {
      const { sourceChain, destinationChain, amount } = body;
      const quote = await getGatewayQuote(
        sourceChain || 'ethereum',
        destinationChain || 'arc',
        amount || '100'
      );
      return NextResponse.json(quote);
    }

    if (action === 'transfer') {
      const { quoteId } = body;
      const result = await executeGatewayTransfer(quoteId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Circle API error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
