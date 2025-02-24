import {Liquid} from 'liquidjs';
import path from "path";
import fse from "fs-extra";
import {Mails} from "../../databaseTypes/types";
import MarkdownIt from "markdown-it";

export enum EmailTemplatesEnum {
    BASE_GERMAN = "base-german",
    BASE_GERMAN_MARKDOWN_CONTENT = "base-german-markdown-content",
    CANTEEN_FOOD_FEEDBACK_REPORT = "canteen-food-feedback-report",
    APP_FEEDBACKS = "app-feedbacks",
}

export const DEFAULT_EMAIL_TEMPLATE = EmailTemplatesEnum.BASE_GERMAN_MARKDOWN_CONTENT;

export const EMAIL_TEMPLATE_FILE_ENDING = '.liquid';

export const rootPathEmailTemplates = path.resolve(process.cwd(), '../templates');

function renderMarkdownTextToHtml(markdownText: string): string {
    const md = new MarkdownIt({ html: true });
    return md.render(markdownText);
}

export type EmailDownloadLink = {
    name: string,
    url: string,
}

export function getTemplateDataFromMail(mail: Partial<Mails>): {[key: string]: any} & {mailContentFieldRenderedAsHtml?: string} {
    let data: {[key: string]: any} & {
        mailContentFieldRenderedAsHtml?: string,
        downloadLinks?: string[]
    } = {};
    if(mail.template_data){
        data = {
            ...data,
            ...mail.template_data,
        }
    }
    if(mail.markdown_content){
        data = {
            ...data,
            mailContentFieldRenderedAsHtml: renderMarkdownTextToHtml(mail.markdown_content),
        }
    }

    return data;
}

export class EmailTemplates {

    public static getDefaultTemplateData() {

        return {
            projectName: 'Rocket Meals',
            projectColor: '#D14610',
            projectLogo: null,
            projectUrl: '',
        };
    }

    public static async renderTemplate(template: EmailTemplatesEnum, mail: Partial<Mails>): Promise<any> {
        const pathToTemplatesString = ["templates"];

        const rootPath = rootPathEmailTemplates;
        const liquidEngine = new Liquid({
            root: [rootPath],
            extname: '.liquid',
        });

        const defaultTemplateData = await this.getDefaultTemplateData();

        let variables = getTemplateDataFromMail(mail);

        variables = {
            ...defaultTemplateData,
            ...variables,
        };

        const systemTemplatePath = path.join(rootPath, template + EMAIL_TEMPLATE_FILE_ENDING);
        const templatePath = systemTemplatePath;

        const templateString = await fse.readFile(templatePath, 'utf8');
        const html = await liquidEngine.parseAndRender(templateString, variables);
        return html;
    }

}
