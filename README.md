# FlowPay ⚡ — Visual Payouts on Arc

**A visual payout flow builder for batch USDC transfers on Arc Testnet.**

FlowPay lets you design payout flows as node graphs, simulate distributions, and execute batch USDC transfers—all through a beautiful drag-and-drop interface.

![Arc Testnet](https://img.shields.io/badge/Arc_Testnet-5042002-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![USDC](https://img.shields.io/badge/USDC-ERC20-green)

## 🎯 Hackathon Tracks

### Track 1: Automated Payout Logic
- ✅ Visual node-based payout flow designer
- ✅ Multi-recipient settlement with percentage splits
- ✅ Policy-based filters (min/max amount rules)
- ✅ Simulate before executing — dry run mode
- ✅ Batch USDC transfers with transaction receipts
- ✅ Circle Gateway integration for cross-chain settlement

### Track 2: Chain-Abstracted USDC UX
- ✅ Arc as unified liquidity hub for USDC payouts
- ✅ Circle Gateway for cross-chain USDC settlement (any chain → Arc)
- ✅ Single interface for multi-chain treasury management
- ✅ Explorer links for full transparency

---

## 📋 Prerequisites

Before starting, you'll need:

1. **Node.js 18+** — [Download](https://nodejs.org/)
2. **MetaMask** browser extension — [Install](https://metamask.io/)
3. **Supabase account** (free) — [Sign up](https://supabase.com/)
4. **Some testnet ETH on Arc** — for gas fees (see below)

---

## 🚀 Quick Start

### Step 1: Clone and Install

```bash
git clone https://github.com/your-repo/Arc-defi-hack.git
cd Arc-defi-hack
npm install
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. Wait for the project to finish setting up
3. Go to **Settings → API** and note:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Publishable key** — safe for client-side
   - **Secret key** — server-side only, keep secret!

### Step 3: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor and click **Run**
5. You should see "Success" — this creates all tables and seeds demo data

### Step 4: Set Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...your-publishable-key
SUPABASE_SECRET_KEY=eyJ...your-secret-key

# These are already set correctly for Arc Testnet:
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app
NEXT_PUBLIC_ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000

# Optional: Circle API key (mock data used if not set)
# CIRCLE_API_KEY=your-circle-api-key

# Optional: Server-side payout executor private key
# PAYOUT_EXECUTOR_PRIVATE_KEY=your-private-key
```

### Step 5: Add Arc Testnet to MetaMask

The app will auto-prompt you, but you can also add manually:

| Setting | Value |
|---------|-------|
| Network Name | Arc Testnet |
| RPC URL | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency Symbol | ETH |
| Block Explorer | `https://testnet.arcscan.app` |

### Step 6: Get Testnet ETH (Gas)

You need testnet ETH on Arc for gas fees:

1. Visit the Arc Testnet faucet (check [Arc docs](https://docs.arc.network) for the latest faucet link)
2. Enter your MetaMask wallet address
3. Request testnet ETH
4. Verify in MetaMask that your balance updated

### Step 7: Get Testnet USDC

Arc USDC is a system precompile at address `0x3600000000000000000000000000000000000000`.

- Check the Arc faucet or Bridge for testnet USDC
- You can verify your balance in the FlowPay dashboard after connecting your wallet
- The USDC uses **6 decimals** (standard), while gas uses 18 decimals

### Step 8: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 Using FlowPay

### 1. Connect Your Wallet
Click **"Connect Wallet"** in the sidebar. MetaMask will prompt you to switch to Arc Testnet.

### 2. Create a Payout Flow
- Go to **Flows** → click **"New Flow"**
- You'll see a canvas with a **Treasury Source** node
- Set the source amount (e.g., 1000 USDC) and your wallet address

### 3. Build the Flow
Drag nodes from the **Node Palette** on the left:
- **Treasury Source** — Starting point with USDC amount
- **Split** — Divide funds by percentage (e.g., 60/40)
- **Policy Filter** — Apply rules (min/max amounts)
- **Recipient** — Wallet address that receives funds

Connect nodes by dragging from output handles to input handles.

### 4. Simulate
Click **"Simulate"** to see computed amounts per recipient without spending any gas. Review the breakdown in the simulation panel.

### 5. Execute Payout
Click **"Execute Payout"** → confirm in the dialog → approve each transaction in MetaMask. Watch transfers complete in real-time with links to the Arc explorer.

### 6. View History
Go to **History** to see all past payout runs with transaction receipts.

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── (dashboard)/          # Dashboard layout with sidebar
│   │   ├── page.tsx          # Dashboard home
│   │   ├── flows/            # Flow list + editor
│   │   └── history/          # Payout history
│   ├── api/
│   │   ├── flows/            # Flow CRUD API
│   │   ├── payouts/          # Simulate + Execute APIs
│   │   └── circle/           # Circle Gateway API
│   └── layout.tsx            # Root layout
├── components/
│   ├── flow/                 # React Flow nodes + editor
│   ├── layout/               # Sidebar navigation
│   ├── payout/               # Payout dialog + history
│   ├── providers/            # Wallet context provider
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── engine/               # Flow simulation engine
│   ├── supabase/             # Supabase client/server
│   ├── circle/               # Circle Gateway integration
│   └── web3/                 # Arc testnet + USDC functions
├── types/                    # TypeScript types
└── supabase/
    └── migrations/           # SQL migration files
```

### Security Boundaries
| Layer | Runs on | Keys |
|-------|---------|------|
| UI Components | Client (browser) | `NEXT_PUBLIC_*` only |
| Wallet Signing | Client (MetaMask) | User's wallet key |
| API Routes | Server (Node.js) | `SUPABASE_SECRET_KEY`, `CIRCLE_API_KEY` |
| Server Executor | Server (optional) | `PAYOUT_EXECUTOR_PRIVATE_KEY` |

---

## 🔗 Circle Gateway Integration

FlowPay integrates Circle Gateway for cross-chain USDC settlement:

- **What it does**: Enables receiving USDC from any supported chain (Ethereum, Polygon, Arbitrum, Base, Solana) and settling on Arc Testnet
- **How it works**: The `/api/circle` endpoint provides quote and transfer APIs
- **Fallback**: If `CIRCLE_API_KEY` is not set, the app uses mock responses for demo purposes
- **Setup**: Get a Circle API key from [circle.com/developers](https://www.circle.com/developers) and add it to `.env.local`

---

## 🐛 Troubleshooting

### "No wallet detected"
Install [MetaMask](https://metamask.io/) and refresh the page.

### "Wrong network" or chain errors
The app will auto-prompt to switch to Arc Testnet. If it doesn't work:
1. Open MetaMask → Settings → Networks → Add Network
2. Enter the Arc Testnet details from Step 5 above

### "Insufficient funds for gas"
You need testnet ETH for gas. Visit the Arc faucet to get some.

### "USDC transfer failed"
- Make sure you have enough USDC balance (check dashboard)
- USDC uses **6 decimals** — the app handles this automatically
- Check the recipient address is valid

### RPC errors / timeouts
- Arc Testnet RPC: `https://rpc.testnet.arc.network`
- If the RPC is slow, retry after a few seconds
- Check [Arc status](https://testnet.arcscan.app) for network health

### Supabase connection errors
- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are correct
- Make sure you ran the migration SQL in Step 3
- Check that RLS policies were created (the migration includes them)

### Decimal confusion
- **USDC amounts**: 6 decimals (e.g., 100.50 USDC = 100500000 raw)
- **Gas (ETH)**: 18 decimals
- The app's `parseUnits` calls handle this correctly — you always enter human-readable amounts

---

## 📝 Demo Script (2–3 minutes)

1. **[0:00]** "FlowPay is a visual payout system built on Arc Testnet."
2. **[0:15]** Show dashboard → connect wallet → show USDC balance
3. **[0:30]** Navigate to Flows → Create new flow
4. **[0:45]** Drag nodes: Source (1000 USDC) → Split (60/40) → 2 Recipients
5. **[1:15]** Click Simulate → show computed amounts
6. **[1:30]** Click Execute → walk through MetaMask approvals
7. **[1:45]** Show tx hashes + explorer links
8. **[2:00]** Navigate to History → show completed payout run
9. **[2:15]** "Arc serves as a unified liquidity hub — with Circle Gateway, USDC from any chain settles here."
10. **[2:30]** Show Circle Gateway card → cross-chain support

---

## ✅ Submission Checklist

- [ ] App runs locally with `npm run dev`
- [ ] Wallet connects to Arc Testnet (chain ID 5042002)
- [ ] USDC balance shows correctly (6 decimals)
- [ ] Flow editor: drag, connect, save nodes
- [ ] Simulation computes correct amounts
- [ ] Payout execution sends real USDC on Arc Testnet
- [ ] Transaction hashes link to testnet.arcscan.app
- [ ] Payout history shows past runs
- [ ] Circle Gateway integration (or mock) present
- [ ] README is clear for crypto beginners
- [ ] Code is committed and pushed
- [ ] Demo video/recording prepared

---

## 📄 License

MIT
