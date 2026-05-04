import { useDeleteHangout, useInfiniteHangouts } from '@/services/hangouts/queries';
import type { HangoutRead } from '@/services/hangouts/types';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

function HangoutRow({
  item,
  onPress,
}: {
  item: HangoutRead;
  onPress: (item: HangoutRead) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      className="flex-row items-start border-b border-gray-100 px-4 py-3 last:border-0 active:bg-gray-50">
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-medium text-gray-900">{item.name}</Text>
        <Text className="text-xs text-gray-500">{item.date}</Text>
      </View>
    </Pressable>
  );
}

export default function HangoutsListScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<HangoutRead | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetchNextPageError,
  } = useInfiniteHangouts(debouncedSearch || undefined);

  const deleteMutation = useDeleteHangout();

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
    Alert.alert('Delete Hangout', 'Are you sure you want to delete this hangout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(id);
          } catch {
            setDeleteError("Couldn't delete hangout. Please try again.");
          }
        },
      },
    ]);
  };

  const closeActionSheet = () => setSelectedRow(null);

  const handleEdit = () => {
    if (!selectedRow) return;
    closeActionSheet();
    router.push({ pathname: '/hangout-edit/[id]', params: { id: selectedRow.id } });
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
      {/* Search header */}
      <View className="bg-white px-4 py-3 shadow-sm">
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search hangouts…"
          placeholderTextColor="#9ca3af"
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900"
        />
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
          <Text className="text-center text-sm text-red-600">Couldn't load hangouts.</Text>
          <Pressable onPress={() => refetch()}>
            <Text className="text-sm font-medium text-brand-500">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HangoutRow item={item} onPress={setSelectedRow} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !isLoading ? (
              <View className="flex-1 items-center py-12">
                <Text className="text-sm text-gray-400">No hangouts found</Text>
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
        onPress={() => router.push('/hangout-new')}
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
                  {selectedRow?.name} · {selectedRow?.date}
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
