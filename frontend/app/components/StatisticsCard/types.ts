import { Foods } from '@/constants/types';

export interface StatisticsCardProps {
  food: Foods;
  handleImageSheet: () => void;
  setSelectedFoodId: React.Dispatch<React.SetStateAction<string>>;
}
