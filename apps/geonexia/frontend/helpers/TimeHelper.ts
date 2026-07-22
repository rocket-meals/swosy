export class TimeHelper {
	/**
	 * Formats a duration given in seconds as "XXm:YYs" below one hour, e.g. "5m:30s",
	 * and as "HHhMMm" from one hour upward, e.g. "01h05m".
	 */
	static formatDuration(totalSeconds: number): string {
		const totalMinutes = Math.floor(totalSeconds / 60);
		if (totalMinutes >= 60) {
			const h = Math.floor(totalMinutes / 60);
			const m = totalMinutes % 60;
			return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}m`;
		}
		const s = Math.floor(totalSeconds % 60);
		return `${totalMinutes}m:${String(s).padStart(2, '0')}s`;
	}
}
