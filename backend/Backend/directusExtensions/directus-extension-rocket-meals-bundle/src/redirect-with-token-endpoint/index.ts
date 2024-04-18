import { defineEndpoint } from '@directus/extensions-sdk';

export default defineEndpoint({
	id: 'redirect-with-token', // this will be the URL at which this endpoint is accessible
	handler: (router) => {
		router.get('/', (req, res) => {
			const refresh_token = req.cookies.directus_refresh_token;
			const redirect = req.query.redirect;
			const redirectURL = redirect + refresh_token;
			//TODO: check if redirect is in listOfAllowedRedirects
			//https://github.com/directus/directus/discussions/8867#discussioncomment-1977411
			res.redirect(redirectURL);
		});
	}
});