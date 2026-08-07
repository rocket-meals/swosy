// Cumulative patch counter for repo-depkit-common-ui.
//
// Increment by at least 1 on EVERY change to this package. Consuming apps add
// this value into their getVersionPatch() sum (local + common + common-ui),
// so a bump here automatically raises the visible patch version of every app
// without touching each app's config.ts. Never decrease or reset this value -
// the summed patch version must stay monotonically increasing.
//
// IMPORTANT: an app's config.ts must import this via the subpath
// 'repo-depkit-common-ui/src/VersionPatch' - NOT via the package index, which
// pulls React Native components into the Node-side expo config evaluation.
export function getCommonUiVersionPatch(): number {
	return 1;
}
