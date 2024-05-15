// Required dependencies
import fetch from 'node-fetch';
import { CookieJar } from 'cookiejar';
import fs from 'fs';
import FormData from 'form-data';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dumpPath = "./configuration/directus-config";

/**
 * Configuration for collections and modules
 */
const requiredModules = ["flow-manager", "schema-management-module", "generate-types"];
const collectionsToSkip = ["2-wikis.json"];

// Load directus .env file

// Path to the .env file
const envFilePath = path.resolve(__dirname, './../.env');

// Read the contents of the .env file
const envFile = fs.readFileSync(envFilePath, 'utf8');

// Function to parse the .env file content into a dictionary
function parseEnvFile(content) {
    const envDict = {};

    // Split the content by new lines
    const lines = content.split('\n');

    lines.forEach(line => {
        // Remove any whitespace around the line and ignore empty lines
        line = line.trim();
        if (line) {
            // Split each line by the first '=' character
            const [key, ...valueParts] = line.split('=');
            let value = valueParts.join('=').trim();

            // Remove surrounding quotes if they exist
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            // Add the key-value pair to the dictionary
            envDict[key.trim()] = value;
        }
    });

    return envDict;
}


const parsedEnvFile = parseEnvFile(envFile);
const DOMAIN_PRE = parsedEnvFile.DOMAIN_PRE
const MYHOST = parsedEnvFile.MYHOST;
const DOMAIN_PATH = parsedEnvFile.DOMAIN_PATH
const BACKEND_PATH = parsedEnvFile.BACKEND_PATH;

let directus_url = `${DOMAIN_PRE}://${MYHOST}/${DOMAIN_PATH}/${BACKEND_PATH}`
let admin_email = parsedEnvFile.ADMIN_EMAIL;
let admin_password = parsedEnvFile.ADMIN_PASSWORD;

const configurationPath = "./configuration";
const configurationPathRolesPermissions = `${configurationPath}/roles-permissions`;
const configurationPathCollections = `${configurationPath}/collections`;

// Directus API endpoints
const getUrlPermissions = () => {
    return `${directus_url}/permissions`; // as directus_url can change we need to use a function here
}

const getUrlItems = () => {
    return `${directus_url}/items`; // as directus_url can change we need to use a function here
}

const getUrlSettings = () => {
    return `${directus_url}/settings`; // as directus_url can change we need to use a function here
}

const configureDirectusServerUrl = async () => {
    const predefinedOptions = {
        "Current": directus_url,
        "Demo Server": "https://rocket-meals.de/rocket-meals/api",
        "Studi|Futter": "https://studi-futter.rocket-meals.de/rocket-meals/api",
        "SWOSY": "https://swosy.rocket-meals.de/rocket-meals/api"
    };

    const choices = [
        ...Object.entries(predefinedOptions).map(
            ([key, value]) => ({
                name: `${key} (${value})`,
                value: value
            })
        ),
        { name: 'Custom Value', value: 'Custom Value' }
    ];

    const { selectedOption } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedOption',
            message: 'Select the Directus server URL:',
            choices
        }
    ]);

    let selectedValue = selectedOption;

    if (selectedOption === 'Custom Value') {
        const { customValue } = await inquirer.prompt([
            {
                type: 'input',
                name: 'customValue',
                message: 'Enter the custom Directus server URL:'
            }
        ]);
        selectedValue = customValue;
    }

    directus_url = selectedValue;
    console.log(`Directus server URL set to: ${directus_url}`);
}

const configureDirectusAdminCredentials = async () => {
    const { useDefaultEmail } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'useDefaultEmail',
            message: `Use the default admin email (${admin_email})?`,
            default: true
        }
    ]);

    let selectedEmail = admin_email;
    if (!useDefaultEmail) {
        const { newEmail } = await inquirer.prompt([
            {
                type: 'input',
                name: 'newEmail',
                message: 'Enter the new admin email:'
            }
        ]);
        selectedEmail = newEmail;
    }
    admin_email = selectedEmail;

    const { useDefaultPassword } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'useDefaultPassword',
            message: `Use the default admin password (${admin_password})?`,
            default: true
        }
    ]);

    let selectedPassword = admin_password;
    if (!useDefaultPassword) {
        const { newPassword } = await inquirer.prompt([
            {
                type: 'password',
                name: 'newPassword',
                message: 'Enter the new admin password:'
            }
        ]);
        selectedPassword = newPassword;
    }
    admin_password = selectedPassword;

    console.log(`Admin email set to: ${admin_email}`);
    console.log('Admin password updated');
}

