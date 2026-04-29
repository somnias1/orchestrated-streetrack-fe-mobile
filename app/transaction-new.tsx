import { AuthGate } from '@/features/auth/AuthGate';
import { CreateTransactionScreen } from '@/features/transactions/CreateTransactionScreen';

export default function TransactionNewRoute() {
  return (
    <AuthGate>
      <CreateTransactionScreen />
    </AuthGate>
  );
}
