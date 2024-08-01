export class DateHelper {

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
