// Cumulative patch counter for repo-depkit-common.
//
// Increment by at least 1 on EVERY change to this package. Consuming apps add
// this value into their getVersionPatch() sum (local + common + common-ui),
// so a bump here automatically raises the visible patch version of every app
// without touching each app's config.ts. Never decrease or reset this value -
// the summed patch version must stay monotonically increasing.
export function getCommonVersionPatch(): number {
	return 1;
}
