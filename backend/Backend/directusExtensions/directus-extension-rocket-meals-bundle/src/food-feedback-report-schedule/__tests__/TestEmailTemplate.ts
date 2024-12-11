// small jest test
import {describe, it} from '@jest/globals';
import {EmailTemplates, EmailTemplatesEnum} from "../../helpers/EmailTemplates";
import {EmojiHelper} from "../../helpers/EmojiHelper";
import {ReportCanteenEntryType, ReportFoodEntryLabelType, ReportFoodEntryType, ReportType} from "../ReportGenerator";
import {TestArtifacts} from "../../helpers/TestArtifacts";

describe("Food Feedback E-Mail Template", () => {

    it("ReferenceDate on same Date", async () => {

        const foods: ReportFoodEntryType[] = [];
        for(let i=0; i<5; i++) {
            let labelEntries:  ReportFoodEntryLabelType[] = [];
            for(let j=0; j<3; j++) {
                const label: ReportFoodEntryLabelType = {
                    id: "id+"+j,
                    alias: "alias+"+j,
                    amount_positive_new: 10,
                    amount_negative_new: 5,
                    amount_total: 15,
                    amount_negative: 5,
                    amount_positive: 10,
                    status_total: "status_total",
                    status_new: "status_new"
                };
                labelEntries.push(label);
            }


            const food: ReportFoodEntryType = {
                id: "id",
                alias: "alias",
                image_url: "image_url",
                rating_average: "4.5",
                rating_amount: "10",
                comments: ["comment1", "comment2"],
                labels: labelEntries,
                status_rating: "status_rating"
            };
            foods.push(food);
        }

        let canteenLabels:  ReportCanteenEntryType[] = [];
        for(let i=0; i<2; i++) {
            const canteenLabel: ReportCanteenEntryType = {
                id: "id+"+i,
                canteen_alias: "canteen_alias+"+i,
                label_alias: "label_alias+"+i,
                amount_positive_new: 10,
                amount_negative_new: 5,
                amount_total: 15,
                amount_negative: 5,
                amount_positive: 10,
                status_total: "status_total",
                status_new: "status_new"
            };
            canteenLabels.push(canteenLabel);
        }

        let report: ReportType = {
            canteen_alias: "canteen_alias",
            dateHumanReadable: "dateHumanReadable",
            status_explanation: "status_explanation",
            show_images: true,
            show_food: true,
            show_food_feedback_labels: true,
            show_food_comments: true,
            show_canteen_feedbacks: true,
            food_rating_average: "4.1",
            foods: foods,
            canteen_labels: canteenLabels,
            icon_thumbs_up: EmojiHelper.getEmojiDivHTML(EmojiHelper.EmojiFileNames.THUMBS_UP, EmojiHelper.DivTextSize.MEDIUM),
            icon_thumbs_down: EmojiHelper.getEmojiDivHTML(EmojiHelper.EmojiFileNames.THUMBS_DOWN, EmojiHelper.DivTextSize.MEDIUM),
            icon_comment: EmojiHelper.getEmojiDivHTML(EmojiHelper.EmojiFileNames.SPEECH_BUBBLE, EmojiHelper.DivTextSize.SMALL),
            icon_star: EmojiHelper.getEmojiDivHTML(EmojiHelper.EmojiFileNames.STAR, EmojiHelper.DivTextSize.SMALL)
        }

        let hmtl = await EmailTemplates.renderTemplate(EmailTemplatesEnum.CANTEEN_FOOD_FEEDBACK_REPORT, report);

        let savePath = TestArtifacts.saveTestArtifact("food-feedback-report.html", hmtl);
        console.log("Saved to: "+savePath);

        expect(true).toBe(true);
    });



});