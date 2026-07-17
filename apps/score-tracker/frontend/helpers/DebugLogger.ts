import { store } from '../store/store';
import { addDebugLog } from '../store/debugSlice';

/**
 * Appends a timestamped entry to the persisted debug log, but only while debug
 * mode is enabled (Settings -> tap "Version" 5x -> enable Debug Mode). Meant for
 * production issues that can't be reproduced locally (e.g. the avatar QuickStart
 * bug reports): the user turns debug mode on, reproduces the issue, then copies
 * the log from Settings for a bug report - no debugger or dev build required.
 */
export function logDebug(message: string): void {
	if (!store.getState().debug.debugMode) return;
	store.dispatch(addDebugLog(message));
}

let _globalHandlerInstalled = false;

/**
 * Routes uncaught JS exceptions and fatal errors into the debug log while debug
 * mode is on. Production builds have no attached debugger, so an exception during
 * an interaction (e.g. a preset tap) can otherwise fail completely silently -
 * this is often the only way to see that something actually threw.
 */
export function installGlobalDebugErrorHandler(): void {
	if (_globalHandlerInstalled) return;
	_globalHandlerInstalled = true;

	const anyGlobal = globalThis as any;
	const ErrorUtilsRef = anyGlobal.ErrorUtils;
	if (!ErrorUtilsRef?.setGlobalHandler) return;

	const previousHandler = ErrorUtilsRef.getGlobalHandler?.();
	ErrorUtilsRef.setGlobalHandler((error: Error, isFatal?: boolean) => {
		logDebug(`${isFatal ? 'FATAL' : 'ERROR'}: ${error?.message ?? String(error)}`);
		previousHandler?.(error, isFatal);
	});
}
