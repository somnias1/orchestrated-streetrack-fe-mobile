import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useAuthSession } from './useAuthSession';

export function SignInScreen() {
  const { signIn, signingIn, error } = useAuthSession();

  return (
    <View className="flex-1 items-center justify-center gap-8 bg-white px-6">
      <Text className="text-4xl font-bold text-brand-900">Streetrack</Text>
      <Text className="text-base text-gray-500">Track your expenses on the go</Text>

      <Pressable
        onPress={signIn}
        disabled={signingIn}
        className="w-full max-w-xs rounded-lg bg-brand-500 py-4 items-center disabled:opacity-50">
        {signingIn ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Sign in</Text>
        )}
      </Pressable>

      {error ? (
        <View className="items-center gap-1">
          <Text className="text-sm text-gray-600">Couldn't sign in. Try again.</Text>
          <Text className="text-xs text-gray-400">{error.message}</Text>
        </View>
      ) : null}
    </View>
  );
}
