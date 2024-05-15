import {defineEndpoint} from '@directus/extensions-sdk';
import ms from 'ms';
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";

const TABLENAME_FLOWHOOKS = CollectionNames.APP_SETTINGS

const SCHEDULE_NAME = "redirect_with_token";

// TO Test this Endpoint:
// 1. Login with a user in the Directus Admin UI
// 2. Go to the URL: http://127.0.0.1/rocket-meals/api/redirect-with-token?redirect=http://localhost:8081/login?directus_refresh_token=
// Where http://127.0.0.1/rocket-meals/api is the URL of the Directus API
export default defineEndpoint({
	id: 'redirect-with-token', // this will be the URL at which this endpoint is accessible
	handler: (router, {
		services,
		database,
		env,
		getSchema,
		logger
	}) => {


		router.get('/', async (req, res) => {
			let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(SCHEDULE_NAME,getSchema);
			if (!allTablesExist) {
				return;
			}
			//console.log("#################################")
			//console.log("Redirect with token endpoint: settings")
			let redirectUrlIsValid = true;

			const redirect = req.query.redirect;

			//let settings = await database(TABLENAME_FLOWHOOKS).first();
			//TODO: check if redirect is in listOfAllowedRedirects

			if(!redirectUrlIsValid){
				res.status(400).send("Invalid redirect URL");
				return;
			}

			//console.log("Cookies")
			//console.log(JSON.stringify(req.cookies, null, 2))

			const directus_refresh_token = req.cookies.directus_refresh_token;

			if(!!directus_refresh_token){ // this means the auth provider is using "cookie" mode.
				//console.log("directus_refresh_token found");

				const redirectURL = redirect + directus_refresh_token;
				//console.log("Redirect with token endpoint: redirectURL: " + redirectURL)
				res.redirect(redirectURL);
				return;
			}

			const directus_session_token = req.cookies.directus_session_token;
			if(!!directus_session_token) { // this means the auth provider is using "session" mode.
				// we need to obtain the directus_refresh_token from the directus_session_token
				//console.log("Redirect with token endpoint: directus_session_token: " + directus_session_token)
				const accountability = req?.accountability;
				const userId = req?.accountability?.user;
				//console.log("Redirect with token endpoint: userId: " + userId)
				if(!userId){
					res.status(400).send("No user found");
					return;
				}

				const knex = database;

				/**
				 * Start of copy: https://github.com/directus/directus/blob/main/api/src/services/authentication.ts Login
				 */

				const { nanoid } = await import('nanoid');

				const refreshToken = nanoid(64);
				const msRefreshTokenTTL: number = ms(String(env['REFRESH_TOKEN_TTL'])) || 0;
				const refreshTokenExpiration = new Date(Date.now() + msRefreshTokenTTL);

				await knex('directus_sessions').insert({
					token: refreshToken,
					user: userId,
					expires: refreshTokenExpiration,
					ip: accountability?.ip,
					user_agent: accountability?.userAgent,
					origin: accountability?.origin,
				});

				await knex('directus_sessions').delete().where('expires', '<', new Date());

				// End of copy

				const redirectURL = redirect + refreshToken;
				//console.log("Redirect with token endpoint: redirectURL: " + redirectURL)
				res.redirect(redirectURL);
				return;
			}

			// no token found
			res.status(400).send("No token found");
		});
	}
});