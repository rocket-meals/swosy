import {join} from "node:path";
import {readFileSync} from "node:fs";
import {FileContentReader} from "../helper/FileContentReader";

export class MaxManagerFileContentReaderMuenster extends FileContentReader {

    public getContent(): string {
        const filePath = join(__dirname, 'speiseplaene', 'am_ring.html');
        let content = readFileSync(filePath, 'utf-8');
        return content;
    }

}
