export class RandomHelper{

    //https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
    static randomIntFromInterval(min: number, max: number) { // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    static getRandomId(){
        return RandomHelper.randomIntFromInterval(1, 100000)
    }

    static getRandomPrice(){
        return RandomHelper.randomIntFromInterval(1, 3)+","+RandomHelper.randomIntFromInterval(1, 9)+"0€"
    }

}