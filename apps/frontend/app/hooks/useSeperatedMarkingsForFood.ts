import { useAppSelector } from '@/redux/hooks';

export const useSeperatedMarkingsForFood = (): boolean | null => {
	return useAppSelector((state) => state.settings.foodoffersShowSeparatedMarkingsBreakdown);
};

export default useSeperatedMarkingsForFood;
