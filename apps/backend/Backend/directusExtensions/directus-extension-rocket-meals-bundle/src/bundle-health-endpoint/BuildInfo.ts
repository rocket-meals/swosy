/**
 * BuildInfo.ts – the git commit this bundle was built from, filled in at build time.
 *
 * `extension.config.mjs` replaces the two placeholders below with the last commit that changed
 * anything the backend build reads (bundle sources, `packages/common`, `packages/common-ui`,
 * `yarn.lock`, not the `dist`). That commit stays the same as long as the build input stays the
 * same, so the `dist` does not change on every push to `master`.
 *
 * Without the build (tests, typecheck) the placeholders stay and the values are `null`.
 */

const PLACEHOLDER_PREFIX = '__ROCKET_MEALS_BUILD_';

const SOURCE_COMMIT: string = '__ROCKET_MEALS_BUILD_SOURCE_COMMIT__';
const SOURCE_COMMIT_DATE: string = '__ROCKET_MEALS_BUILD_SOURCE_COMMIT_DATE__';

export class BuildInfo {
  /** The full commit hash, `null` when the bundle was not built by `directus-extension build`. */
  static readonly sourceCommit: string | null = BuildInfo.valueOrNull(SOURCE_COMMIT);
  /** The commit date in ISO 8601, `null` when unknown. */
  static readonly sourceCommitDate: string | null = BuildInfo.valueOrNull(SOURCE_COMMIT_DATE);

  static valueOrNull(value: string): string | null {
    return value.length === 0 || value.startsWith(PLACEHOLDER_PREFIX) ? null : value;
  }
}
