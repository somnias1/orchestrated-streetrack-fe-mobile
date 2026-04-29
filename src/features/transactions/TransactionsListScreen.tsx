import { useInfiniteTransactions } from '@/services/transactions/queries';
import type { TransactionRead } from '@/services/transactions/types';
import { formatDate, formatValue } from '@/utils/format';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function signedValue(value: number): string {
  if (value > 0) return `+${formatValue(value)}`;
  return formatValue(value);
}

function stepMonth(year: number, month: number, delta: 1 | -1) {
  const d = new Date(year, month - 1 + delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function TransactionRow({ item }: { item: TransactionRead }) {
  return (
    <View className="flex-row items-start border-b border-gray-100 px-4 py-3 last:border-0">
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
    </View>
  );
}

export function TransactionsListScreen() {
  const router = useRouter();
  const now = currentYearMonth();
  const [selected, setSelected] = useState(now);

  const isCurrentMonth = selected.year === now.year && selected.month === now.month;

  const { data, isLoading, error, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteTransactions(selected);
    console.log('data', data);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

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
          renderItem={({ item }) => <TransactionRow item={item} />}
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
    </View>
  );
}
