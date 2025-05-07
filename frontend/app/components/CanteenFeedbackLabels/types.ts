import { CanteensFeedbacksLabels, CanteensFeedbacksLabelsTranslations, FoodsFeedbacksLabelsTranslations } from "@/constants/types";

export interface CanteenFeedbackLabelProps {
  label: CanteensFeedbacksLabels;
  date: string;
}

export interface ModifiedCanteensFeedbacksLabelsEntries {
  count: string;
  like: boolean;
}
