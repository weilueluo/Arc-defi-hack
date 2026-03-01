// Circle integration helpers
// Provides Gateway flow for cross-chain USDC + fallback stub

const CIRCLE_API_BASE = 'https://api.circle.com/v1';

interface CircleGatewayQuote {
  id: string;
  sourceChain: string;
  destinationChain: string;
  sourceAmount: string;
  destinationAmount: string;
  fee: string;
}

// Check if Circle API key is configured
export function isCircleConfigured(): boolean {
  return !!process.env.CIRCLE_API_KEY;
}

// Get a cross-chain transfer quote via Circle Gateway
export async function getGatewayQuote(
  sourceChain: string,
  destinationChain: string,
  amount: string
): Promise<CircleGatewayQuote> {
  if (!isCircleConfigured()) {
    // Return mock quote for demo
    return {
      id: `mock-quote-${Date.now()}`,
      sourceChain,
      destinationChain,
      sourceAmount: amount,
      destinationAmount: amount, // 1:1 for USDC
      fee: '0.01',
    };
  }

  const res = await fetch(`${CIRCLE_API_BASE}/w3s/crosschain/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
    },
    body: JSON.stringify({
      sourceChain,
      destinationChain,
      amount,
      currency: 'USDC',
    }),
  });

  if (!res.ok) {
    throw new Error(`Circle Gateway API error: ${res.status}`);
  }

  return res.json();
}

// Execute a cross-chain transfer via Circle Gateway
export async function executeGatewayTransfer(quoteId: string) {
  if (!isCircleConfigured()) {
    // Mock execution for demo
    return {
      id: `mock-transfer-${Date.now()}`,
      status: 'completed',
      txHash: `0x${'0'.repeat(64)}`,
    };
  }

  const res = await fetch(`${CIRCLE_API_BASE}/w3s/crosschain/transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
    },
    body: JSON.stringify({ quoteId }),
  });

  if (!res.ok) {
    throw new Error(`Circle Gateway API error: ${res.status}`);
  }

  return res.json();
}

// Get supported chains for Circle Gateway
export function getSupportedChains() {
  return [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
    { id: 'arc', name: 'Arc Testnet', symbol: 'ARC' },
    { id: 'base', name: 'Base', symbol: 'BASE' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
  ];
}
