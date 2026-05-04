import { AuthGate } from '@/features/auth/AuthGate';
import CreateHangoutScreen from '@/features/hangouts/createHangoutScreen';

export default function HangoutNewRoute() {
  return (
    <AuthGate>
      <CreateHangoutScreen />
    </AuthGate>
  );
}
