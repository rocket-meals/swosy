// Module-level flag mirroring whether an activity recording is currently
// running. Set by the record screen and read by code that must not disturb an
// active recording — e.g. the foreground OTA update check, which reloads the
// whole JS bundle and would abort the run.

let _recordingActive = false;

export function setRecordingActive(active: boolean): void {
	_recordingActive = active;
}

export function isRecordingActive(): boolean {
	return _recordingActive;
}
