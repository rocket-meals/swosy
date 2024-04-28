const fetch = require('node-fetch');
const { CookieJar } = require('cookiejar');
const fs = require('fs');
const FormData = require('form-data');
const { execSync } = require('child_process');

const url="http://localhost:8055"
const email="admin@example.com"
const password= "d1r3ctu5"

// login with the user and save cookie
const login = async () => {
    console.log("Logging into directus...")
    const cookiejar = new CookieJar();
    const headers = new Headers();
    const origin = new URL(url).origin;

    const response = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, mode: "session" })
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const cookies = response.headers.get('set-cookie');
    cookiejar.setCookie(cookies, origin);

    headers.set(
        'cookie',
        cookiejar
            .getCookies({
                domain: origin,
                path: '/',
                secure: true,
                script: false,
            })
            .toValueString(),
    );

    return headers;
}

const enable_required_settings = async (headers) => {
    console.log("Enabling required settings...")
    console.log(" -  patch with empty")
    await fetch(`${url}/settings`, {
        method: 'PATCH',
        headers: {
            "Cookie": headers.get('cookie'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ module_bar: [] })
    })

    console.log(" -  fetching settings")
    const settings = await fetch(`${url}/settings`, {
        method: 'GET',
        headers: {
            "Cookie": headers.get('cookie')
        },
    }).then(response => response.json());

    if (!settings) {
        throw new Error("Failed to fetch settings!");
    }

    const modules = settings.data.module_bar;

    if (!modules) {
        throw new Error("Failed to fetch modules!");
    }

    const required_modules = [
        "flow-manager",
        "schema-management-module",
        "generate-types"
    ];

    for (const moduleIndex in modules) {
        const module = modules[moduleIndex];
        if (required_modules.includes(module.id)) {
            if (!module.enabled) {
                console.log(` -      enabling ${module.id}`);
                modules[moduleIndex].enabled = true;
            } else {
                console.log(` -      ${module.id} already enabled`);
            }
        } else {
            console.log(` -      ${module.id} not required`);
        }
    }

    //patch settings
    const response = await fetch(`${url}/settings`, {
        method: 'PATCH',
        headers: {
            "Cookie": headers.get('cookie'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            module_bar: modules
        })
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} message: ${response.statusText}`);
    }

    console.log(" -  enabled required settings");
}

const importSchema = async (headers, file) => {
    // get filename without extension and path
    const name = file.split('/').pop().split('.').shift();

    const formData = new FormData();
    formData.append('file', fs.createReadStream(file));

    const displayName = name.split("-").pop();

    //get first element to check which key to use
    const firstElement = await fetch(`${url}/items/${displayName}?limit=1`, {
        method: 'GET',
        headers: {
            "Cookie": headers.get('cookie')
        },
    }).then(response => response.json());

    if (firstElement.data.length > 0) {
        console.log(` -  ${displayName} already exists`);
        return;
    }

    console.log(` -  importing ${displayName}`);
    const response = await fetch(`${url}/utils/import/${displayName}`, {
        method: 'POST',
        headers: {
            "Cookie": headers.get('cookie'),
            ...formData.getHeaders(),
        },
        body: formData,
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} message: ${response.statusText}`);
    }
}

const sync_roles_and_permissions = async (headers) => {
    console.log("Syncing roles and permissions...")
    //open file roles-permissions/data.json
    const data = fs.readFileSync('./configuration/roles-permissions/data.json', 'utf8');
    const jsonData = JSON.parse(data);
    const roles = jsonData.roles;

    //post roles array to http://localhost:8055/roles
    console.log(" -  syncing roles")
    const roleResponse = await fetch(`${url}/roles`, {
        method: 'POST',
        headers: {
            "Cookie": headers.get('cookie'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(roles)
    })

    if (!roleResponse.ok) {
        throw new Error(`HTTP error! status: ${roleResponse.status} message: ${roleResponse.statusText}`);
    }

    const permissions = jsonData.permissions;

    //post permissions array to http://localhost:8055/permissions
    console.log(" -  syncing permissions")
    const permissionResponse = await fetch(`${url}/permissions`, {
        method: 'POST',
        headers: {
            "Cookie": headers.get('cookie'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(permissions)
    })

    if (!permissionResponse.ok) {
        throw new Error(`HTTP error! status: ${permissionResponse.status} message: ${permissionResponse.statusText}`);
    }

    console.log(" -  roles and permissions synced");
}

const sync_public_permissions = async (headers) => {
    console.log("Syncing public permissions...")
    //open file roles-permissions/data.json
    const data = fs.readFileSync('./configuration/roles-permissions/public.json', 'utf8');
    const jsonData = JSON.parse(data);

    const permissions = jsonData.data;

    const update_permission_node = async (permission) => {
        const response = await fetch(`${url}/permissions`, {
            method: 'POST',
            headers: {
                "Cookie": headers.get('cookie'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: permission.role,
                collection: permission.collection,
                action: permission.action,
                fields: permission.fields,
                permissions: permission.permissions,
                validation: permission.validation
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} message: ${response.statusText}`);
        }
    }

    for (const permission of permissions) {
        console.log(` -  syncing ${permission.collection} ${permission.action}`);
        await update_permission_node(permission);
    }

    console.log(" -  public permissions synced");
}

const main = async () => {
    //wait until directus is ready
    console.log("Waiting for Directus to be ready...")
    while (true) {
        try {
            await fetch(`${url}/server/ping`);
            console.log("Directus is ready\n")
            break;
        } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log("Starting import")
    const headers = await login();

    // Enable required settings
    await enable_required_settings(headers);

    // Execute "npx directus-sync push" and log its output
    console.log("Pushing schema changes to Directus...")
    execSync('npx directus-sync push');

    // Sync roles and permissions
    //await sync_roles_and_permissions(headers);
    await sync_public_permissions(headers);

    //read all files in the folder
    console.log("Importing collections...")
    let files = fs.readdirSync('./configuration/collections');

    //sort files alphabetically
    files = files.sort();

    for (const file of files) {
        await importSchema(headers, `./collections/${file}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error)
