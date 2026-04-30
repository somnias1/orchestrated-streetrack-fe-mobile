import { AuthGate } from '@/features/auth/AuthGate';
import { EditTransactionScreen } from '@/features/transactions/EditTransactionScreen';

export default function EditTransactionRoute() {
  return (
    <AuthGate>
      <EditTransactionScreen />
    </AuthGate>
  );
}
