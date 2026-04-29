import DateTimePicker from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';
import type { SubcategoryRead } from '@/services/subcategories/types';
import type { HangoutRead } from '@/services/hangouts/types';
import { useCreateTransaction } from '@/services/transactions/queries';
import { HangoutPicker } from './pickers/HangoutPicker';
import { SubcategoryPicker } from './pickers/SubcategoryPicker';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const schema = z.object({
  subcategory_id: z.string().uuid('Select a subcategory'),
  value: z
    .number({ invalid_type_error: 'Enter a number' })
    .refine((v) => v !== 0, { message: 'Value must not be zero' }),
  description: z.string().min(1, 'Description is required').max(280, 'Max 280 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  hangout_id: z.string().uuid().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text className="mt-0.5 text-xs text-red-600">{message}</Text>;
}

type ActivePicker = 'subcategory' | 'hangout' | null;

export function CreateTransactionScreen() {
  const router = useRouter();
  const mutation = useCreateTransaction();

  const [subcategoryName, setSubcategoryName] = useState<string | null>(null);
  const [hangoutName, setHangoutName] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Only one picker is ever mounted at a time — prevents cross-sheet focus leakage on Android.
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subcategory_id: undefined,
      value: 0,
      description: '',
      date: todayISO(),
      hangout_id: null,
    },
  });

  const selectedDate = watch('date');

  const handleSelectSubcategory = (sub: SubcategoryRead) => {
    setValue('subcategory_id', sub.id, { shouldValidate: true });
    setSubcategoryName(sub.name);
  };

  const handleSelectHangout = (hangout: HangoutRead | null) => {
    setValue('hangout_id', hangout?.id ?? null, { shouldValidate: true });
    setHangoutName(hangout?.name ?? null);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await mutation.mutateAsync({
        subcategory_id: values.subcategory_id,
        value: values.value,
        description: values.description,
        date: values.date,
        hangout_id: values.hangout_id ?? null,
      });
      router.back();
    } catch {
      setSubmitError('Failed to save transaction. Please try again.');
    }
  };

  const isPending = isSubmitting || mutation.isPending;

  return (
    <>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-100 bg-white px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-sm text-brand-500">Cancel</Text>
        </Pressable>
        <Text className="text-base font-semibold text-gray-900">New Transaction</Text>
        <View className="w-12" />
      </View>

      <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="gap-4 p-4 pb-12">
        {submitError && (
          <View className="rounded-lg bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-600">{submitError}</Text>
          </View>
        )}

        {/* Subcategory */}
        <View className="gap-1">
          <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Subcategory *
          </Text>
          <Pressable
            onPress={() => setActivePicker('subcategory')}
            className="rounded-lg border border-gray-200 bg-white px-3 py-3">
            <Text className={subcategoryName ? 'text-sm text-gray-900' : 'text-sm text-gray-400'}>
              {subcategoryName ?? 'Select subcategory…'}
            </Text>
          </Pressable>
          <FieldError message={errors.subcategory_id?.message} />
        </View>

        {/* Value */}
        <View className="gap-1">
          <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Amount *
          </Text>
          <Controller
            control={control}
            name="value"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(t === '' ? 0 : parseFloat(t) || 0)}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900"
              />
            )}
          />
          <FieldError message={errors.value?.message} />
        </View>

        {/* Description */}
        <View className="gap-1">
          <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Description *
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="What was this for?"
                placeholderTextColor="#9ca3af"
                maxLength={280}
                className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900"
              />
            )}
          />
          <FieldError message={errors.description?.message} />
        </View>

        {/* Date */}
        <View className="gap-1">
          <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Date *
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-3">
            <Text className="text-sm text-gray-900">
              {new Date(selectedDate).toLocaleDateString()}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(selectedDate)}
              mode="date"
              display="default"
              onChange={(_event, date) => {
                setShowDatePicker(false);
                if (date) setValue('date', date.toISOString().slice(0, 10), { shouldValidate: true });
              }}
            />
          )}
          <FieldError message={errors.date?.message} />
        </View>

        {/* Hangout (optional) */}
        <View className="gap-1">
          <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Hangout (optional)
          </Text>
          <Pressable
            onPress={() => setActivePicker('hangout')}
            className="rounded-lg border border-gray-200 bg-white px-3 py-3">
            <Text className={hangoutName ? 'text-sm text-gray-900' : 'text-sm text-gray-400'}>
              {hangoutName ?? 'None'}
            </Text>
          </Pressable>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
          className={`mt-2 items-center rounded-xl py-4 ${isPending ? 'bg-brand-300' : 'bg-brand-500'}`}>
          {isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-sm font-semibold text-white">Save transaction</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Pickers: only one is ever mounted — prevents cross-sheet focus leakage. */}
      {activePicker === 'subcategory' && (
        <SubcategoryPicker
          onSelect={handleSelectSubcategory}
          onClose={() => setActivePicker(null)}
        />
      )}
      {activePicker === 'hangout' && (
        <HangoutPicker
          onSelect={handleSelectHangout}
          onClose={() => setActivePicker(null)}
        />
      )}
    </>
  );
}
