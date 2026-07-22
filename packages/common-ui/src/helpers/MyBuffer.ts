// Central place for the `Buffer` polyfill: every app imports it from here instead of
// importing 'buffer' directly, so this is the only place that needs the import.
// SonarCloud prefers `node:buffer` over the bare `buffer` specifier, but Metro (the
// React Native/Expo bundler) has no special handling for the `node:` URL scheme -
// `import ... from 'node:buffer'` fails to resolve at build time. See
// docs/SONARCLOUD_MAINTAINABILITY_WORKFLOW.md for the verification against the
// actually-resolved metro-resolver source. Hence the NOSONAR below.
import { Buffer } from 'buffer'; // NOSONAR - Metro has no `node:` scheme support, see comment above

export { Buffer as MyBuffer };
