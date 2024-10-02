// small jest test
import {describe, it} from '@jest/globals';
import {CanteenFoodFeedbackReportSchedules} from "../../databaseTypes/types";
import {DateHelper} from "../../helpers/DateHelper";
import {ReportSchedule} from "../ReportSchedule";
import {FoodofferDateType} from "../../food-sync-hook/FoodParserInterface";

describe("TestFoodFeedbackReportScheduleGetReferenceDate Test", () => {

    it("ReferenceDate on same Date", async () => {
        const sendReportAtHour = 6;
        const sendReportAtMinute = 0;
        const sendReportAtHhMmPadded = `${sendReportAtHour.toString().padStart(2, '0')}:${sendReportAtMinute.toString().padStart(2, '0')}`;
        let recipientEntry: Partial<CanteenFoodFeedbackReportSchedules> = {
            send_report_at_hh_mm: sendReportAtHhMmPadded,
            foodoffers_days_offset: 0,
            foodoffers_days_limit: 7,
            send_on_mondays: true,
            send_on_tuesdays: true,
            send_on_wednesdays: true,
            send_on_thursdays: true,
            send_on_fridays: true,
            send_on_saturdays: true,
            send_on_sundays: true,
        }

        const now_simulated = DateHelper.getDate({
            year: 2024,
            month: 7,
            day: 1,
            hours: 12,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        });

        const expectedGenerateForDate = DateHelper.getDate({
            year: 2024,
            month: 7,
            day: 1,
            hours: sendReportAtHour,
            minutes: sendReportAtMinute,
            seconds: 0,
            milliseconds: 0
        });
        const expectedGenerateForDateOnly: FoodofferDateType = DateHelper.getFoodofferDateTypeFromDate(expectedGenerateForDate);

        // we simulate as if the report is due now
        const generateForDate = ReportSchedule.getReferenceDate(recipientEntry, now_simulated);
        const generateForDateOnly: FoodofferDateType = DateHelper.getFoodofferDateTypeFromDate(generateForDate);

        expect(generateForDateOnly).toEqual(expectedGenerateForDateOnly);
    });

    it("ReferenceDate for an offset", async () => {
        const sendReportAtHour = 6;
        const sendReportAtMinute = 0;
        const sendReportAtHhMmPadded = `${sendReportAtHour.toString().padStart(2, '0')}:${sendReportAtMinute.toString().padStart(2, '0')}`;
        let startDay = 1; // 1st of July is a Monday
        let offset = 3; // 3 days offset
        let recipientEntry: Partial<CanteenFoodFeedbackReportSchedules> = {
            send_report_at_hh_mm: sendReportAtHhMmPadded,
            foodoffers_days_offset: offset,
            foodoffers_days_limit: 7,
            send_on_mondays: true,
            send_on_tuesdays: true,
            send_on_wednesdays: true,
            send_on_thursdays: true,
            send_on_fridays: true,
            send_on_saturdays: true,
            send_on_sundays: true,
        }

        const now_simulated = DateHelper.getDate({
            year: 2024,
            month: 7,
            day: startDay,
            hours: 12,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        });

        const expectedGenerateForDate = DateHelper.getDate({
            year: 2024,
            month: 7,
            day: startDay + offset,
            hours: sendReportAtHour,
            minutes: sendReportAtMinute,
            seconds: 0,
            milliseconds: 0
        });
        const expectedGenerateForDateOnly: FoodofferDateType = DateHelper.getFoodofferDateTypeFromDate(expectedGenerateForDate);
        //console.log("expectedGenerateForDateOnly", expectedGenerateForDateOnly);

        // we simulate as if the report is due now
        const generateForDate = ReportSchedule.getReferenceDate(recipientEntry, now_simulated);
        const generateForDateOnly: FoodofferDateType = DateHelper.getFoodofferDateTypeFromDate(generateForDate);
        //console.log("generateForDateOnly", generateForDateOnly);

        expect(generateForDateOnly).toEqual(expectedGenerateForDateOnly);
    });


});