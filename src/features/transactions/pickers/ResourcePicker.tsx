import {
  BottomSheetFlatList,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

type ResourcePickerProps<T> = {
  query: string;
  onQueryChange: (text: string) => void;
  items: T[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactElement;
  emptyLabel: string;
  title: string;
  headerExtra?: React.ReactElement;
  /** Called after the sheet has fully dismissed — unmounts the picker. */
  onClose: () => void;
};

export function ResourcePicker<T extends { id: string }>({
  query,
  onQueryChange,
  items,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onSelect,
  renderItem,
  emptyLabel,
  title,
  headerExtra,
  onClose,
}: ResourcePickerProps<T>) {
  const sheetRef = useRef<BottomSheetModal>(null);

  // Present as soon as the sheet is mounted.
  useEffect(() => {
    const t = setTimeout(() => sheetRef.current?.present(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleSelect = useCallback(
    (item: T) => {
      onSelect(item);
      sheetRef.current?.dismiss();
    },
    [onSelect],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['60%', '90%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableFocusHook={false}
      keyboardBehavior="interactive"
      onDismiss={onClose}>
      <View className="px-4 pb-2">
        <Text className="mb-3 text-base font-semibold text-gray-900">{title}</Text>
        {headerExtra}
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search…"
          placeholderTextColor="#9ca3af"
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900"
        />
      </View>

      {isLoading && !items.length ? (
        <View className="flex-1 items-center py-8">
          <ActivityIndicator size="small" color="#2B7FD4" />
        </View>
      ) : (
        <BottomSheetFlatList
          style={{ flex: 1 }}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)} className="px-4 py-3">
              {renderItem(item)}
            </TouchableOpacity>
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center py-8">
                <Text className="text-sm text-gray-400">{emptyLabel}</Text>
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
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </BottomSheetModal>
  );
}
