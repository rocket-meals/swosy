import {FormExtractRelevantInformation, FormExtractRelevantInformationSingle} from "../../forms-sync-hook";
import {BaseGermanMarkdownTemplateHelper, HtmlGenerator} from "../html/HtmlGenerator";
import {PdfGeneratorHelper} from "../pdf/PdfGeneratorHelper";
import {DirectusFilesAssetHelper} from "../DirectusFilesAssetHelper";

export class FormHelper {

    public static async generateMarkdownContentFromForm(formExtractRelevantInformation: FormExtractRelevantInformationSingle[]): Promise<string> {
        let markdownContent = "";
        // export type FormExtractRelevantInformationSingle = {form_field_id: string, sort: number | null | undefined, form_field: FormFields, form_answer: FormAnswers }
        for(let formExtractRelevantInformationSingle of formExtractRelevantInformation){
            let fieldName = formExtractRelevantInformationSingle.form_field.alias || formExtractRelevantInformationSingle.form_field.id
            markdownContent += `### ${fieldName}\n`;
            let value = formExtractRelevantInformationSingle.form_answer.value_string ||
                formExtractRelevantInformationSingle.form_answer.value_number ||
                formExtractRelevantInformationSingle.form_answer.value_date ||
                formExtractRelevantInformationSingle.form_answer.value_boolean;
            if(value){
                markdownContent += `${value}\n`;
            }

            let formAnswerValueImage = formExtractRelevantInformationSingle.form_answer.value_image;
            if(formAnswerValueImage){
                let imageUrl = DirectusFilesAssetHelper.getDirectAssetUrl(formAnswerValueImage);
                markdownContent += `![${fieldName}](${imageUrl})\n`;
            }

            let formAnswerValueFiles = formExtractRelevantInformationSingle.form_answer.value_files;
            if(formAnswerValueFiles){
                for(let formAnswerValueFile of formAnswerValueFiles){
                    let imageUrl = DirectusFilesAssetHelper.getDirectAssetUrl(formAnswerValueFile);
                    markdownContent += `![${fieldName}](${imageUrl})\n`;
                }
            }

        }
        return markdownContent;
    }

    public static async generatePdfFromForm(formExtractRelevantInformation: FormExtractRelevantInformation){
        let markdownContent = await this.generateMarkdownContentFromForm(formExtractRelevantInformation);
        let html = await HtmlGenerator.generateHtml(BaseGermanMarkdownTemplateHelper.getTemplateDataForMarkdownContent(markdownContent));
        let pdfBuffer = PdfGeneratorHelper.generatePdfFromHtml(html);
        return pdfBuffer;
    }
}
