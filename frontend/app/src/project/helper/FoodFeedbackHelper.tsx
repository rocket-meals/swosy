export class FoodFeedbackHelper {

    static getDate(feedback){
        let date = feedback?.date_updated || feedback?.date_created
        if(typeof date==="string"){
            date = new Date(date);
        }
        return date;
    }

    static getRating(feedback){
        return feedback?.rating;
    }

}
