import { useRouter } from 'expo-router';
import { useCreateHangout } from '@/services/hangouts/queries';
import { HangoutForm, defaultHangoutValues, type HangoutFormValues } from './HangoutForm';

export function CreateHangoutScreen() {
  const router = useRouter();
  const mutation = useCreateHangout();

  const onSubmit = async (values: HangoutFormValues) => {
    await mutation.mutateAsync({
      name: values.name,
      date: values.date,
      description: values.description ?? null,
    });
    router.back();
  };

  return (
    <HangoutForm
      defaultValues={defaultHangoutValues}
      submitLabel="Save hangout"
      headerTitle="New Hangout"
      onSubmit={onSubmit}
    />
  );
}
