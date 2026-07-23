import { ScrollViewStyleReset } from 'expo-router/html';
import React, { type PropsWithChildren } from 'react';
import { getCustomerConfig } from '@/config';

// Same base path calculation as experiments.baseUrl in config.ts - the web
// build is served under this path (e.g. /swosy or /rocket-meals/pr-123).
const customerConfig = getCustomerConfig();
const basePath = (customerConfig.baseUrl || '') + (process.env.EXPO_PUBLIC_BASE_URL_SUFFIX || '');

/**
 * Custom HTML shell for the static web export (expo-router). Every page is
 * wrapped with this markup at build time; it only runs in Node.js during
 * `expo export` and never in the browser.
 *
 * On top of the default Expo template this adds a web app manifest link:
 * enables Android/Chrome install prompts and related_applications matching,
 * which powers the installed-app detection (navigator.getInstalledRelatedApps)
 * used by the AppDownloadBanner. The manifest itself is generated per
 * customer in app.config.ts.
 *
 * Deliberately NOT using an apple-itunes-app meta tag here: it is baked into
 * the exported HTML at build time for a single customer and can never react
 * to switching the backend/customer at runtime (see useCustomerConfigModal),
 * so Safari's native Smart App Banner would show the wrong app after a
 * switch, and would additionally stack on top of our own AppDownloadBanner
 * for the build's default customer. iOS installs/opens are handled entirely
 * by AppDownloadBanner instead, which does react to that runtime switch.
 */
export default function Root({ children }: PropsWithChildren) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
				<link rel="manifest" href={`${basePath}/manifest.json`} />

				{/* Link the ScrollView styles on web to mimic native behavior (disables body scrolling). */}
				<ScrollViewStyleReset />

				{/* Keep the root background in sync with the system color scheme to avoid white flashes in dark mode. */}
				<style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
			</head>
			<body>{children}</body>
		</html>
	);
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
