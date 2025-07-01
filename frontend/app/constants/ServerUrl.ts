import { getCustomerConfig } from "@/config";
const customerConfig = getCustomerConfig();

export default {
	ServerUrl: customerConfig.server_url,
};
