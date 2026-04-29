import { useBalance, useDuePeriodicExpenses, useMonthBalance } from '@/services/dashboard/queries';
import type { DashboardDuePeriodicExpenseRead } from '@/services/dashboard/types';
import { formatValue } from '@/utils/format';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

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

function signedBalance(balance: number): string {
  if (balance > 0) return `+${formatValue(balance)}`;
  return formatValue(balance);
}

function sortedExpenses(
  items: DashboardDuePeriodicExpenseRead[],
): DashboardDuePeriodicExpenseRead[] {
  return [...items].sort((a, b) => {
    if (a.due_day === null && b.due_day === null) return 0;
    if (a.due_day === null) return 1;
    if (b.due_day === null) return -1;
    return a.due_day - b.due_day;
  });
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="rounded-lg bg-red-50 px-4 py-3 gap-2">
      <Text className="text-sm text-red-600">{message}</Text>
      <Pressable onPress={onRetry}>
        <Text className="text-sm font-medium text-brand-500">Retry</Text>
      </Pressable>
    </View>
  );
}

function SectionLoading() {
  return (
    <View className="items-center py-6">
      <ActivityIndicator size="small" color="#2B7FD4" />
    </View>
  );
}

function BalanceSection() {
  const { data, isLoading, error, refetch } = useBalance();

  return (
    <View className="rounded-xl bg-brand-50 p-4">
      <Text className="mb-1 text-sm font-medium text-brand-900">Cumulative balance</Text>
      {isLoading && <SectionLoading />}
      {error && <SectionError message="Couldn't load balance." onRetry={refetch} />}
      {data && (
        <Text className="text-3xl font-bold text-brand-900">{signedBalance(data.balance)}</Text>
      )}
    </View>
  );
}

function MonthBalanceSection() {
  const { year, month } = currentYearMonth();
  const { data, isLoading, error, refetch } = useMonthBalance(year, month);

  return (
    <View className="rounded-xl bg-white p-4 shadow-sm">
      <Text className="mb-1 text-sm font-medium text-gray-500">
        {monthLabel(year, month)}
      </Text>
      <Text className="mb-2 text-xs text-gray-400">Month balance</Text>
      {isLoading && <SectionLoading />}
      {error && <SectionError message="Couldn't load month balance." onRetry={refetch} />}
      {data && (
        <Text className="text-2xl font-semibold text-gray-900">
          {signedBalance(data.balance)}
        </Text>
      )}
    </View>
  );
}

function PaidBadge({ paid }: { paid: boolean }) {
  return paid ? (
    <View className="rounded-full bg-green-100 px-2 py-0.5">
      <Text className="text-xs font-medium text-green-700">Paid</Text>
    </View>
  ) : (
    <View className="rounded-full bg-red-100 px-2 py-0.5">
      <Text className="text-xs font-medium text-red-700">Unpaid</Text>
    </View>
  );
}

function PeriodicExpensesSection() {
  const { year, month } = currentYearMonth();
  const { data, isLoading, error, refetch } = useDuePeriodicExpenses(year, month);

  const items = data ? sortedExpenses(data) : [];

  return (
    <View className="rounded-xl bg-white p-4 shadow-sm">
      <Text className="mb-3 text-sm font-medium text-gray-500">
        Periodic expenses — {monthLabel(year, month)}
      </Text>
      {isLoading && <SectionLoading />}
      {error && <SectionError message="Couldn't load periodic expenses." onRetry={refetch} />}
      {data && items.length === 0 && (
        <Text className="text-sm text-gray-400">No periodic expenses this month</Text>
      )}
      {data &&
        items.map((item) => (
          <View
            key={item.subcategory_id}
            className="flex-row items-center justify-between border-b border-gray-100 py-3 last:border-0">
            <View className="flex-1 gap-0.5">
              <Text className="text-sm font-medium text-gray-900">{item.subcategory_name}</Text>
              <Text className="text-xs text-gray-400">
                {item.due_day !== null ? `Due on day ${item.due_day}` : 'No due date'}
              </Text>
            </View>
            <PaidBadge paid={item.paid} />
          </View>
        ))}
    </View>
  );
}

export function DashboardScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="gap-4 p-4 pb-8">
      <BalanceSection />
      <MonthBalanceSection />
      <PeriodicExpensesSection />
    </ScrollView>
  );
}
