import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { HangoutRead } from '@/services/hangouts/types';
import { useHangoutsPicker } from '@/services/hangouts/queries';
import { ResourcePicker } from './ResourcePicker';

type HangoutPickerProps = {
  onSelect: (hangout: HangoutRead | null) => void;
  onClose: () => void;
};

export function HangoutPicker({ onSelect, onClose }: HangoutPickerProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useHangoutsPicker(search || undefined);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const handleClear = useCallback(() => {
    onSelect(null);
    onClose();
  }, [onSelect, onClose]);

  const clearRow = (
    <Pressable onPress={handleClear} className="mb-2 rounded-lg border border-gray-200 px-3 py-2">
      <Text className="text-sm text-gray-500">Clear hangout</Text>
    </Pressable>
  );

  return (
    <ResourcePicker
      title="Select hangout (optional)"
      query={search}
      onQueryChange={setSearch}
      items={items}
      isLoading={isLoading}
      hasNextPage={!!hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      onSelect={onSelect}
      onClose={onClose}
      emptyLabel="No hangouts found"
      headerExtra={clearRow}
      renderItem={(item) => (
        <View className="gap-0.5">
          <Text className="text-sm font-medium text-gray-900">{item.name}</Text>
          {item.date ? (
            <Text className="text-xs text-gray-400">{item.date}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
