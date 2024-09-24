// small jest test
import {describe, it} from '@jest/globals';
import {CanteenFoodFeedbackReportSchedules} from "../../databaseTypes/types";
import {DateHelper} from "../../helpers/DateHelper";
import {ReportSchedule} from "../ReportSchedule";

describe("TestFoodFeedbackReportScheduleNextReportDateDue Test", () => {


    it("Generation due for the same day", async () => {

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
            day: 1, // 1.7.2024 is a Monday
            hours: 5, // since we are before the sendReportAtHour, we expect the report to be due today
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        });

        const expectedNextReportDue = DateHelper.getDate({
            year: 2024,
            month: 7,
            day: 1,
            hours: sendReportAtHour,
            minutes: sendReportAtMinute,
            seconds: 0,
            milliseconds: 0
        });
        const expectedNextReportDueString = expectedNextReportDue.toISOString();

        const nextReportDue = ReportSchedule.getNextReportIsDueToBeGeneratedDateOrNull(recipientEntry, now_simulated);
        expect(nextReportDue).not.toBeNull();
        if(nextReportDue){
            const nextReportDueString = nextReportDue.toISOString();
            expect(nextReportDueString).toBe(expectedNextReportDueString);
        }
    });


    it("Generation due for the same day, although send amount days before offer date is not 0", async () => {

        const sendReportAtHour = 6;
        const sendReportAtMinute = 0;
        const sendReportAtHhMmPadded = `${sendReportAtHour.toString().padStart(2, '0')}:${sendReportAtMinute.toString().padStart(2, '0')}`;
        let recipientEntry: Partial<CanteenFoodFeedbackReportSchedules> = {
            send_report_at_hh_mm: sendReportAtHhMmPadded,
            send_amount_days_before_offer_date: 3, // although this is not 0, we expect the report to be due today
            // We want to send the report 3 days before the offer date. The offer date is today (Monday) plus 3 days is Thursday.
            send_for_mondays: true,
            send_for_tuesdays: true,
            send_for_wednesdays: true,
            send_for_thursdays: true, // As the offer date is Thursday and enabled, we expect the report to be due today
            send_for_fridays: true,
            send_for_saturdays: true,
            send_for_sundays: true,
        }

        const now_simulated = DateHelper.getDate({
            year: 2024,
            month: 7,
            day: 1, // 1.7.2024 is a Monday
            hours: 5, // since we are before the sendReportAtHour, we expect the report to be due today
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        });

        const expectedNextReportDue = DateHelper.getDate({
            year: 2024,
            month: 7,
            day: 1,
            hours: sendReportAtHour,
            minutes: sendReportAtMinute,
            seconds: 0,
            milliseconds: 0
        });
        const expectedNextReportDueString = expectedNextReportDue.toISOString();

        const nextReportDue = ReportSchedule.getNextReportIsDueToBeGeneratedDateOrNull(recipientEntry, now_simulated);
        expect(nextReportDue).not.toBeNull();
        if(nextReportDue){
            const nextReportDueString = nextReportDue.toISOString();
            expect(nextReportDueString).toBe(expectedNextReportDueString);
        }
    });


    it("Generation due for the next day, since it is after the sendReportAtHour", async () => {

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
            day: 1, // 1.7.2024 is a Monday
            hours: 12,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        });

        const expectedNextReportDue = DateHelper.getDate({
            year: 2024,
            month: 7,
            day: 2, // we expect the next report to be due on the next day
            hours: sendReportAtHour,
            minutes: sendReportAtMinute,
            seconds: 0,
            milliseconds: 0
        });
        const expectedNextReportDueString = expectedNextReportDue.toISOString();

        const nextReportDue = ReportSchedule.getNextReportIsDueToBeGeneratedDateOrNull(recipientEntry, now_simulated);
        expect(nextReportDue).not.toBeNull();
        if(nextReportDue){
            const nextReportDueString = nextReportDue.toISOString();
            expect(nextReportDueString).toBe(expectedNextReportDueString);
        }
    });


    it("Generation due for Friday, since all other days are disabled", async () => {

            const sendReportAtHour = 6;
            const sendReportAtMinute = 0;
            const sendReportAtHhMmPadded = `${sendReportAtHour.toString().padStart(2, '0')}:${sendReportAtMinute.toString().padStart(2, '0')}`;
            let recipientEntry: Partial<CanteenFoodFeedbackReportSchedules> = {
                send_report_at_hh_mm: sendReportAtHhMmPadded,
                send_amount_days_before_offer_date: 0,
                send_for_mondays: false,
                send_for_tuesdays: false,
                send_for_wednesdays: false,
                send_for_thursdays: false,
                send_for_fridays: true, // only Friday is enabled
                send_for_saturdays: false,
                send_for_sundays: false,
            }

            const now_simulated = DateHelper.getDate({
                year: 2024,
                month: 7,
                day: 1, // 1.7.2024 is a Monday
                hours: 12,
                minutes: 0,
                seconds: 0,
                milliseconds: 0
            });

            const expectedNextReportDue = DateHelper.getDate({
                year: 2024,
                month: 7,
                day: 5, // we expect the next report to be due on Friday
                hours: sendReportAtHour,
                minutes: sendReportAtMinute,
                seconds: 0,
                milliseconds: 0
            });
            const expectedNextReportDueString = expectedNextReportDue.toISOString();

            const nextReportDue = ReportSchedule.getNextReportIsDueToBeGeneratedDateOrNull(recipientEntry, now_simulated);
            expect(nextReportDue).not.toBeNull();
            if(nextReportDue){
                const nextReportDueString = nextReportDue.toISOString();
                expect(nextReportDueString).toBe(expectedNextReportDueString);
            }
    });

    it("Before the sendReportAtHour, send amount days before is 4, but the days is not enabled, so the next report is due on the next day", async () => {

                const sendReportAtHour = 6;
                const sendReportAtMinute = 0;
                const sendReportAtHhMmPadded = `${sendReportAtHour.toString().padStart(2, '0')}:${sendReportAtMinute.toString().padStart(2, '0')}`;
                let recipientEntry: Partial<CanteenFoodFeedbackReportSchedules> = {
                    send_report_at_hh_mm: sendReportAtHhMmPadded,
                    send_amount_days_before_offer_date: 4, // we want to send the report 4 days before the offer date
                    // So the offer date is Monday, plus 4 days is Friday. But Friday is not enabled, so we cant generate the report for Friday
                    send_for_mondays: false,
                    send_for_tuesdays: false,
                    send_for_wednesdays: false,
                    send_for_thursdays: false,
                    send_for_fridays: false, // Friday is not enabled
                    send_for_saturdays: true, // but Saturday is enabled
                    send_for_sundays: false,
                }

                const now_simulated = DateHelper.getDate({
                    year: 2024,
                    month: 7,
                    day: 1, // 1.7.2024 is a Monday
                    hours: 5, // before the sendReportAtHour
                    minutes: 0,
                    seconds: 0,
                    milliseconds: 0
                });

                const expectedNextReportDue = DateHelper.getDate({
                    year: 2024,
                    month: 7,
                    day: 2, // we expect the next report to be due on the next day.
                    // normally we would send the report 4 days before the offer date, but Friday is not enabled.
                    // So we can generate the report for Saturday. And 4 days before Saturday is Tuesday.
                    hours: sendReportAtHour,
                    minutes: sendReportAtMinute,
                    seconds: 0,
                    milliseconds: 0
                });
                const expectedNextReportDueString = expectedNextReportDue.toISOString();

                const nextReportDue = ReportSchedule.getNextReportIsDueToBeGeneratedDateOrNull(recipientEntry, now_simulated);
                expect(nextReportDue).not.toBeNull();
                if(nextReportDue){
                    const nextReportDueString = nextReportDue.toISOString();
                    expect(nextReportDueString).toBe(expectedNextReportDueString);
                }
    });

    it("No days are enabled, no report date can be found", async () => {

        const sendReportAtHour = 6;
        const sendReportAtMinute = 0;
        const sendReportAtHhMmPadded = `${sendReportAtHour.toString().padStart(2, '0')}:${sendReportAtMinute.toString().padStart(2, '0')}`;
        let recipientEntry: Partial<CanteenFoodFeedbackReportSchedules> = {
            send_report_at_hh_mm: sendReportAtHhMmPadded,
            send_amount_days_before_offer_date: 0,
            send_for_mondays: false,
            send_for_tuesdays: false,
            send_for_wednesdays: false,
            send_for_thursdays: false,
            send_for_fridays: false,
            send_for_saturdays: false,
            send_for_sundays: false,
        }

        const now_simulated = DateHelper.getDate({
            year: 2024,
            month: 7,
            day: 1, // 1.7.2024 is a Monday
            hours: 5, // before the sendReportAtHour
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        });

        const nextReportDue = ReportSchedule.getNextReportIsDueToBeGeneratedDateOrNull(recipientEntry, now_simulated);
        expect(nextReportDue).toBeNull();
    });


});