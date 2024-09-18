export class MyTimer {

    public startTime: number = 0;
    public endTime: number = 0;
    public alias: string;

    constructor(alias?: string) {
        this.alias = alias || "";
        this.resetTimer()
    }

    public resetTimer() {
        this.startTime = 0;
        this.endTime = 0;
    }

    public start() {
        this.startTime = new Date().getTime()
    }

    public stop() {
        this.endTime = new Date().getTime()
    }

    public getElapsedTime() {
        if(this.endTime === 0){
            let now = new Date().getTime();
            return now - this.startTime;
        }

        return this.endTime - this.startTime;
    }

    public printElapsedTime(prefix?: string | null, suffix?: string | null) {
        prefix = prefix ? `${prefix}: ` : "";
        prefix = this.alias ? `${this.alias}: ${prefix}` : prefix;
        suffix = suffix ? `: ${suffix}` : "";
        let elapsed = this.getElapsedTime();
        console.log(prefix+`Elapsed time: ${this.formatTimeToString(elapsed)}`+suffix);
    }

    public getEstimatedTimeRemaining(progress: number, total: number) {
        let remaining = total - progress;
        let estimatedTime = this.getElapsedTime() / progress * remaining;
        return estimatedTime;
    }

    public printEstimatedTimeRemaining(progress: number, total: number, prefix?: string | null, suffix?: string | null) {
        let remaining = total - progress;
        let estimatedTime = this.getEstimatedTimeRemaining(progress, total);
        let estimatedTimeStr = this.formatTimeToString(estimatedTime);
        prefix = prefix ? `${prefix}: ` : "";
        prefix = this.alias ? `${this.alias}: ${prefix}` : prefix;
        suffix = suffix ? `: ${suffix}` : "";
        console.log(prefix+`Estimated time remaining: ${estimatedTimeStr}`+suffix);
    }

    public formatProgressAndTotal(progress: number, total: number) {
        let amountPlaces = total.toString().length;
        let progressStr = progress.toString().padStart(amountPlaces, " ");
        let totalStr = total.toString();
        return `${progressStr}/${totalStr}`;
    }

    public printElapsedTimeAndEstimatedTimeRemaining(progress: number, total: number, prefix?: string | null, suffix?: string | null) {
        const elapsed = this.getElapsedTime();
        const estimatedTime = this.getEstimatedTimeRemaining(progress, total);
        const elapsedStr = this.formatTimeToString(elapsed);
        const estimatedTimeStr = this.formatTimeToString(estimatedTime);
        const formattedProgressAndTotal = this.formatProgressAndTotal(progress, total);
        prefix = prefix ? `${prefix}: ` : "";
        prefix = this.alias ? `${this.alias}: ${prefix}` : prefix;
        suffix = suffix ? `: ${suffix}` : "";
        console.log(prefix+` (${formattedProgressAndTotal})  Elapsed time: ${elapsedStr}, Estimated time remaining: ${estimatedTimeStr}`+suffix);
    }

    public formatTimeToString(duration: number) {
        // print in format: HH:MM:SS.mmm
        let milliseconds = Math.floor(duration % 1000);
        let seconds = Math.floor((duration / 1000) % 60);
        let minutes = Math.floor((duration / (1000 * 60)) % 60);
        let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
        let days = Math.floor((duration / (1000 * 60 * 60 * 24)));

        // pad with zeros
        let daysStr = days.toString().padStart(2, "0");
        let hoursStr = hours.toString().padStart(2, "0");
        let minutesStr = minutes.toString().padStart(2, "0");
        let secondsStr = seconds.toString().padStart(2, "0");
        let millisecondsStr = milliseconds.toString().padStart(3, "0");

        // print in format: HH:MM:SS.mmm
        return `${daysStr}d :${hoursStr}h :${minutesStr}m :${secondsStr}s.${millisecondsStr}`;
    }

}
