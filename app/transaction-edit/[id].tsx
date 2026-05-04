import { AuthGate } from '@/features/auth/AuthGate';
import EditTransactionScreen from '@/features/transactions/editTransactionScreen';

export default function EditTransactionRoute() {
  return (
    <AuthGate>
      <EditTransactionScreen />
    </AuthGate>
  );
}
