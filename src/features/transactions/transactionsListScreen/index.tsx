import { useDeleteTransaction, useInfiniteTransactions } from '@/services/transactions/queries';
import type { TransactionRead } from '@/services/transactions/types';
import { currentYearMonth, formatDate, formatValue, monthLabel } from '@/utils/format';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';

function signedValue(value: number): string {
  if (value > 0) return `+${formatValue(value)}`;
  return formatValue(value);
}

function stepMonth(year: number, month: number, delta: 1 | -1) {
  const d = new Date(year, month - 1 + delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function TransactionRow({
  item,
  onPress,
}: {
  item: TransactionRead;
  onPress: (item: TransactionRead) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      className="flex-row items-start border-b border-gray-100 px-4 py-3 last:border-0 active:bg-gray-50">
      <View className="w-16 shrink-0">
        <Text className="text-xs text-gray-400">{formatDate(item.date)}</Text>
      </View>
      <View className="flex-1 gap-0.5 px-2">
        <Text className="text-sm font-medium text-gray-900">{item.subcategory_name}</Text>
        <Text className="text-xs text-gray-500" numberOfLines={1}>
          {item.description}
        </Text>
        {item.hangout_name ? (
          <Text className="text-xs text-brand-500">{item.hangout_name}</Text>
        ) : null}
      </View>
      <Text
        className={`text-sm font-semibold ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {signedValue(item.value)}
      </Text>
    </Pressable>
  );
}

export default function TransactionsListScreen() {
  const router = useRouter();
  const now = currentYearMonth();
  const [selected, setSelected] = useState(now);
  const [selectedRow, setSelectedRow] = useState<TransactionRead | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCurrentMonth = selected.year === now.year && selected.month === now.month;

  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetchNextPageError,
  } = useInfiniteTransactions(selected);

  const deleteMutation = useDeleteTransaction();

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    if (deleteError) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setDeleteError(null), 4000);
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [deleteError]);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(id);
          } catch {
            setDeleteError("Couldn't delete transaction. Please try again.");
          }
        },
      },
    ]);
  };

  const closeActionSheet = () => setSelectedRow(null);

  const handleEdit = () => {
    if (!selectedRow) return;
    closeActionSheet();
    router.push({ pathname: '/transaction-edit/[id]', params: { id: selectedRow.id } });
  };

  const handleDelete = () => {
    if (!selectedRow) return;
    const id = selectedRow.id;
    closeActionSheet();
    // Delay Alert until Modal dismiss animation completes — Android drops
    // Alerts that fire while a Modal is still animating away.
    setTimeout(() => confirmDelete(id), 350);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Month header */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => setSelected((s) => stepMonth(s.year, s.month, -1))}
          className="rounded-full p-1">
          <Text className="text-lg text-brand-500">‹</Text>
        </Pressable>
        <Text className="text-sm font-semibold text-gray-900">
          {monthLabel(selected.year, selected.month)}
        </Text>
        <Pressable
          onPress={() => setSelected((s) => stepMonth(s.year, s.month, 1))}
          disabled={isCurrentMonth}
          className="rounded-full p-1">
          <Text className={`text-lg ${isCurrentMonth ? 'text-gray-300' : 'text-brand-500'}`}>›</Text>
        </Pressable>
      </View>

      {/* Delete error banner */}
      {deleteError ? (
        <View className="bg-red-50 px-4 py-2">
          <Text className="text-xs text-red-600">{deleteError}</Text>
        </View>
      ) : null}

      {/* Body */}
      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2B7FD4" />
        </View>
      ) : error && !data ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-center text-sm text-red-600">Couldn't load transactions.</Text>
          <Pressable onPress={() => refetch()}>
            <Text className="text-sm font-medium text-brand-500">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow item={item} onPress={setSelectedRow} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !isLoading ? (
              <View className="flex-1 items-center py-12">
                <Text className="text-sm text-gray-400">
                  No transactions in {monthLabel(selected.year, selected.month)}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#2B7FD4" />
              </View>
            ) : isFetchNextPageError ? (
              <View className="flex-row items-center justify-center gap-2 py-4">
                <Text className="text-sm text-red-600">Couldn't load more.</Text>
                <Pressable onPress={() => fetchNextPage()}>
                  <Text className="text-sm font-medium text-brand-500">Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/transaction-new')}
        className="absolute bottom-8 right-6 h-14 w-14 items-center justify-center rounded-full bg-brand-500 shadow-lg">
        <Text className="text-2xl font-light text-white">+</Text>
      </Pressable>

      {/* Action sheet */}
      <Modal
        visible={!!selectedRow}
        transparent
        animationType="fade"
        onRequestClose={closeActionSheet}>
        <Pressable className="flex-1 bg-black/40" onPress={closeActionSheet}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="mx-4 mb-8 overflow-hidden rounded-2xl bg-white">
              <View className="border-b border-gray-100 px-4 py-3">
                <Text className="text-center text-xs text-gray-400" numberOfLines={1}>
                  {selectedRow?.subcategory_name} · {selectedRow?.date}
                </Text>
              </View>
              <Pressable onPress={handleEdit} className="px-4 py-4 active:bg-gray-50">
                <Text className="text-center text-base text-gray-900">Edit</Text>
              </Pressable>
              <View className="h-px bg-gray-100" />
              <Pressable onPress={handleDelete} className="px-4 py-4 active:bg-gray-50">
                <Text className="text-center text-base text-red-600">Delete</Text>
              </Pressable>
              <View className="h-px bg-gray-100" />
              <Pressable onPress={closeActionSheet} className="px-4 py-4 active:bg-gray-50">
                <Text className="text-center text-base font-medium text-gray-500">Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
