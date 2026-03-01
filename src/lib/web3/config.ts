// Arc Testnet configuration
export const ARC_TESTNET = {
  chainId: 5042002,
  chainIdHex: '0x4cef52',
  name: 'Arc Testnet',
  rpcUrl: process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network',
  explorerUrl: process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || 'https://testnet.arcscan.app',
  currency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
} as const;

// Arc USDC is a system precompile at this address
// Uses 6 decimals for amounts (standard USDC) but gas is 18 decimals
export const ARC_USDC = {
  address: process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS || '0x3600000000000000000000000000000000000000',
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin',
} as const;

// Standard ERC-20 ABI (subset we need for USDC)
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

// Network config for wallet_addEthereumChain
export const ARC_TESTNET_CHAIN_CONFIG = {
  chainId: ARC_TESTNET.chainIdHex,
  chainName: ARC_TESTNET.name,
  nativeCurrency: ARC_TESTNET.currency,
  rpcUrls: [ARC_TESTNET.rpcUrl],
  blockExplorerUrls: [ARC_TESTNET.explorerUrl],
};
