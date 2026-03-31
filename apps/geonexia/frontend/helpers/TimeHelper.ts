export class TimeHelper {
	/**
	 * Formats a duration given in seconds as "XXm:YYs", e.g. "5m:30s" or "65m:09s".
	 */
	static formatDuration(totalSeconds: number): string {
		const totalMinutes = Math.floor(totalSeconds / 60);
		const s = Math.floor(totalSeconds % 60);
		return `${totalMinutes}m:${String(s).padStart(2, '0')}s`;
	}
}
