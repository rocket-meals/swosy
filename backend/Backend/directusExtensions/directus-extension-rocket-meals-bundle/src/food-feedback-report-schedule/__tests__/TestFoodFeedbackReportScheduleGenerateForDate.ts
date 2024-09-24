// small jest test
import {describe, it} from '@jest/globals';
import {CanteenFoodFeedbackReportSchedules} from "../../databaseTypes/types";
import {DateHelper} from "../../helpers/DateHelper";
import {ReportSchedule} from "../ReportSchedule";

describe("TestFoodFeedbackReportScheduleGenerateForDate Test", () => {

    it("Generate for date on same Date", async () => {
        const sendReportAtHour = 6;
        const sendReportAtMinute = 0;
        const sendReportAtHhMmPadded = `${sendReportAtHour.toString().padStart(2, '0')}:${sendReportAtMinute.toString().padStart(2, '0')}`;
        let recipientEntry: Partial<CanteenFoodFeedbackReportSchedules> = {
            send_report_at_hh_mm: sendReportAtHhMmPadded,
            send_amount_days_before_offer_date: 0,
            send_for_mondays: true,
            send_for_tuesdays: true,
            send_for_wednesdays: true,
            send_for_thursdays: true,
            send_for_fridays: true,
            send_for_saturdays: true,
            send_for_sundays: true,
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
        const expectedGenerateForDateIso = expectedGenerateForDate.toISOString();

        // we simulate as if the report is due now
        const generateForDate = ReportSchedule.getWhenTheNextReportIsDueTheDateForWhichTheReportShouldBeGeneratedDateOrNull(recipientEntry, now_simulated);
        const generateForDateIso = generateForDate?.toISOString();

        expect(generateForDateIso).toBe(expectedGenerateForDateIso);
    });

    it("Generate for date on next day", async () => {
        const sendReportAtHour = 6;
        const sendReportAtMinute = 0;
        const sendReportAtHhMmPadded = `${sendReportAtHour.toString().padStart(2, '0')}:${sendReportAtMinute.toString().padStart(2, '0')}`;
        let recipientEntry: Partial<CanteenFoodFeedbackReportSchedules> = {
            send_report_at_hh_mm: sendReportAtHhMmPadded,
            send_amount_days_before_offer_date: 1,
            send_for_mondays: true,
            send_for_tuesdays: true,
            send_for_wednesdays: true,
            send_for_thursdays: true,
            send_for_fridays: true,
            send_for_saturdays: true,
            send_for_sundays: true,
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
            day: 2,
            hours: sendReportAtHour,
            minutes: sendReportAtMinute,
            seconds: 0,
            milliseconds: 0
        });
        const expectedGenerateForDateIso = expectedGenerateForDate.toISOString();

        // we simulate as if the report is due now
        const generateForDate = ReportSchedule.getWhenTheNextReportIsDueTheDateForWhichTheReportShouldBeGeneratedDateOrNull(recipientEntry, now_simulated);
        const generateForDateIso = generateForDate?.toISOString();

        expect(generateForDateIso).toBe(expectedGenerateForDateIso);
    });


});