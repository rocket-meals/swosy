import type BottomSheet from '@gorhom/bottom-sheet';

export interface CalendarSheetProps {
  closeSheet: () => void;
  sheetRef: React.RefObject<BottomSheet>;
}

export type Direction = 'left' | 'right';
