
export class TimerHelper {

    constructor(name, total_count, print_every_x_count) {
        this.name = name;
        this.total_count = total_count;
        this.startTime = undefined;
        this.lastTime = undefined;
        this.print_every_x_count = print_every_x_count || 100;
    }

    start() {
        this.startTime = this.private_getNow();
        this.lastTime = this.startTime;
    }

    private_getNow(){
       let date = new Date();
       return date.getTime();
    }

    calcEstimatedFinishedDate(current_count) {
        //console.log("calcEstimatedFinishedDate: current_count: "+current_count)
        let timeSpent = (this.private_getNow() - this.startTime) / 1000; // Time spent in seconds
        //console.log("timeSpent: "+timeSpent);
        let averageTimePerTransaction = timeSpent / current_count;
        //console.log("averageTimePerTransaction: "+averageTimePerTransaction)
        let estimatedTotalTime = averageTimePerTransaction * this.total_count;
        //console.log("estimatedTotalTime: "+estimatedTotalTime);
        let estimatedCompletionTime = new Date(this.private_getNow() + (estimatedTotalTime - timeSpent) * 1000);
        //console.log("estimatedCompletionTime: "+estimatedCompletionTime);
        return estimatedCompletionTime;
    }

    formatSecondsIntoHHMMSS(remainingTime){
        // Convert remaining time to HH:MM:SS format
        let hours = Math.floor(remainingTime / 3600);
        let minutes = Math.floor((remainingTime % 3600) / 60);
        let seconds = Math.floor(remainingTime % 60);

        let remainingTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        return remainingTimeString;
    }

    printEstimatedTime(current_count) {
        if (this.startTime === undefined) {
            console.log("Timer not started.");
            return;
        }
        if(current_count===0){
            return; // skip division by 0
        }
        if(current_count % this.print_every_x_count!==0){
            // skipping since to much calculation
            return;
        }

        let now = this.private_getNow()



        let remainingTime = (this.calcEstimatedFinishedDate(current_count) - now) / 1000; // Remaining time in seconds
        let remainingTimeString = this.formatSecondsIntoHHMMSS(remainingTime);
        let estimatedCompletionTimeString = this.calcEstimatedFinishedDate(current_count).toLocaleTimeString();

        console.log(`Estimated remaining time for ${this.name}: ${remainingTimeString}, probably finished at: ${estimatedCompletionTimeString} - `+current_count+" / "+this.total_count);

        // print how many HH:MM:SS between now and this.lastTime divided by this.print_every_x_count to print the average
        // Calculate average time per count since last print
        let timeSinceLastPrint = (now - this.lastTime) / 1000; // Time in seconds
        let averageTimePerCount = timeSinceLastPrint / this.print_every_x_count;
        console.log("Average time per action: "+this.formatSecondsIntoHHMMSS(averageTimePerCount))

        this.lastTime = now;

    }
}
