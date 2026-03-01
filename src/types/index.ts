// Database types matching Supabase schema

export interface Org {
  id: string;
  name: string;
  treasury_address: string;
  created_at: string;
}

export interface Recipient {
  id: string;
  org_id: string;
  name: string;
  wallet_address: string;
  email?: string;
  created_at: string;
}

export interface Flow {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
  created_at: string;
  updated_at: string;
}

export interface FlowNodeData {
  id: string;
  type: 'source' | 'split' | 'filter' | 'recipient';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface PayoutRun {
  id: string;
  flow_id: string;
  org_id: string;
  status: 'simulated' | 'pending' | 'executing' | 'completed' | 'failed';
  total_amount: string;
  source_address: string;
  items_count: number;
  created_at: string;
  completed_at?: string;
}

export interface PayoutItem {
  id: string;
  run_id: string;
  recipient_id?: string;
  recipient_address: string;
  recipient_name: string;
  amount: string;
  status: 'pending' | 'sending' | 'confirmed' | 'failed';
  tx_hash?: string;
  error?: string;
  created_at: string;
}

// Engine types
export interface SimulationResult {
  items: SimulationItem[];
  totalAmount: string;
  sourceAddress: string;
}

export interface SimulationItem {
  recipientAddress: string;
  recipientName: string;
  amount: string; // human-readable e.g. "100.50"
  percentage?: number;
  nodePath: string[];
}

// React Flow node data types
export interface SourceNodeData {
  label: string;
  amount: string;
  address: string;
}

export interface SplitNodeData {
  label: string;
  splits: { percentage: number; label: string }[];
}

export interface FilterNodeData {
  label: string;
  interval: 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  amount: string;
}

export interface RecipientNodeData {
  label: string;
  name: string;
  address: string;
}
