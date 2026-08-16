/**
 * Shape of a Google Cloud service-account key JSON (Cloud Console -> IAM -> service account ->
 * "Create key"). Declared once here because both the backend (Play Developer API reviews) and
 * the store-metadata scripts (Play Console listings) authenticate with the very same key file.
 */
export type GoogleServiceAccountKey = {
	// The three fields that are actually needed to mint an OAuth2 access token. Callers that
	// parse an external key JSON must validate them before handing the key on.
	client_email: string;
	private_key: string;
	token_uri: string;
	// The remaining fields of the downloaded key JSON. Present in practice, but never read,
	// so they stay optional and a hand-written key does not have to carry them.
	type?: string;
	project_id?: string;
	private_key_id?: string;
	client_id?: string;
	auth_uri?: string;
	auth_provider_x509_cert_url?: string;
	client_x509_cert_url?: string;
};

/** Well-known Google OAuth2 token endpoint, used when a key JSON omits `token_uri`. */
export const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
