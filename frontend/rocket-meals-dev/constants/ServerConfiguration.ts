const DEFAULT_SERVER_URL = 'https://test.rocket-meals.de/rocket-meals/api';
const LOCALHOST = 'http://127.0.0.1/rocket-meals/api';
const isDev = false;

export default {
	ServerUrl: isDev ? LOCALHOST : DEFAULT_SERVER_URL,
};
