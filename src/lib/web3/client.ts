'use client';

import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { ARC_TESTNET, ARC_TESTNET_CHAIN_CONFIG, ARC_USDC, ERC20_ABI } from './config';

// Connect to Arc Testnet via browser wallet (MetaMask)
export async function connectWallet(): Promise<{ address: string; provider: BrowserProvider }> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask.');
  }

  const provider = new BrowserProvider(window.ethereum);

  // Force MetaMask to show the account-selection dialog even if the site
  // already has a cached permission (e.g. after an explicit disconnect).
  await provider.send('wallet_requestPermissions', [{ eth_accounts: {} }]);
  await provider.send('eth_requestAccounts', []);

  // Switch to or add Arc Testnet
  try {
    await provider.send('wallet_switchEthereumChain', [
      { chainId: ARC_TESTNET.chainIdHex },
    ]);
  } catch {
    // Chain not added yet — add it
    try {
      await provider.send('wallet_addEthereumChain', [ARC_TESTNET_CHAIN_CONFIG]);
    } catch (addError) {
      throw new Error('Failed to add Arc Testnet to wallet. Please add it manually.');
    }
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address, provider };
}

// Get USDC balance for an address
export async function getUsdcBalance(provider: BrowserProvider, address: string): Promise<string> {
  const contract = new Contract(ARC_USDC.address, ERC20_ABI, provider);
  const balance = await contract.balanceOf(address);
  return formatUnits(balance, ARC_USDC.decimals);
}

// Get native ETH balance (for gas)
export async function getEthBalance(provider: BrowserProvider, address: string): Promise<string> {
  const balance = await provider.getBalance(address);
  return formatUnits(balance, 18);
}

// Send USDC to a recipient
export async function sendUsdc(
  provider: BrowserProvider,
  to: string,
  amount: string // human-readable e.g. "100.50"
): Promise<{ txHash: string; receipt: unknown }> {
  const signer = await provider.getSigner();
  const contract = new Contract(ARC_USDC.address, ERC20_ABI, signer);

  // Parse amount with 6 decimals (USDC standard)
  const parsedAmount = parseUnits(amount, ARC_USDC.decimals);

  const tx = await contract.transfer(to, parsedAmount);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    receipt,
  };
}

// Batch send USDC to multiple recipients (sequential)
export async function batchSendUsdc(
  provider: BrowserProvider,
  transfers: Array<{ to: string; amount: string; name: string }>,
  onProgress?: (index: number, total: number, txHash: string) => void
): Promise<Array<{ to: string; amount: string; txHash: string; status: 'confirmed' | 'failed'; error?: string }>> {
  const results: Array<{ to: string; amount: string; txHash: string; status: 'confirmed' | 'failed'; error?: string }> = [];

  for (let i = 0; i < transfers.length; i++) {
    const transfer = transfers[i];
    try {
      const { txHash } = await sendUsdc(provider, transfer.to, transfer.amount);
      results.push({ to: transfer.to, amount: transfer.amount, txHash, status: 'confirmed' });
      onProgress?.(i, transfers.length, txHash);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      results.push({ to: transfer.to, amount: transfer.amount, txHash: '', status: 'failed', error: errMsg });
    }
  }

  return results;
}

// Get explorer URL for a transaction
export function getExplorerTxUrl(txHash: string): string {
  return `${ARC_TESTNET.explorerUrl}/tx/${txHash}`;
}

// Get explorer URL for an address
export function getExplorerAddressUrl(address: string): string {
  return `${ARC_TESTNET.explorerUrl}/address/${address}`;
}
