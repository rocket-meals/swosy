/**
 * BackendUsageEventNames.ts – names of the usage events the backend writes itself (see `BackendUsageEventHelper`).
 *
 * Kept in a file without Node imports: the module page "Live-Puls" reads them in the browser, and
 * `BackendUsageEventHelper` pulls in Redis (`ioredis`), whose Node built-ins (`assert`, `net`, `tls`, …)
 * would break loading every app extension of this bundle. The names themselves come from
 * `repo-depkit-common` (`AppUsageEventNames`, also free of imports), shared with the apps.
 */

import { AppUsageEventNames, AppUsageEventTypes } from 'repo-depkit-common/src/AppUsageEventNames';

/** `session_id` prefix of every event written by the backend. */
export const BACKEND_USAGE_SESSION_PREFIX = 'Backend_';

export const BACKEND_USAGE_EVENT_TYPE_FOOD = AppUsageEventTypes.FOOD;
export const BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED = AppUsageEventNames.FOOD_DETAILS_OPENED;
export const BACKEND_USAGE_EVENT_TYPE_ACCOUNT = AppUsageEventTypes.ACCOUNT;
export const BACKEND_USAGE_EVENT_NAME_UNIVERSITY_STATUS_CONFIRMED = AppUsageEventNames.UNIVERSITY_STATUS_CONFIRMED;
