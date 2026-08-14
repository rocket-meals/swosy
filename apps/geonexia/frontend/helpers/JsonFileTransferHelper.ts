// The implementation moved to repo-depkit-common-ui (src/helpers/JsonFileTransferHelper)
// so other apps in the monorepo (e.g. score-tracker's database backup) can reuse it.
// This re-export keeps geonexia's existing import paths working.
export { saveJsonToFile, pickJsonFromFile, buildJsonExportFilename } from 'repo-depkit-common-ui';
export type { SaveJsonResult } from 'repo-depkit-common-ui';
