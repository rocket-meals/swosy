import { defineEndpoint } from '@directus/extensions-sdk';
import Redis from 'ioredis';
import ms from 'ms';
import crypto from 'crypto';
import {Knex} from "knex"; // Use Node.js crypto module for secure comparisons

const env = process.env;
const PUBLIC_URL = env.PUBLIC_URL || ''; // e.g. http://rocket-meals.de/rocket-meals/api or empty string

function getUrlToProviderLogin(providerName: string, redirectURL: string) {
	return `${PUBLIC_URL}/auth/login/${providerName}?redirect=${redirectURL}`;
}

// https://www.rfc-editor.org/rfc/rfc7636

// Initialize Redis-based Kv storage
const redis = new Redis(env.REDIS); // Assumes env.REDIS is set to "redis://rocket-meals-cache:6379"

const redis_prefix_code_challenge = "pkce_code_challenge_";
const redis_prefix_save_session = "pkce_save_session_"

async function setRedisKvWithDefaultTtl(key: string, value: string){
	//console.log("setRedisKvWithDefaultTtl: key: "+key)
	//console.log("value: "+value)
	//console.log("-----")
	const duration = 300; // max Time To Live (TTL) to 300s = 5min
	await redis.set(key, value, 'EX', duration);
}

async function getRedisKv(key: string){
	return await redis.get(key);
}

type AuthorizationCodeAndRedirectType = {
	authorization_code: string,
	redirect_url: string
}

async function setStateInformation(state: string, authCodeAndRedirect: AuthorizationCodeAndRedirectType){
	//console.log("setStateInformation: state: "+state);
	//console.log(JSON.stringify(authCodeAndRedirect, null, 2))
	//console.log("-----")
	await setRedisKvWithDefaultTtl(redis_prefix_save_session+state, JSON.stringify(authCodeAndRedirect))
}

async function getStateInformation(state: string): Promise<AuthorizationCodeAndRedirectType | null> {
	let savedKey = await redis.get(redis_prefix_save_session+state);
	//console.log("getStateInformation: state: "+state);
	//console.log(savedKey)
	if(!!savedKey){
		let obj = JSON.parse(savedKey) as AuthorizationCodeAndRedirectType
		//console.log(JSON.stringify(obj, null, 2))
		//console.log("-----")
		return obj;
	}
	return null;
}

async function clearStateInformation(state: string){
	await redis.del(redis_prefix_save_session+state);
}

type CodeChallengeRedisEntryType = {
	code_challenge: string,
	code_challenge_method: string,
	directus_refresh_token: string | null
	directus_session_token: string | null
}

