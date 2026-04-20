import * as fs from 'node:fs';
import * as path from 'node:path';

import { getCustomerConfig, getCustomerEnvVariable } from '../frontend/app/config';

const TEMPLATE_FILE = path.resolve(__dirname, '../frontend/app/eas.template.json');
const TARGET_FILE = path.resolve(__dirname, '../frontend/app/eas.json');

type SubmitConfig = {
        production?: {
                ios?: IosSubmitConfig;
        } & Record<string, unknown>;
} & Record<string, unknown>;

type BuildProfileConfig = {
        env?: Record<string, string>;
} & Record<string, unknown>;

type BuildConfig = Record<string, BuildProfileConfig>;

type EasConfig = {
        build?: BuildConfig;
        submit?: SubmitConfig;
} & Record<string, unknown>;

type IosSubmitConfig = {
        ascAppId?: string;
} & Record<string, unknown>;

function loadTemplate(): EasConfig {
        if (!fs.existsSync(TEMPLATE_FILE)) {
                throw new Error(`EAS template not found at ${TEMPLATE_FILE}`);
        }

        const contents = fs.readFileSync(TEMPLATE_FILE, 'utf8');
        return JSON.parse(contents);
}

function getIosSubmitConfig(config: EasConfig): IosSubmitConfig {
        const submit = config.submit;
        if (!submit || typeof submit !== 'object') {
                throw new Error('The EAS template does not contain submit configuration.');
        }

        const production = submit.production;
        if (!production || typeof production !== 'object') {
                throw new Error('The EAS template does not contain submit.production configuration.');
        }

        const ios = production.ios;
        if (!ios || typeof ios !== 'object') {
                throw new Error('The EAS template does not contain submit.production.ios configuration.');
        }

        return ios;
}

function updateAscAppId(config: EasConfig, appleAppId?: string) {
        const iosSubmitConfig = getIosSubmitConfig(config);

        if (appleAppId) {
                iosSubmitConfig.ascAppId = appleAppId;
        } else {
                delete iosSubmitConfig.ascAppId;
        }
}

function addEnvToAllBuildProfiles(config: EasConfig, customer: string | undefined) {
        const build = config.build as BuildConfig | undefined;
        if (!build || !customer) return;

        for (const profileName of Object.keys(build)) {
                const profile = build[profileName];
                profile.env = {
                        ...(profile.env || {}),
                        CUSTOMER: customer,
                        EXPO_PUBLIC_CUSTOMER: customer,
                };
        }
}

function persistConfig(config: EasConfig) {
        const serialized = JSON.stringify(config, null, 2);
        fs.writeFileSync(TARGET_FILE, `${serialized}\n`, 'utf8');
}

function main() {
        const template = loadTemplate();
        const { appleAppId } = getCustomerConfig();
        const customer = getCustomerEnvVariable();

        updateAscAppId(template, appleAppId);
        addEnvToAllBuildProfiles(template, customer);
        persistConfig(template);
        console.log(`EAS config generated at ${TARGET_FILE} (customer: ${customer || 'default'})`);
}

void main();
