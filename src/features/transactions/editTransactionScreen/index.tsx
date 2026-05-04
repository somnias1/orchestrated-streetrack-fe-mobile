import { useDeleteTransaction, useTransaction, useUpdateTransaction } from '@/services/transactions/queries';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import TransactionForm, { type TransactionFormValues } from '../transactionForm';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useTransaction(id);
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const onSubmit = async (values: TransactionFormValues) => {
    await updateMutation.mutateAsync({
      id,
      body: {
        subcategory_id: values.subcategory_id,
        value: values.value,
        description: values.description,
        date: values.date,
        hangout_id: values.hangout_id ?? null,
      },
    });
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(id);
            router.back();
          } catch {
            // error shown inline via deleteMutation.isError
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

  // 404 or other fetch error
  const isNotFound = isError && (error as { status?: number })?.status === 404;
  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white px-8">
        {isNotFound ? (
          <>
            <Text className="text-center text-sm text-gray-600">Transaction no longer exists.</Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-sm font-medium text-brand-500">Go back</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="text-center text-sm text-red-600">Couldn't load transaction.</Text>
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
    <TransactionForm
      defaultValues={{
        subcategory_id: data!.subcategory_id,
        value: data!.value,
        description: data!.description,
        date: data!.date,
        hangout_id: data!.hangout_id ?? null,
      }}
      submitLabel="Save changes"
      headerTitle="Edit Transaction"
      onSubmit={onSubmit}
      headerExtra={deleteButton}
      initialSubcategoryName={data!.subcategory_name}
      initialHangoutName={data!.hangout_name ?? null}
    />
  );
}
