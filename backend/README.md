# RocketMealsBackend

# Configuration

## Whitelist Redirects

- In the Backend at `App Settings` under `Redirect Whitelist` add:
  - For expo: `exp://*`
  - For our GitHub Page: `https://rocket-meals.github.io/<subdomain>/`
  - For our app: `app-rocket-meals-<subdomain>://*`

# Server Installtion

Similar steps can be made for local testing

- Create a New Repo for each customer
- Strato Server einrichten
    - Domain Umleiten:
        - Domainverwaltung
            - Subdomain anlegen
            - DNS-Verwaltung
                - A-Record
                    - Eigene IP-Adresse:
                        - Server IP eintragen
- Debian 11
    - Install Node.js and npm
        - "sudo apt install nodejs npm"
    - Install docker:
        - `wget https://gist.githubusercontent.com/angristan/389ad925b61c663153e6f582f7ef370e/raw/02c56807863ce73b84faa582468cc2e71637067c/install_docker.sh`
        - `chmod +x install_docker.sh`
        - `./install_docker.sh`
        - Alternative?
              - docker-compose version 1.29.2, build 5becea4c
              - `sudo apt-get purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras` (https://docs.docker.com/engine/install/ubuntu/)
                  - `sudo su -l $USER`
                  - `sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose`
                  - `sudo chmod +x /usr/local/bin/docker-compose`
    - curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
      - Remove any other nodejs: sudo apt auto-remove nodejs
      - nvm install 18
      - nvm use 18
      - nvm alias default 18
        - If you get an error: Node not found, try: sudo ln -s /root/.nvm/versions/node/v18.19.1/bin/node /usr/local/bin/node
    - curl -o- -L https://yarnpkg.com/install.sh | bash
    - exit terminal and restart // no source will not help
    - sudo apt install git
    - `git config --global credential.helper store`
        - Allow git to store the credentials later
    - `git clone https://github.com/FireboltCasters/Server-Toplevel-Proxy`
        - `cd Server-Toplevel-Proxy`
        - `nano .env`
        - Change MYHOST to `<subdomain.rocket-meals.de>`
        - `docker-compose up -d`
    - `git clone <Forked RocketMeals Backend Server>`
        - `cd RocketMealsBackend`
        - `nano .env`
            - "DOMAIN_PRE=http" --> "DOMAIN_PRE=https"
            - "MYHOST=127.0.0.1" --> "MYHOST=<subdomain>.rocket-meals.de"
            - "DOMAIN_PATH=rocketmeals" --> "DOMAIN_PATH=backend"
        - `./permissionDatabase.sh`
            - An error message, data.db not found, is normal
        - Test Server
            - `docker-compose up`
            - Should start and fail first time, then auto reboots after required files created
            - `docker-compose down`
        - Apply latest scheme
            - "cd Backend"
            - "npm install"
            - "npm run schema-apply:latest"
    - `git clone <Forked RocketMeals Frontend Server>`


## Configure Email

- 1. Zunächst müssen Sie in Ihrem Gmail-Account die Zweifaktor-Authentifizierung "Bestätigung in zwei Schritten" aktivieren.
- 2. Danach können Sie ein App-Passwort für lexoffice generieren: https://myaccount.google.com/apppasswords Wählen Sie hier einen Namen und generieren Sie das Passwort.
- 3. Das generierte 16-stellige Passwort müssen Sie nun nur noch abspeichern

==> Weitere Mail Adressen:
- Google Admin Console: Neuen E-Mail Alias hinzufügen
  - Admin Console --> Nutzer --> Alternative E-Mail-Adressen hinzufügen
- In den Kontoeinstellungen den Alias aktivieren: https://support.google.com/mail/answer/22370
  - Öffnen Sie Gmail auf dem Computer.
  - Klicken Sie rechts oben auf "Einstellungen" Einstellungen und dann Alle Einstellungen aufrufen.
  - Klicken Sie auf den Tab Konten & Import oder Konten.
  - Klicken Sie im Abschnitt "Senden als" auf Weitere E-Mail-Adresse hinzufügen.
  - Geben Sie Ihren Namen und die E-Mail-Adresse ein, über die Sie E-Mails senden möchten.


## Configure Directus

- `docker-compose build`
- `docker-compose up`
- Enable Extension: Types
  - `http://127.0.0.1/rocket-meals/api/admin/settings/project`
    - Check "Generate Types" Extension

## Configure Flows

- See

Create a new directus flow
Trigger Setup --> Configure as Schedule (CRON)
Create a operation --> Update Data
Collection: Auto Backup Settings
Permission: Full Access
Emit Events: true
Payload : { "state": "create", "latest_log": "" }
Query : { "filter": { "_and": [] } }


## Configure SSO

- Check that a role for "User" exists
  - Permissions for User configured:
    - Permission: Delete User: Custom: Rule: ID equals $CURRENT_USER
    - Other Permissions
  - Copy the RoleId (in the url)
  - 
- open docker-compose.yaml
- use Directus docks for adding new SSO https://docs.directus.io/configuration/config-options/#sso-oauth2-and-openid


## Contributing - Database Schema

- Read the file at ./Backend/README.md


### Apple SSO
Since the SSO for Apple is a bit more to do, read the file: "SSO_APPLE.md"


### Email-Invites

#### Email-SMTP-Setup Strato



## Troublshooting

### SQLITE_READONLY: attempt to write a readonly database

```
SQLITE_READONLY: attempt to write a readonly database
```

run the `./permissionDatabase.sh` script.

### SQLITE_BUSY: typically after restart

Server seems to be stopped during an transaction
See for a "-journal.db" file and delete it.

#### SSO Login error

```
{"errors":[{"message":"Route /undefinedvcl4421NN-JEZAVRZcD24tyAbRwgCb6DzCt5JkeuFFzlZTkJi3gtsZryOHZFJcjJ doesn't exist.","extensions":{"code":"ROUTE_NOT_FOUND"}}]}
```

Check if the RoleId for the SSO-User is set correctly in the `docker-compose.yaml` file. The RoleId can be found in `.env` or in the `docker-compose.yaml` file.


## Project Settings

- Default Rocket Meals Color: #EE581F