import { useDeleteHangout, useHangout, useUpdateHangout } from '@/services/hangouts/queries';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { HangoutForm, type HangoutFormValues } from './HangoutForm';

export function EditHangoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useHangout(id);
  const updateMutation = useUpdateHangout();
  const deleteMutation = useDeleteHangout();

  const onSubmit = async (values: HangoutFormValues) => {
    await updateMutation.mutateAsync({
      id,
      body: {
        name: values.name,
        date: values.date,
        description: values.description ?? null,
      },
    });
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert('Delete Hangout', 'Are you sure you want to delete this hangout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(id);
            router.back();
          } catch {
            Alert.alert('Error', "Couldn't delete hangout. Please try again.");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2B7FD4" />
      </View>
    );
  }

  const isNotFound = isError && (error as { status?: number })?.status === 404;
  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white px-8">
        {isNotFound ? (
          <>
            <Text className="text-center text-sm text-gray-600">Hangout no longer exists.</Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-sm font-medium text-brand-500">Go back</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="text-center text-sm text-red-600">Couldn't load hangout.</Text>
            <Pressable onPress={() => refetch()}>
              <Text className="text-sm font-medium text-brand-500">Retry</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const deleteButton = (
    <Pressable onPress={confirmDelete} disabled={deleteMutation.isPending} className="w-12 items-end">
      <Text className={`text-sm font-medium ${deleteMutation.isPending ? 'text-gray-300' : 'text-red-500'}`}>
        Delete
      </Text>
    </Pressable>
  );

  return (
    <HangoutForm
      defaultValues={{
        name: data!.name,
        date: data!.date,
        description: data!.description ?? null,
      }}
      submitLabel="Save changes"
      headerTitle="Edit Hangout"
      onSubmit={onSubmit}
      headerExtra={deleteButton}
    />
  );
}