const configureVariables = async () => {
    await configureDirectusServerUrl();
    await configureDirectusAdminCredentials();
}

/**
 * MAIN PUSH FUNCTION
 */
// Main function to handle the "push" command
const mainPush = async () => {
    console.log("Starting Push Sync")
    await configureVariables();
    const headers = await setupDirectusConnectionAndGetHeaders()
    await enableRequiredSettings(headers);
    await pushDirectusSyncSchemas();
    await uploadPublicPermissions(headers);
    await uploadSchemas(headers);
};

// Function to enable required settings
const enableRequiredSettings = async (headers) => {
    console.log("Enabling required settings...");

    // Patch settings with an empty object
    console.log(" -  Patching with empty");
    await fetch(`${getUrlSettings()}`, {
        method: 'PATCH',
        headers: {
            "Cookie": headers.get('cookie'),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_bar: [] }),
    });

    // Fetch the current settings
    console.log(" -  Fetching settings");
    const settingsResponse = await fetch(`${getUrlSettings()}`, {
        method: 'GET',
        headers: { "Cookie": headers.get('cookie') },
    });
    const settings = await settingsResponse.json();
    if (!settings) throw new Error("Failed to fetch settings!");

    const modules = settings.data.module_bar;
    if (!modules) throw new Error("Failed to fetch modules!");

    // Enable required modules
    for (const moduleIndex in modules) {
        const module = modules[moduleIndex];
        if (requiredModules.includes(module.id)) {
            if (!module.enabled) {
                console.log(` -  Enabling ${module.id}`);
                modules[moduleIndex].enabled = true;
            } else {
                console.log(` -  ${module.id} already enabled`);
            }
        } else {
            console.log(` -  ${module.id} not required`);
        }
    }

    // Patch updated settings
    const response = await fetch(`${getUrlSettings()}`, {
        method: 'PATCH',
        headers: {
            "Cookie": headers.get('cookie'),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_bar: modules }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} message: ${response.statusText}`);
    }

    console.log(" -  Enabled required settings");
};

const getDirectusSyncParams = () => {
    return '--directus-url '+directus_url+" --directus-email "+admin_email+" --directus-password "+admin_password+" --dump-path "+dumpPath;
}

const pushDirectusSyncSchemas = async () => {
    console.log("Pushing schema changes to Directus...");
    const directus_sync_params = getDirectusSyncParams();
    execSync('npx directus-sync push '+directus_sync_params);
}

// Function to sync public permissions
const uploadPublicPermissions = async (headers) => {
    console.log("Syncing public permissions...");

    // Load public permissions data
    const data = fs.readFileSync(`${configurationPathRolesPermissions}/public.json`, 'utf8');
    const permissions = JSON.parse(data);

    // Helper function to update a permission node
    const updatePermissionNode = async (permission) => {
        const response = await fetch(`${getUrlPermissions()}`, {
            method: 'POST',
            headers: {
                "Cookie": headers.get('cookie'),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                role: permission.role,
                collection: permission.collection,
                action: permission.action,
                fields: permission.fields,
                permissions: permission.permissions,
                validation: permission.validation,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} message: ${response.statusText}`);
        }
    };

    // Iterate through all permissions and update each
    for (const permission of permissions) {
        console.log(` -  Syncing ${permission.collection} ${permission.action}`);
        await updatePermissionNode(permission);
    }

    console.log(" -  Public permissions synced");
};

const uploadSchemas = async (headers) => {
    console.log("Uploading schemas...");
    let files = fs.readdirSync(`${configurationPathCollections}`).sort();
    for (const file of files) {
        await uploadSchema(headers, `${configurationPathCollections}/${file}`);
    }
}

// Function to import a schema file into Directus
const uploadSchema = async (headers, file) => {
    const name = file.split('/').pop().split('.').shift();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file));
    const displayName = name.split("-").pop();

    // Check if collection already exists
    const firstElement = await fetch(`${getUrlItems()}/${displayName}?limit=1`, {
        method: 'GET',
        headers: { "Cookie": headers.get('cookie') },
    }).then(response => response.json());

    if (firstElement.data.length > 0) {
        console.log(` -  ${displayName} already exists`);
        return;
    }

    // Import collection into Directus
    console.log(` -  Importing ${displayName}`);
    const response = await fetch(`${directus_url}/utils/import/${displayName}`, {
        method: 'POST',
        headers: { "Cookie": headers.get('cookie'), ...formData.getHeaders() },
        body: formData,
    });

    if (!response.ok) {
        console.error(` -  HTTP error! status: ${response.status} message: ${response.statusText} at ${file}`);
    }
};

