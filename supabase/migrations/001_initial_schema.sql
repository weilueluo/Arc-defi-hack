-- FlowPay Schema Migration
-- Supabase Postgres

-- Organizations
CREATE TABLE IF NOT EXISTS orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  treasury_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recipients (payees)
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payout flows (stores the React Flow graph as JSON)
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Flow',
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payout runs (one per execution/simulation)
CREATE TABLE IF NOT EXISTS payout_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES flows(id) ON DELETE SET NULL,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'simulated'
    CHECK (status IN ('simulated', 'pending', 'executing', 'completed', 'failed')),
  total_amount TEXT NOT NULL DEFAULT '0',
  source_address TEXT NOT NULL,
  items_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Individual payout line items
CREATE TABLE IF NOT EXISTS payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES payout_runs(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES recipients(id) ON DELETE SET NULL,
  recipient_address TEXT NOT NULL,
  recipient_name TEXT NOT NULL DEFAULT '',
  amount TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'confirmed', 'failed')),
  tx_hash TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipients_org ON recipients(org_id);
CREATE INDEX IF NOT EXISTS idx_flows_org ON flows(org_id);
CREATE INDEX IF NOT EXISTS idx_payout_runs_flow ON payout_runs(flow_id);
CREATE INDEX IF NOT EXISTS idx_payout_runs_org ON payout_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_run ON payout_items(run_id);

-- RLS Policies (hackathon-simple: enable RLS, allow all for authenticated)
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;

-- For hackathon demo: allow all operations (would restrict by org in production)
CREATE POLICY "Allow all for anon" ON orgs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON recipients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON flows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON payout_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON payout_items FOR ALL USING (true) WITH CHECK (true);

-- Seed a demo org
INSERT INTO orgs (id, name, treasury_address) VALUES
  ('00000000-0000-0000-0000-000000000001', 'FlowPay Demo Org', '0x0000000000000000000000000000000000000000')
ON CONFLICT (id) DO NOTHING;

-- Seed demo recipients
INSERT INTO recipients (org_id, name, wallet_address, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alice Engineer', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'alice@example.com'),
  ('00000000-0000-0000-0000-000000000001', 'Bob Designer', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'bob@example.com'),
  ('00000000-0000-0000-0000-000000000001', 'Carol Marketing', '0x90F79bf6EB2c4f870365E785982E1f101E93b906', 'carol@example.com'),
  ('00000000-0000-0000-0000-000000000001', 'Dave Ops', '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 'dave@example.com')
ON CONFLICT DO NOTHING;

-- Update trigger for flows
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
