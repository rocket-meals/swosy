// https://docs.directus.io/extensions/hooks.html#available-events
import path from "path";
import fse from "fs-extra";

export class TestArtifacts {
    static getPathToTestArtifacts(): string {
        const rootPath = path.resolve(process.cwd(), 'test-artifacts');
        return rootPath;
    }

    static getPathToTestArtifact(fileName: string): string {
        return path.join(this.getPathToTestArtifacts(), fileName);
    }

    static saveTestArtifact(fileName: string, content: string): string {
        const filePath = this.getPathToTestArtifact(fileName);
        // create folder if not exists
        fse.ensureDirSync(this.getPathToTestArtifacts());

        fse.writeFileSync(filePath, content);
        return filePath;
    }
}