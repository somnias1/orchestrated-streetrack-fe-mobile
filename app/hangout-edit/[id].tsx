import { AuthGate } from '@/features/auth/AuthGate';
import EditHangoutScreen from '@/features/hangouts/editHangoutScreen';

export default function EditHangoutRoute() {
  return (
    <AuthGate>
      <EditHangoutScreen />
    </AuthGate>
  );
}
