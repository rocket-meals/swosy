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