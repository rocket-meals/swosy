import { getCustomerConfig } from '@/config';

const customerConfig = getCustomerConfig();

class ServerConfiguration {
	private static serverUrl: string = customerConfig.server_url;

	static get ServerUrl(): string {
		return this.serverUrl;
	}

	static setServerUrl(url: string) {
		this.serverUrl = url;
	}
}

export default ServerConfiguration;
