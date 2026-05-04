import React, { forwardRef, useImperativeHandle } from 'react';
import { FlatList, View } from 'react-native';

export const BottomSheetModal = forwardRef<any, any>(function BottomSheetModal(
  { children, onDismiss }: any,
  ref,
) {
  useImperativeHandle(ref, () => ({
    present: jest.fn(),
    dismiss: jest.fn(() => onDismiss?.()),
  }));
  return <View testID="bottom-sheet-modal">{children}</View>;
});

export function BottomSheetModalProvider({ children }: any) {
  return <>{children}</>;
}

export const BottomSheetFlatList = FlatList;
