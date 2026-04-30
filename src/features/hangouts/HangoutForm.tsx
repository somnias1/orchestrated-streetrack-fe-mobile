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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const hangoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(140, 'Max 140 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  description: z.string().max(500, 'Max 500 characters').optional().nullable(),
});

export type HangoutFormValues = z.infer<typeof hangoutSchema>;

export const defaultHangoutValues: HangoutFormValues = {
  name: '',
  date: todayISO(),
  description: null,
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text className="mt-0.5 text-xs text-red-600">{message}</Text>;
}

type HangoutFormProps = {
  defaultValues: HangoutFormValues;
  submitLabel: string;
  headerTitle: string;
  onSubmit: (values: HangoutFormValues) => Promise<void>;
  headerExtra?: React.ReactElement;
};

export function HangoutForm({
  defaultValues,
  submitLabel,
  headerTitle,
  onSubmit,
  headerExtra,
}: HangoutFormProps) {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HangoutFormValues>({
    resolver: zodResolver(hangoutSchema),
    defaultValues,
  });

  const selectedDate = watch('date');

  const handleSubmitForm = async (values: HangoutFormValues) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch {
      setSubmitError('Failed to save hangout. Please try again.');
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

        {/* Name */}
        <View className="gap-1">
          <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Name *
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Hangout name…"
                placeholderTextColor="#9ca3af"
                maxLength={140}
                className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900"
              />
            )}
          />
          <FieldError message={errors.name?.message} />
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

        {/* Description */}
        <View className="gap-1">
          <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Description (optional)
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value ?? ''}
                onChangeText={(t) => onChange(t === '' ? null : t)}
                onBlur={onBlur}
                placeholder="What's this hangout about?"
                placeholderTextColor="#9ca3af"
                maxLength={500}
                multiline
                numberOfLines={3}
                className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900"
              />
            )}
          />
          <FieldError message={errors.description?.message} />
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
    </>
  );
}
