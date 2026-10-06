/**
 * Routes of the public screens under `app/public/`.
 *
 * These screens need no login - their links are handed out (QR codes, websites, posters) and are
 * listed in the management menu under "public links".
 */
export const PUBLIC_ROUTES = {
	GIVE_FEEDBACK: '/public/give-feedback',
	APP_DOWNLOAD: '/public/app-download',
	APP_DOWNLOAD_MANAGEMENT: '/public/app-download-management',
	MCP_INSTRUCTION: '/public/mcp-instruction',
} as const;

/** Query parameter the public screens read to hide their header (e.g. on a monitor or kiosk). */
export const PUBLIC_FULLSCREEN_PARAM = 'fullscreen';

/** `useLocalSearchParams` may return a string or a string[] depending on the router. */
export function isFullscreenParam(value: string | string[] | undefined): boolean {
	return Array.isArray(value) ? value.includes('true') : value === 'true';
}
