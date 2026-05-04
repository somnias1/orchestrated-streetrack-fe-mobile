import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error');
  return <Text>All good</Text>;
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('ErrorBoundary', () => {
  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <Text>Content</Text>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('shows fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong.')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });

  it('logs the error via console.error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(console.error).toHaveBeenCalled();
  });
});
