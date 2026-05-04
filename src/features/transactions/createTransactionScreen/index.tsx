import { useCreateTransaction } from '@/services/transactions/queries';
import { useRouter } from 'expo-router';
import TransactionForm, { defaultTransactionValues, type TransactionFormValues } from '../transactionForm';

export default function CreateTransactionScreen() {
  const router = useRouter();
  const mutation = useCreateTransaction();

  const onSubmit = async (values: TransactionFormValues) => {
    await mutation.mutateAsync({
      subcategory_id: values.subcategory_id,
      value: values.value,
      description: values.description,
      date: values.date,
      hangout_id: values.hangout_id ?? null,
    });
    router.back();
  };

  return (
    <TransactionForm
      defaultValues={defaultTransactionValues}
      submitLabel="Save transaction"
      headerTitle="New Transaction"
      onSubmit={onSubmit}
    />
  );
}
