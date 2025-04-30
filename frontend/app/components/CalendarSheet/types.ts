export interface CalendarSheetProps {
  closeSheet: () => void;
  selected: string;
  setSelected: (date: string) => void;
}

export type Direction = 'left' | 'right';
