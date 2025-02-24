import {Liquid} from 'liquidjs';
import path from "path";
import fse from "fs-extra";
import {Mails} from "../../databaseTypes/types";
import MarkdownIt from "markdown-it";
import {MyTimer} from "../MyTimer";

export enum HtmlTemplatesEnum {
    BASE_GERMAN = "base-german",
    BASE_GERMAN_MARKDOWN_CONTENT = "base-german-markdown-content",
    CANTEEN_FOOD_FEEDBACK_REPORT = "canteen-food-feedback-report",
    APP_FEEDBACKS = "app-feedbacks",
}

export class BaseGermanMarkdownTemplateHelper {
    public static TEMPLATE_MARKDOWN_FIELD = "mailContentFieldRenderedAsHtml";

    public static getTemplateDataForMarkdownContent(markdownContent: string): {[key: string]: any} {
        return {
            [BaseGermanMarkdownTemplateHelper.TEMPLATE_MARKDOWN_FIELD]: HtmlGenerator.renderMarkdownTextToHtml(markdownContent),
        }
    }
}

export const DEFAULT_HTML_TEMPLATE = HtmlTemplatesEnum.BASE_GERMAN_MARKDOWN_CONTENT;

export const HTML_TEMPLATE_FILE_ENDING = '.liquid';

export const rootPathHtmlTemplates = path.resolve(process.cwd(), '../templates');

export class HtmlGenerator {

    public static getDefaultTemplateData() {

        return {
            projectName: 'Rocket Meals',
            projectColor: '#D14610',
            projectLogo: null,
            projectUrl: '',
        };
    }

    public static isValidHtmlTemplate(template: string | null | undefined): boolean {
        if(!template){
            return false;
        }
        return Object.values(HtmlTemplatesEnum).includes(template as HtmlTemplatesEnum);
    }

    public static getHtmlTemplate(template: string | null | undefined): HtmlTemplatesEnum {
        if(!this.isValidHtmlTemplate(template)){
            return DEFAULT_HTML_TEMPLATE;
        } else {
            return template as HtmlTemplatesEnum;
        }
    }

    public static renderMarkdownTextToHtml(markdownText: string): string {
        const md = new MarkdownIt({ html: true });
        return md.render(markdownText);
    }


    public static async generateHtml(variables: {[key: string]: any}, template?: HtmlTemplatesEnum | null | undefined): Promise<string> {
        const rootPath = rootPathHtmlTemplates;

        const liquidEngine = new Liquid({
            root: [rootPath],
            extname: '.liquid',
        });

        if(!template){
            template = DEFAULT_HTML_TEMPLATE;
        }

        const defaultTemplateData = await this.getDefaultTemplateData();

        variables = {
            ...defaultTemplateData,
            ...variables,
        };

        const systemTemplatePath = path.join(rootPath, template + HTML_TEMPLATE_FILE_ENDING);
        const templatePath = systemTemplatePath;

        const templateString = await fse.readFile(templatePath, 'utf8');
        const html = await liquidEngine.parseAndRender(templateString, variables) as string;

        return html;
    }

}
