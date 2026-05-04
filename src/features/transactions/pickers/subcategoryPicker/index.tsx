import { useSubcategoriesPicker } from '@/services/subcategories/queries';
import type { SubcategoryRead } from '@/services/subcategories/types';
import { useState } from 'react';
import { Text, View } from 'react-native';
import ResourcePicker from '../resourcePicker';

type SubcategoryPickerProps = {
  onSelect: (subcategory: SubcategoryRead) => void;
  onClose: () => void;
};

export default function SubcategoryPicker({ onSelect, onClose }: SubcategoryPickerProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSubcategoriesPicker(search || undefined);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <ResourcePicker
      title="Select subcategory"
      query={search}
      onQueryChange={setSearch}
      items={items}
      isLoading={isLoading}
      hasNextPage={!!hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      onSelect={onSelect}
      onClose={onClose}
      emptyLabel="No subcategories found"
      renderItem={(item) => (
        <View className="gap-0.5">
          <Text className="text-sm font-medium text-gray-900">{item.name}</Text>
          <Text className="text-xs text-gray-400">{item.category_name}</Text>
        </View>
      )}
    />
  );
}
