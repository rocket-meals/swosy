import { useCallback } from 'react';
import Toast from 'react-native-root-toast';
import { configureStore } from '@/redux/store';
import { isMaintenanceRunning } from '@/helper/maintenanceWindowHelper';

const useToast = () => {
	const showToast = useCallback((message: string, type = 'success') => {
		// During a maintenance most requests fail on purpose, the banner already explains why.
		const appSettings = configureStore.getState().settings.appSettings;
		if (type === 'error' && isMaintenanceRunning(appSettings?.maintenance_start, appSettings?.maintenance_end, new Date())) {
			return;
		}
		let backgroundColor;

		switch (type) {
			case 'success':
				backgroundColor = 'green';
				break;
			case 'error':
				backgroundColor = 'red';
				break;
			default:
				backgroundColor = 'gray';
		}

		Toast.show(message, {
			duration: Toast.durations.LONG,
			position: Toast.positions.TOP,
			shadow: true,
			animation: true,
			hideOnPress: true,
			delay: 0,
			backgroundColor,
			textColor: 'white',
			containerStyle: { padding: 15, zIndex: 999999999999 },
			textStyle: { fontSize: 16 },
		});
	}, []);

	return showToast;
};

export default useToast;
