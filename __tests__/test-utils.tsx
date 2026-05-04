import { initAuthFetch } from '@/services/http';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import React, { type ReactElement } from 'react';

initAuthFetch(async () => 'test-token');

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

type WrapperProps = { children: React.ReactNode };

function makeWrapper(): React.FC<WrapperProps> {
  const client = makeQueryClient();
  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={client}>
        <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: makeWrapper(), ...options });
}

