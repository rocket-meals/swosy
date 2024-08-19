import {FoodofferDateType} from "../food-sync-hook/FoodParserInterface";

export class DateHelper {

    static getHumanReadableDate(date: Date, includeWeekdayName: boolean): string {
        const numericString = date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const weekdayName = date.toLocaleDateString('de-DE', {weekday: 'long'});
        let finalString = numericString;
        if (includeWeekdayName) {
            finalString += ` (${weekdayName})`;
        }
        return finalString;
    }

    static getFoodofferDateTypeFromDate(date: Date): FoodofferDateType {
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        };
    }

    static foodofferDateTypeToString(date: FoodofferDateType){
        // 2024-08-14
        const year = date.year
        const month = String(date.month).padStart(2, '0');
        const day = String(date.day).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Formats a date to ISO 8601 without timezone
     * @param date
     */
    static formatDateToIso8601WithoutTimezone(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = '00';
        const minutes = '00';
        const seconds = '00';

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
}