// Function to fetch data for a collection
const getCollection = async (headers, name) => {
    const displayName = name.split('/').pop().split('.').shift().split("-").pop();
    console.log(` -  Fetching ${displayName}`);

    // Retrieve collection data
    const data = await fetch(`${getUrlItems()}/${displayName}?limit=-1`, {
        method: 'GET',
        headers: { "Cookie": headers.get('cookie') },
    }).then(response => response.json());

    return data.data;
};


/**
 * MAIN PULL FUNCTION
 */

// Main function to handle the "pull" command
const mainPull = async () => {
    console.log("Waiting for Directus to be ready...");
    await configureVariables();
    const headers = await setupDirectusConnectionAndGetHeaders()
    await saveCollections(headers);
    await savePublicRole(headers);
    await saveDirectusSyncSchema();
};


// Function to save collections
const saveCollections = async (headers) => {
    console.log("Saving collections...");
    let collections = fs.readdirSync(`${configurationPathCollections}`);

    for (const collection of collections) {
        if (collectionsToSkip.includes(collection)) {
            console.log(` -  Skipping ignored collection: ${collection}`);
            continue;
        }

        const data = await getCollection(headers, collection);
        const jsonData = JSON.stringify(data, null, 4);

        // Save the collection data to file
        fs.writeFileSync(`${configurationPathCollections}/${collection}`, jsonData);
    }

    console.log(" -  Saved collections");
};

// Function to save public role permissions
const savePublicRole = async (headers) => {
    console.log("Saving public role...");
    const data = await fetch(`${getUrlPermissions()}?filter%5Brole%5D%5B_null%5D=true`, {
        method: 'GET',
        headers: { "Cookie": headers.get('cookie') },
    }).then(response => response.json());

    const jsonData = JSON.stringify(data.data, null, 4);

    // Save the public role permissions to file
    fs.writeFileSync(`${configurationPathRolesPermissions}/public.json`, jsonData);
    console.log(" -  Saved public role");
};




const saveDirectusSyncSchema = async() => {
    // Pull schema changes from Directus
    console.log("Pulling schema changes from Directus...");
    const directus_sync_params = getDirectusSyncParams();
    execSync('npx directus-sync pull ' + directus_sync_params);
}


const setupDirectusConnectionAndGetHeaders = async () => {
    console.log("Setting up Directus connection...");
    await waitForDirectusToBeReady();
    return await login();
}

const waitForDirectusToBeReady = async () => {
    console.log("Waiting for Directus to be ready...");
    console.log("Checking directus server at: "+directus_url)
    const retries = 100
    let ready = false;
    for (let i = 0; i < retries; i++) {
        try {
            await fetch(`${directus_url}/server/ping`);
            console.log("Directus is ready\n");
            ready = true;
            break;
        } catch (e) {
            const TIME_TO_WAIT = 1000;
            console.log("Trying again in " + TIME_TO_WAIT + "ms");
            await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT));
        }
    }
    if (!ready) {
        console.log("Directus is not ready after " + retries + " retries, please make sure Directus is running");
        throw new Error("Directus is not ready");
    }
    return ready;
}

// Function to handle login and return headers with cookies
const login = async () => {
    console.log("Logging into Directus...");
    const cookieJar = new CookieJar();
    const headers = new Headers();
    const origin = new URL(directus_url).origin;

    //console.log("admin_email: "+admin_email);
    //console.log("admin_password: "+admin_password)

    const response = await fetch(`${directus_url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: admin_email, password: admin_password, mode: "session" }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Save the cookies to the jar
    const cookies = response.headers.get('set-cookie');
    cookieJar.setCookie(cookies, origin);

    headers.set(
        'cookie',
        cookieJar
            .getCookies({
                domain: origin,
                path: '/',
                secure: true,
                script: false,
            })
            .toValueString(),
    );

    return headers;
};

// Command-line argument processing
if (process.argv[2] === "push") {
    mainPush()
        .then(() => process.exit(0))
        .catch(console.error);
} else if (process.argv[2] === "pull") {
    mainPull()
        .then(() => process.exit(0))
        .catch(console.error);
}
