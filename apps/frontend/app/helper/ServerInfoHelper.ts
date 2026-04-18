import { getCustomerConfig } from '@/config';

export class ServerInfoHelper {
	static getServerName(serverInfo: Record<any, any>) {
		let remoteServerName = serverInfo?.info?.project?.project_name;
		let localServerName = getCustomerConfig().projectName;
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
