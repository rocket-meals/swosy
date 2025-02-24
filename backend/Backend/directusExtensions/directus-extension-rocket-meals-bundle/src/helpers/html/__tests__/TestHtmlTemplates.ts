// small jest test
import {describe, expect, it} from '@jest/globals';
import {
    BaseGermanMarkdownTemplateHelper,
    HTML_TEMPLATE_FILE_ENDING,
    HtmlGenerator,
    HtmlTemplatesEnum,
    rootPathHtmlTemplates
} from "../HtmlGenerator";
import path from "path";
import fse from "fs-extra";
import {TestArtifacts} from "../../TestArtifacts";

export async function getTestHtmlForBaseGermanMarkdownContent() {
    let exampleMarkdown = getExampleMarkdown();
    let html = await HtmlGenerator.generateHtml({
        ...BaseGermanMarkdownTemplateHelper.getTemplateDataForMarkdownContent(exampleMarkdown)
    }, HtmlTemplatesEnum.BASE_GERMAN_MARKDOWN_CONTENT);
    return html;
}

export function getExampleMarkdown() {
    return `
# Title Level 1
## Title Level 2
### Title Level 3
#### Title Level 4
##### Title Level 5
###### Title Level 6

This is a paragraph with some text.

This is with **bold** and *italic* text.

This is a link [Google](https://www.google.com)

This is a list:
- Item 1
- Item 2
- Item 3

This is a numbered list:
1. Item 1
2. Item 2
3. Item 3

This is a table:
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
| Cell 7   | Cell 8   | Cell 9   |

This is a code block:
\`\`\`javascript
console.log("Hello World!");
\`\`\`

This is an image:
![Image](https://picsum.photos/200/300)

This is a blockquote:
> This is a blockquote


This is a horizontal rule:
---
        `
}

describe("Html Template Test", () => {

    it("Test if all enum templates exist", async () => {
        let emailTemplateNamesWithoutEnding = Object.values(HtmlTemplatesEnum);
        rootPathHtmlTemplates

        for(let templateName of emailTemplateNamesWithoutEnding) {
            const systemTemplatePath = path.join(rootPathHtmlTemplates, templateName + HTML_TEMPLATE_FILE_ENDING);
            expect(path).toBeTruthy();
            let exists = await fse.pathExists(systemTemplatePath);
            expect(exists).toBeTruthy();
        }
    });

    it("Test html generation of default emplate", async () => {
        let html = await getTestHtmlForBaseGermanMarkdownContent();
        let savePath = TestArtifacts.saveTestArtifact(html, "html/" + HtmlTemplatesEnum.BASE_GERMAN_MARKDOWN_CONTENT + ".html");
        expect(html).toBeTruthy();
    })

});