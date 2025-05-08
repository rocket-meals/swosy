import {getCustomerConfig} from "@/app.config";
const customerConfig = getCustomerConfig();

export default {
	ServerUrl: customerConfig.server_url,
};