async function generateRefreshToken(directus_session_token: string, accountability: any, userId: string, database: Knex<any, any[]>){
	// we need to obtain the directus_refresh_token from the directus_session_token
	//console.log("Redirect with token endpoint: directus_session_token: " + directus_session_token)
	//console.log("Redirect with token endpoint: userId: " + userId)
	if(!userId){
		throw new Error("No user Id given")
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
	return refreshToken;
}

async function associateCodeChallengeWithCode(authorization_code: string, code_challenge: CodeChallengeRedisEntryType){
	//console.log("associateCodeChallengeWithCode: state: "+authorization_code);
	//console.log(JSON.stringify(code_challenge, null, 2))
	//console.log("-----")
	await setRedisKvWithDefaultTtl(redis_prefix_code_challenge+authorization_code, JSON.stringify(code_challenge))
}

async function getAssociatedCodeChallengeFromCode(authorization_code: string): Promise<CodeChallengeRedisEntryType | null> {
	let savedKey = await redis.get(redis_prefix_code_challenge+authorization_code);
	//console.log("getAssociatedCodeChallengeFromCode: authorization_code: "+authorization_code);
	//console.log(savedKey)
	if(!!savedKey){
		let obj = JSON.parse(savedKey) as CodeChallengeRedisEntryType
		//console.log(JSON.stringify(obj, null, 2))
		return obj;
	}
	return null;
}

async function clearAssociatedCodeChallengeFromCode(authorization_code: string){
	await redis.del(redis_prefix_code_challenge+authorization_code);
}

const EndpointTopName = "proof-key-code-exchange";

//function isRedirectUrlAllowed()

export default defineEndpoint({
	id: EndpointTopName,
	handler: (router, apiContext) => {

		const {
			services,
			database,
			getSchema,
			env,
			logger
		} = apiContext;

		// 4.1.  Client Creates a Code Verifier - Mobile App
		// 4.2.  Client Creates the Code Challenge - Mobile App

		// 4.3.  Client Sends the Code Challenge with the Authorization Request - Directus Extension
		router.post('/authorize', async (req, res) => {
			//console.log("Authorize Called")
			const { provider, code_challenge, redirect_url, code_challenge_method } = req.body;
			//console.log(req.body);

			//   The client sends the code challenge as part of the OAuth 2.0
			//    Authorization Request (Section 4.1.1 of [RFC6749]) using the
			//    following additional parameters:
			//
			//    code_challenge
			//       REQUIRED.  Code challenge.
			const code_challenge_app = code_challenge;
			if (!code_challenge_app) {
				// 4.4.1.  Error Response
				//
				//    If the server requires Proof Key for Code Exchange (PKCE) by OAuth
				//    public clients and the client does not send the "code_challenge" in
				//    the request, the authorization endpoint MUST return the authorization
				//    error response with the "error" value set to "invalid_request".  The
				//    "error_description" or the response of "error_uri" SHOULD explain the
				//    nature of error, e.g., code challenge required.

				return res.status(400).json({ error: 'Missing required parameters code_challenge.' });
			}

			//
			//    code_challenge_method
			//       OPTIONAL, defaults to "plain" if not present in the request.  Code
			//       verifier transformation method is "S256" or "plain".
			let code_challenge_method_app = code_challenge_method || "plain";

			if (!(code_challenge_method_app==="S256" || code_challenge_method_app ==="plain")) {
				// Clients are
				//    permitted to use "plain" only if they cannot support "S256" for some
				//    technical reason and know via out-of-band configuration that the
				//    server supports "plain".
				return res.status(400).json({ error: 'Code challenge method is either "S256" or "plain"'});
			}

			if (!provider) {
				return res.status(400).json({ error: 'Missing required parameter provider. Has to be an auth provider configured in directus.'});
			}
			const configured_auth_providers_raw = env?.["AUTH_PROVIDERS"]
			//console.log("configured_auth_providers_raw:")
			//console.log(configured_auth_providers_raw)
			//console.log("type of: "+typeof configured_auth_providers_raw);
			let configured_auth_providers: string[] = [];
			if(Array.isArray(configured_auth_providers_raw)){
				configured_auth_providers = configured_auth_providers_raw;
			} else {
				configured_auth_providers = configured_auth_providers_raw?.split(",");
			}
			//console.log("configured_auth_providers")
			//console.log(configured_auth_providers);


			if(!configured_auth_providers.includes(provider)){
				return res.status(400).json({ error: `Provider ${provider} not listed in AUTH_PROVIDERS`});
			}


			if (!redirect_url) {
				return res.status(400).json({ error: 'Missing required parameter redirect_url'});
			}
			// Redirect url required
			// allowed redirects (urls) are in env variables: AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST - https://docs.directus.io/self-hosted/sso.html#seamless-sso
			const providerCaps = provider.toUpperCase()
			let allowed_redirect_urls_raw = env?.[`AUTH_${providerCaps}_REDIRECT_ALLOW_LIST`]
			//console.log("allowed_redirect_urls_raw")
			//console.log(allowed_redirect_urls_raw)
			//console.log("type of: "+typeof allowed_redirect_urls_raw);
			let allowed_redirect_urls: string[] = allowed_redirect_urls_raw?.split(",") || [];
			//console.log("allowed_redirect_urls")
			//console.log(allowed_redirect_urls)
			if(!allowed_redirect_urls.includes(redirect_url)){
				return res.status(400).json({ error: `Redirect url ${redirect_url} not configured for provider ${provider}. Please add them to AUTH_${providerCaps}_REDIRECT_ALLOW_LIST`});
			}


			// Store the code_challenge_app with the state as key in Redis
			// When the server issues the authorization code in the authorization
			//    response, it MUST associate the "code_challenge" and
			//    "code_challenge_method" values with the authorization code so it can
			//    be verified later.
			const authorization_code = crypto.randomBytes(16).toString('hex');
			// Typically, the "code_challenge" and "code_challenge_method" values
			//    are stored in encrypted form in the "code" itself but could
			//    alternatively be stored on the server associated with the code.  The
			//    server MUST NOT include the "code_challenge" value in client requests
			//    in a form that other entities can extract.
			await associateCodeChallengeWithCode(authorization_code, {
				code_challenge: code_challenge_app,
				code_challenge_method: code_challenge_method_app,
				directus_session_token: null,
				directus_refresh_token: null, // currently we have not saved the directus_refresh_token. After the OAuth2 Flow we will add it there
			});


			// We will now use directus implemented OAuth2 Flow and just save the verified user then, so that the directus_refresh_token can be received when passing the authorization_code and code_verifier
			const state = crypto.randomBytes(16).toString('hex'); // create a state, so that we

			await setStateInformation(state, {
				authorization_code: authorization_code,
				redirect_url: redirect_url
			});

			const redirectUrlToSaveSession = `${PUBLIC_URL}/${EndpointTopName}/save-session?state=${state}`;

			const urlToProviderLogin = getUrlToProviderLogin(provider, redirectUrlToSaveSession);
			res.json({
				urlToProviderLogin: urlToProviderLogin
			})
		});

		// Route to save the session using state after successful OAuth2 redirect
		router.get('/save-session', async (req, res) => {
			//console.log("SAVE SESSION")
			//console.log(req.cookies);
			const directus_session_token = req.cookies.directus_session_token;

			const { state } = req.query;

			if (!state) {
				return res.status(400).json({ error: 'Missing required parameter state.' });
			}

			if(!directus_session_token){
				return res.status(400).json({ error: 'Missing directus_session_token in cookies.' });
			}

			let saved_authorization_code_and_redirect = await getStateInformation(state.toString());

			if(!saved_authorization_code_and_redirect){
				return res.status(400).json({ error: 'No information found for state. Might be too long' });
			}
			const redirect_url = saved_authorization_code_and_redirect.redirect_url
			const authorization_code = saved_authorization_code_and_redirect.authorization_code

			if(!authorization_code || !redirect_url){
				return res.status(400).json({ error: 'No information found for state. Might be too long' });
			}

			await clearStateInformation(state.toString()); // clear state information, as we got all the information and they exist.

			const storedCodeChallenge = await getAssociatedCodeChallengeFromCode(authorization_code);

			if(!storedCodeChallenge || !storedCodeChallenge.code_challenge_method || !storedCodeChallenge.code_challenge){
				return res.status(400).json({ error: 'No information found for saved authorization code. Might be too long' });
			}

			const accountability = req?.accountability;
			const userId = req?.accountability?.user;

			if(!accountability || !userId){
				return res.status(400).json({ error: 'No accountability or userId found.' });
			}

			let directus_refresh_token = await generateRefreshToken(directus_session_token, accountability, userId, database);


			// Save the directus refresh token in the code challenge
			await associateCodeChallengeWithCode(saved_authorization_code_and_redirect.authorization_code, {
				code_challenge: storedCodeChallenge?.code_challenge,
				code_challenge_method: storedCodeChallenge?.code_challenge_method,
				directus_refresh_token: directus_refresh_token,
				directus_session_token: directus_session_token, // currently we have not saved the directus_refresh_token. After the OAuth2 Flow we will add it there
			});

			// now redirect the user to the previously verified redirect url
			const redirect_url_with_authorization_code = redirect_url+"?code="+authorization_code;
			res.redirect(redirect_url_with_authorization_code) // The user in the native app (using Auth WebBrowser) or SPA, will get the authorization code
		});

		// 4.5.  Client Sends the Authorization Code and the Code Verifier to the Token Endpoint
		router.post('/token', async (req, res) => {
			const { code, code_verifier } = req.body;

			const authorization_code = code;

			//    code_verifier
			//       REQUIRED.  Code verifier

			const code_verifier_app = code_verifier;
			if (!code_verifier_app) {
				return res.status(400).json({ error: 'Missing required parameter: code_verifier.' });
			}

			const storedCodeChallenge = await getAssociatedCodeChallengeFromCode(authorization_code);


			try {
				if (!storedCodeChallenge) {
					return res.status(400).json({ error: 'Invalid or expired state.' });
				}

				// Validate the code_verifier_app against the stored code_challenge_app
				let generatedChallenge = crypto
					.createHash('sha256')
					.update(code_verifier_app)
					.digest('base64url');

				if(storedCodeChallenge.code_challenge_method==="plain"){
					// 4.6
					// If the "code_challenge_method" from Section 4.3 was "plain", they are
					//    compared directly, i.e.:
					//
					//    code_verifier == code_challenge.
					generatedChallenge = code_verifier_app;
				}

				// Secure comparison of the code challenge
				if (!crypto.timingSafeEqual(Buffer.from(generatedChallenge), Buffer.from(storedCodeChallenge.code_challenge))) {
					return res.status(400).json({ error: 'Invalid code verifier.' });
				}

				const directus_session_token = storedCodeChallenge.directus_session_token;
				if (!directus_session_token) {
					return res.status(400).json({ error: 'Session not found or expired. No directus_refresh_token found' });
				}

				const directus_refresh_token = storedCodeChallenge.directus_refresh_token;

				// If valid, clear the stored state and session
				await clearAssociatedCodeChallengeFromCode(authorization_code);

				// Return the session or token associated with the validated request
				res.json({
					message: 'Validation successful',
					directus_refresh_token: directus_refresh_token,
					//directus_session_token: directus_session_token // https://github.com/directus/directus/issues/21757#issuecomment-1992539944  https://github.com/directus/directus/issues/21757
				});
			} catch (error: any) {
				//console.error('Error during validation:', error);
				res.status(500).json({ error: 'Internal server error.', message: error.toString() });
			}
		});
	},
});
