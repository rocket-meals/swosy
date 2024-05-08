const DEFAULT_SERVER_URL = 'https://rocket-meals.de/demo/api';
const LOCALHOST = 'http://127.0.0.1/rocket-meals/api';
const isDev = false;

export default {
	ServerUrl: isDev ? LOCALHOST : DEFAULT_SERVER_URL,
};
