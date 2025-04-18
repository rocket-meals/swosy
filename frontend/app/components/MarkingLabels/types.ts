import { FoodoffersMarkings, FoodsFeedbacksLabelsTranslations } from '@/constants/types';

export interface MarkingLabelProps {
  markingId: FoodoffersMarkings;
  handleMenuSheet?: () => void;
  // id: number;
}
