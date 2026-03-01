import { PayoutHistory } from '@/components/payout/payout-history';

export default function HistoryPage() {
  return (
    <div className="h-full">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold">Payout History</h1>
        <p className="text-muted-foreground">View past payout executions and transaction receipts</p>
      </div>
      <PayoutHistory />
    </div>
  );
}
