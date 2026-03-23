/**
 * Custom Jest resolver for the Geonexia app.
 *
 * Extends the React Native jest resolver to also strip the `exports` field
 * from the `expo-modules-core` package.  This is required because jest-expo's
 * setup file accesses sub-paths such as `expo-modules-core/src/Refs` that are
 * not listed in the package's `exports` map, which causes resolution failures
 * under Node.js 24's strict package-exports mode.
 */

'use strict';

const rnResolver = require('react-native/jest/resolver.js');

module.exports = (modulePath, options) => {
    const originalPackageFilter = options.packageFilter;

    return rnResolver(modulePath, {
        ...options,
        packageFilter: (pkg) => {
            const filtered = originalPackageFilter ? originalPackageFilter(pkg) : pkg;
            if (filtered.name === 'expo-modules-core') {
                delete filtered.exports;
            }
            return filtered;
        },
    });
};
