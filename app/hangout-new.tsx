import { AuthGate } from '@/features/auth/AuthGate';
import { CreateHangoutScreen } from '@/features/hangouts/CreateHangoutScreen';

export default function HangoutNewRoute() {
  return (
    <AuthGate>
      <CreateHangoutScreen />
    </AuthGate>
  );
}
