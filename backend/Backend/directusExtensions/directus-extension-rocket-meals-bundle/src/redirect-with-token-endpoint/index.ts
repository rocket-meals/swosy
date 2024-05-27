import {defineEndpoint} from '@directus/extensions-sdk';
import ms from 'ms';
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {AppSettingsService} from "../helpers/ItemsServiceCreator";

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

			if(!!redirect && typeof redirect === "string"){
				//let settings = await database(TABLENAME_FLOWHOOKS).first();
				let appSettingsService = new AppSettingsService(services, database, getSchema);
				let settings = await appSettingsService.getAppSettings();
				let redirect_whitelist = settings?.redirect_whitelist;
				if (!!redirect_whitelist) {
					let foundValidRedirect = false;
					if (redirect_whitelist.length === 0) {
						foundValidRedirect = true; // no whitelist means all redirects are allowed
					}

					const redirectUrl = new URL(redirect);

					for (let i = 0; i < redirect_whitelist.length && !foundValidRedirect; i++) { // iterate over the whitelist as long as we haven't found a valid redirect
						let redirect_whitelist_entry = redirect_whitelist[i];

						// Handle the wildcard "*" as a special case
						if (redirect_whitelist_entry === "*") {
							foundValidRedirect = true;
							break;
						} else {
							const entryUrl = new URL(redirect_whitelist_entry.replace("*", "wildcard"));

							// Check scheme
							if (entryUrl.protocol !== redirectUrl.protocol && entryUrl.protocol !== 'wildcard:') continue;

							// Check hostname
							if (entryUrl.hostname !== redirectUrl.hostname && entryUrl.hostname !== 'wildcard') continue;

							// Check port
							if (entryUrl.port !== redirectUrl.port && entryUrl.port !== 'wildcard') continue;

							// Check path
							const entryPath = entryUrl.pathname.replace('/wildcard', '.*');
							const redirectPath = redirectUrl.pathname;
							const pathRegex = new RegExp(`^${entryPath}$`);
							if (!pathRegex.test(redirectPath)) continue;

							foundValidRedirect = true;
							break;
						}
					}

					redirectUrlIsValid = foundValidRedirect;
				}
			} else {
				redirectUrlIsValid = false; // no redirect URL found
			}



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