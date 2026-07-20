import {join} from "node:path";
import {readFileSync} from "node:fs";
import {FileContentReader} from "../FileContentReader";

export class MaxManagerFileContentReader extends FileContentReader{

    public getContent(): string {
        const filePath = join(__dirname, 'speiseplaene', 'max_manager.html');
        let content = readFileSync(filePath, 'utf-8');
        return content;
    }

}
