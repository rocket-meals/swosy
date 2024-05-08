// Required dependencies
const fetch = require('node-fetch');
const { CookieJar } = require('cookiejar');
const fs = require('fs');
const FormData = require('form-data');
const { execSync } = require('child_process');

/**
 * Configuration for collections and modules
 */
const requiredModules = ["flow-manager", "schema-management-module", "generate-types"];
const collectionsToSkip = ["2-wikis.json"];

// Load configuration
const configPath = "./directus-sync.config.js";
const syncConfig = require(configPath);
const { 
    directusUrl: url, 
    directusEmail: email, 
    directusPassword: password
} = syncConfig;
const configurationPath = "./configuration";
const configurationPathRolesPermissions = `${configurationPath}/roles-permissions`;
const configurationPathCollections = `${configurationPath}/collections`;

// Directus API endpoints
const urlPermissions = `${url}/permissions`;
const urlItems = `${url}/items`;
const urlSettings = `${url}/settings`;


/**
 * MAIN PUSH FUNCTION
 */
// Main function to handle the "push" command
const mainPush = async () => {
    console.log("Starting Push Sync")
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
    await fetch(`${urlSettings}`, {
        method: 'PATCH',
        headers: {
            "Cookie": headers.get('cookie'),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_bar: [] }),
    });

    // Fetch the current settings
    console.log(" -  Fetching settings");
    const settingsResponse = await fetch(`${urlSettings}`, {
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
    const response = await fetch(`${urlSettings}`, {
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


const pushDirectusSyncSchemas = async () => {
    console.log("Pushing schema changes to Directus...");
    execSync('npx directus-sync push --config-path ' + configPath);
}

// Function to sync public permissions
const uploadPublicPermissions = async (headers) => {
    console.log("Syncing public permissions...");

    // Load public permissions data
    const data = fs.readFileSync(`${configurationPathRolesPermissions}/public.json`, 'utf8');
    const permissions = JSON.parse(data);

    // Helper function to update a permission node
    const updatePermissionNode = async (permission) => {
        const response = await fetch(`${urlPermissions}`, {
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
    const firstElement = await fetch(`${urlItems}/${displayName}?limit=1`, {
        method: 'GET',
        headers: { "Cookie": headers.get('cookie') },
    }).then(response => response.json());

    if (firstElement.data.length > 0) {
        console.log(` -  ${displayName} already exists`);
        return;
    }

    // Import collection into Directus
    console.log(` -  Importing ${displayName}`);
    const response = await fetch(`${url}/utils/import/${displayName}`, {
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
    const data = await fetch(`${urlItems}/${displayName}?limit=-1`, {
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
    const data = await fetch(`${urlPermissions}?filter%5Brole%5D%5B_null%5D=true`, {
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
    execSync('npx directus-sync pull --config-path ' + configPath);
}


const setupDirectusConnectionAndGetHeaders = async () => {
    console.log("Setting up Directus connection...");
    await waitForDirectusToBeReady();
    return await login();
}

const waitForDirectusToBeReady = async () => {
    console.log("Waiting for Directus to be ready...");
    while (true) {
        try {
            await fetch(`${url}/server/ping`);
            console.log("Directus is ready\n");
            break;
        } catch (e) {
            const TIME_TO_WAIT = 1000;
            console.log("Trying again in " + TIME_TO_WAIT + "ms");
            await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT));
        }
    }
}

// Function to handle login and return headers with cookies
const login = async () => {
    console.log("Logging into Directus...");
    const cookieJar = new CookieJar();
    const headers = new Headers();
    const origin = new URL(url).origin;

    const response = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mode: "session" }),
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
