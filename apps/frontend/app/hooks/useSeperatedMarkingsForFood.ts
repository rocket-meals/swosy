import { useAppSelector } from '@/redux/hooks';
import useCustomerConfigSeperateMarkingsForFood from '@/hooks/useCustomerConfigSeperateMarkingsForFood';

export const useSeperatedMarkingsForFood = (): boolean => {
	const reduxValue = useAppSelector((state) => state.settings.foodoffersShowSeparatedMarkingsBreakdown);
	const customerConfigValue = useCustomerConfigSeperateMarkingsForFood();

	if (reduxValue === null) {
		return customerConfigValue;
	}

	return reduxValue;
};

export default useSeperatedMarkingsForFood;
