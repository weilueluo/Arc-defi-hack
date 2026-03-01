import { NextRequest, NextResponse } from 'next/server';
import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';
import { ARC_TESTNET, ARC_USDC, ERC20_ABI } from '@/lib/web3/config';
import { createServerClient } from '@/lib/supabase/server';

// POST /api/payouts/execute — Execute payout server-side (optional: for agent-driven payouts)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, flowId } = body;
    // items: Array<{ recipientAddress, recipientName, amount }>

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No payout items provided' }, { status: 400 });
    }

    const privateKey = process.env.PAYOUT_EXECUTOR_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Server payout executor not configured. Use client-side execution.' },
        { status: 501 }
      );
    }

    const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const contract = new Contract(ARC_USDC.address, ERC20_ABI, wallet);

    const supabase = createServerClient();

    // Calculate total
    const totalAmount = items.reduce(
      (sum: number, item: { amount: string }) => sum + parseFloat(item.amount),
      0
    );

    // Create payout run
    const { data: run } = await supabase
      .from('payout_runs')
      .insert({
        flow_id: flowId || null,
        org_id: '00000000-0000-0000-0000-000000000001',
        status: 'executing',
        total_amount: totalAmount.toFixed(6),
        source_address: wallet.address,
        items_count: items.length,
      })
      .select()
      .single();

    const results = [];

    for (const item of items) {
      try {
        const parsedAmount = parseUnits(
          parseFloat(item.amount).toFixed(6),
          ARC_USDC.decimals
        );
        const tx = await contract.transfer(item.recipientAddress, parsedAmount);
        const receipt = await tx.wait();

        results.push({
          recipientAddress: item.recipientAddress,
          recipientName: item.recipientName,
          amount: item.amount,
          status: 'confirmed',
          txHash: receipt.hash,
        });

        // Save to DB
        if (run) {
          await supabase.from('payout_items').insert({
            run_id: run.id,
            recipient_address: item.recipientAddress,
            recipient_name: item.recipientName,
            amount: item.amount,
            status: 'confirmed',
            tx_hash: receipt.hash,
          });
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Transfer failed';
        results.push({
          recipientAddress: item.recipientAddress,
          recipientName: item.recipientName,
          amount: item.amount,
          status: 'failed',
          error: errMsg,
        });

        if (run) {
          await supabase.from('payout_items').insert({
            run_id: run.id,
            recipient_address: item.recipientAddress,
            recipient_name: item.recipientName,
            amount: item.amount,
            status: 'failed',
            error: errMsg,
          });
        }
      }
    }

    // Update run status
    const allConfirmed = results.every((r) => r.status === 'confirmed');
    if (run) {
      await supabase
        .from('payout_runs')
        .update({
          status: allConfirmed ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    return NextResponse.json({
      runId: run?.id,
      status: allConfirmed ? 'completed' : 'partial_failure',
      results,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Execution failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
