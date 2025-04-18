import { Foods, FoodsFeedbacks } from "@/constants/types";

export interface NotificationSheetProps {
  closeSheet: () => void;
  previousFeedback: FoodsFeedbacks;
  foodDetails: Foods;
}
