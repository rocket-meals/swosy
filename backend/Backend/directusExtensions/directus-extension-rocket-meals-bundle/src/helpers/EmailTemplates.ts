import {Liquid} from 'liquidjs';
import path from "path";
import fse from "fs-extra";

export enum EmailTemplatesEnum {
    CANTEEN_FOOD_FEEDBACK_REPORT = "canteen-food-feedback-report",
    APP_FEEDBACKS = "app-feedbacks",
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

    public static async renderTemplate(template: EmailTemplatesEnum, data: any): Promise<any> {
        console.log("renderTemplate: "+template);

        const pathToTemplatesString = ["templates"];

        const rootPath = path.resolve(process.cwd(), "..", 'templates');
        const liquidEngine = new Liquid({
            root: [rootPath],
            extname: '.liquid',
        });

        const defaultTemplateData = await this.getDefaultTemplateData();

        let variables = data;

        variables = {
            ...defaultTemplateData,
            ...variables,
        };

        const systemTemplatePath = path.join(rootPath, template + '.liquid');
        const templatePath = systemTemplatePath;

        const templateString = await fse.readFile(templatePath, 'utf8');
        const html = await liquidEngine.parseAndRender(templateString, variables);
        return html;
    }

}
