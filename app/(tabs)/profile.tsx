import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useAuthSession } from '@/features/auth/useAuthSession';

export default function ProfileScreen() {
  const { user, signOut } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-white px-6">
      {user?.email ? (
        <Text className="text-base text-gray-600">{user.email}</Text>
      ) : null}
      <Pressable
        onPress={handleSignOut}
        disabled={signingOut}
        className="rounded-lg bg-brand-500 px-8 py-3 disabled:opacity-50">
        {signingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-semibold text-white">Sign out</Text>
        )}
      </Pressable>
    </View>
  );
}
