import { FoodsFeedbacksLabelsTranslations } from "@/constants/types";

export interface FeedbackLabelProps {
  label: Array<FoodsFeedbacksLabelsTranslations>;
  imageUrl?: string | null | undefined;
  icon?: string;
  labelEntries: any;
  foodId: string;
  offerId: string;
}
