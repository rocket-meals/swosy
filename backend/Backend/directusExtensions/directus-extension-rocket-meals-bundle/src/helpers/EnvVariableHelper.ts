export enum SyncForCustomerEnum {
    TEST = "Test",
    OSNABRUECK = "Osnabrück",
    HANNOVER = "Hannover",
}

export class EnvVariableHelper {
    private static getEnvVariable(name: string): string {
        let envVariable = process.env[name];
        if (envVariable == null) {
            throw new Error("Environment Variable " + name + " not set.");
        }
        return envVariable;
    }

    static getFoodSyncMode(): string {
        return this.getEnvVariable("FOOD_SYNC_MODE"); // Options: "TL1CSV", "TL1WEB", "SWOSY"
    }

    static getFoodSyncTL1FileExportCsvFilePath(): string {
        return this.getEnvVariable("FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH");
    }

    static getMarkingSyncTL1FileCreateOnlyFromExportCsvFile(): boolean {
        return this.getEnvVariable("MARKING_SYNC_TL1FILE_CREATE_ONLY_FROM_EXPORT_CSV_FILE") === "true";
    }

    static getFoodSyncTL1FileExportCsvFileEncoding(): any {
        return this.getEnvVariable("FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING") || "latin1" as BufferEncoding;
    }

    static getFoodSyncTL1WebExportUrl(): string {
        return this.getEnvVariable("FOOD_SYNC_TL1WEB_EXPORT_URL");
    }

    static getHousingContractCsvFilePath(): string {
        return this.getEnvVariable("HOUSING_CONTRACT_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH");
    }

    static getFoodImageSyncSwosyApiServerUrl(): string {
        return this.getEnvVariable("FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL");
    }

    static getMarkingSyncMode(): string {
        return this.getEnvVariable("MARKING_SYNC_MODE"); // Options: "TL1CSV", "TL1WEB", "SWOSY"
    }

    static getMarkingSyncTL1FileExportCsvFilePath(): string {
        return this.getEnvVariable("MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH");
    }

    static getMarkingSyncTL1FileExportCsvFileEncoding(): any {
        return this.getEnvVariable("MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING") || "utf8" as BufferEncoding;
    }

    static getEnvFieldNameForAutoTranslateApiKey(): string {
        return "AUTO_TRANSLATE_API_KEY";
    }

    static getAutoTranslateApiKey(): string {
        return this.getEnvVariable(EnvVariableHelper.getEnvFieldNameForAutoTranslateApiKey());
    }

    static getPublicUrl(): string {
        // PUBLIC_URL: "https://${MYHOST}/${ROCKET_MEALS_PATH}/${ROCKET_MEALS_BACKEND_PATH}"
        return this.getEnvVariable("PUBLIC_URL");
    }

    static getAdminEmail(): string {
        return this.getEnvVariable("ADMIN_EMAIL");
    }

    static getAdminPassword(): string {
        return this.getEnvVariable("ADMIN_PASSWORD");
    }

    static getSyncForCustomer(): SyncForCustomerEnum | null {
        let value = this.getEnvVariable("SYNC_FOR_CUSTOMER");
        // check if value is a valid enum value
        if (Object.values(SyncForCustomerEnum).includes(value as SyncForCustomerEnum)) {
            return value as SyncForCustomerEnum;
        } else {
            return null;
        }
    }
}