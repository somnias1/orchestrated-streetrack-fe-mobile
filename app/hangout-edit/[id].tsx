import { AuthGate } from '@/features/auth/AuthGate';
import { EditHangoutScreen } from '@/features/hangouts/EditHangoutScreen';

export default function EditHangoutRoute() {
  return (
    <AuthGate>
      <EditHangoutScreen />
    </AuthGate>
  );
}
