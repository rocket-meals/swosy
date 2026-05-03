import useCustomerConfig from '@/hooks/useCustomerConfig';

export const useCustomerConfigSeperateMarkingsForFood = (): boolean => {
	const customerConfig = useCustomerConfig();
	return customerConfig.foodoffers_show_separated_markings_breakdown ?? false;
};

export default useCustomerConfigSeperateMarkingsForFood;
