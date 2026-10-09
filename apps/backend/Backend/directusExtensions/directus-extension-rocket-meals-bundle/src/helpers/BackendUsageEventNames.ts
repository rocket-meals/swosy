/**
 * BackendUsageEventNames.ts – names of the usage events the backend writes itself (see `BackendUsageEventHelper`).
 *
 * Kept in a file without imports: the module page "Live-Puls" reads them in the browser, and
 * `BackendUsageEventHelper` pulls in Redis (`ioredis`), whose Node built-ins (`assert`, `net`, `tls`, …)
 * would break loading every app extension of this bundle.
 */

/** `session_id` prefix of every event written by the backend. */
export const BACKEND_USAGE_SESSION_PREFIX = 'Backend_';

export const BACKEND_USAGE_EVENT_TYPE_FOOD = 'food';
export const BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED = 'food_details_opened';
