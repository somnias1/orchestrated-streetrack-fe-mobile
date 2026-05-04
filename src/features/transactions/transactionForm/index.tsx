import type { HangoutRead } from '@/services/hangouts/types';
import type { SubcategoryRead } from '@/services/subcategories/types';
import { todayISO } from '@/utils/format';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import HangoutPicker from '../pickers/hangoutPicker';
import SubcategoryPicker from '../pickers/subcategoryPicker';

export const transactionSchema = z.object({
  subcategory_id: z.string().uuid('Select a subcategory'),
  value: z
    .number({ error: 'Enter a number' })
    .refine((v) => v !== 0, { message: 'Value must not be zero' }),
  description: z.string().min(1, 'Description is required').max(280, 'Max 280 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  hangout_id: z.string().uuid().nullable().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const defaultTransactionValues: TransactionFormValues = {
  subcategory_id: undefined as unknown as string,
  value: 0,
  description: '',
  date: todayISO(),
  hangout_id: null,
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text className="mt-0.5 text-xs text-red-600">{message}</Text>;
}

type ActivePicker = 'subcategory' | 'hangout' | null;

type TransactionFormProps = {
  defaultValues: TransactionFormValues;
  submitLabel: string;
  headerTitle: string;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  /** Optional slot rendered between the header title and cancel button — used for the delete affordance on the edit screen. */
  headerExtra?: React.ReactElement;
  /** Initial subcategory name to display (for edit pre-fill). */
  initialSubcategoryName?: string | null;
  /** Initial hangout name to display (for edit pre-fill). */
  initialHangoutName?: string | null;
};

export default function TransactionForm({
  defaultValues,
  submitLabel,
  headerTitle,
  onSubmit,
  headerExtra,
  initialSubcategoryName = null,
  initialHangoutName = null,
}: TransactionFormProps) {
  const router = useRouter();

  const [subcategoryName, setSubcategoryName] = useState<string | null>(initialSubcategoryName);
  const [hangoutName, setHangoutName] = useState<string | null>(initialHangoutName);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
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

  const handleSubmitForm = async (values: TransactionFormValues) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch {
      setSubmitError('Failed to save transaction. Please try again.');
    }
  };

  const isPending = isSubmitting;

  return (
    <>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-100 bg-white px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-sm text-brand-500">Cancel</Text>
        </Pressable>
        <Text className="flex-1 text-center text-base font-semibold text-gray-900" numberOfLines={1}>{headerTitle}</Text>
        {headerExtra ?? <View className="w-12" />}
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
          onPress={handleSubmit(handleSubmitForm)}
          disabled={isPending}
          className={`mt-2 items-center rounded-xl py-4 ${isPending ? 'bg-brand-300' : 'bg-brand-500'}`}>
          {isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-sm font-semibold text-white">{submitLabel}</Text>
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
