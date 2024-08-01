export class EnvVariableHelper {
    private static getEnvVariable(name: string): string {
        let envVariable = process.env[name];
        if (envVariable == null) {
            throw new Error("Environment Variable " + name + " not set.");
        }
        return envVariable;
    }

    static getPublicUrl(): string {
        return this.getEnvVariable("PUBLIC_URL");
    }

    static isDevelopmentServerOrLocal(): boolean {
        let publicUrl = this.getPublicUrl();
        return publicUrl.includes("localhost") || publicUrl.includes("test.rocket-meals");
    }

    static isProductionServer(): boolean {
        return !this.isDevelopmentServerOrLocal();
    }
}