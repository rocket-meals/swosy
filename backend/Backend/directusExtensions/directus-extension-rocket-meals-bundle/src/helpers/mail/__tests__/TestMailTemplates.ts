// small jest test
import {describe, expect, it} from '@jest/globals';
import {EMAIL_TEMPLATE_FILE_ENDING, EmailTemplatesEnum, rootPathEmailTemplates} from "../EmailTemplates";
import path from "path";
import fse from "fs-extra";

describe("Mail Template Test", () => {

    it("Test if all enum templates exist", async () => {
        let emailTemplateNamesWithoutEnding = Object.values(EmailTemplatesEnum);
        rootPathEmailTemplates

        for(let templateName of emailTemplateNamesWithoutEnding) {
            const systemTemplatePath = path.join(rootPathEmailTemplates, templateName + EMAIL_TEMPLATE_FILE_ENDING);
            expect(path).toBeTruthy();
            let exists = await fse.pathExists(systemTemplatePath);
            expect(exists).toBeTruthy();
        }
    });

});