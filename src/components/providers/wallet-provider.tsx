'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { BrowserProvider } from 'ethers';
import { connectWallet, getUsdcBalance, getEthBalance } from '@/lib/web3/client';

interface WalletState {
  address: string | null;
  provider: BrowserProvider | null;
  usdcBalance: string;
  ethBalance: string;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    provider: null,
    usdcBalance: '0',
    ethBalance: '0',
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const refreshBalances = useCallback(async () => {
    if (!state.provider || !state.address) return;
    try {
      const [usdc, eth] = await Promise.all([
        getUsdcBalance(state.provider, state.address),
        getEthBalance(state.provider, state.address),
      ]);
      setState((prev) => ({ ...prev, usdcBalance: usdc, ethBalance: eth }));
    } catch (err) {
      console.error('Failed to refresh balances:', err);
    }
  }, [state.provider, state.address]);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const { address, provider } = await connectWallet();
      setState((prev) => ({
        ...prev,
        address,
        provider,
        isConnecting: false,
        isConnected: true,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
      setState((prev) => ({ ...prev, isConnecting: false, error: msg }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      provider: null,
      usdcBalance: '0',
      ethBalance: '0',
      isConnecting: false,
      isConnected: false,
      error: null,
    });
  }, []);

  // Refresh balances when connected
  useEffect(() => {
    if (state.isConnected) {
      refreshBalances();
    }
  }, [state.isConnected, refreshBalances]);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, refreshBalances }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
