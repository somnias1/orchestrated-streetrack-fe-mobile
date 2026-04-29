import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

/** TECHSPEC §5.4 — locked re-prompt threshold */
const BIOMETRIC_REPROMPT_MS = 5 * 60_000;

type State = 'checking' | 'authenticated' | 'prompt' | 'failed' | 'unavailable';

export function BiometricGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>('checking');
  const [lastAuth, setLastAuth] = useState(0);

  const authenticate = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setState('unavailable');
      return;
    }

    setState('prompt');
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Streetrack',
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      setLastAuth(Date.now());
      setState('authenticated');
    } else {
      setState('failed');
    }
  };

  useEffect(() => {
    authenticate();
  }, []);

  if (state === 'checking') return null;

  if (state === 'unavailable' || state === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Streetrack</Text>
      <Text style={styles.message}>
        {state === 'failed' ? 'Authentication failed.' : 'Tap to unlock.'}
      </Text>
      <Pressable style={styles.button} onPress={authenticate}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  message: { fontSize: 16, color: '#6B7280' },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#2B7FD4',
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export { BIOMETRIC_REPROMPT_MS };
