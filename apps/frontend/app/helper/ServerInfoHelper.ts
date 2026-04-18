import { CustomerConfig, getCustomerConfig } from '@/config';

export class ServerInfoHelper {
	static getServerName(serverInfo: Record<any, any>, customerConfig?: CustomerConfig) {
		let remoteServerName = serverInfo?.info?.project?.project_name;
		let localServerName = (customerConfig ?? getCustomerConfig()).projectName;
		let fallbackName = 'Rocket Meals';

		if (remoteServerName && remoteServerName.length > 0) {
			return remoteServerName;
		} else if (localServerName && localServerName.length > 0) {
			return localServerName;
		} else {
			return fallbackName;
		}
	}
}
