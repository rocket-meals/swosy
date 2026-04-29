# App Store Review Responses – Credentials Guide

Diese Dokumentation beschreibt, welche Zugangsdaten bereits vorhanden sind und welche noch fehlen, um auf **Apple App Store Reviews** und **Google Play Reviews** automatisiert über die API antworten zu können.

---

## Übersicht: Was ist bereits vorhanden?

### Apple App Store Connect

| Variable (Backend-Name) | Wert / Fundort | Status |
|---|---|---|
| `APP_STORE_CONNECT_KEY_ID` | `EXPO_ASC_KEY_ID` in `packages/common/src/AppleAppStoreConfig.ts` (exportiert von `repo-depkit-common`) | ✅ Bekannt |
| `APP_STORE_CONNECT_ISSUER_ID` | `EXPO_ASC_ISSUER_ID` in `packages/common/src/AppleAppStoreConfig.ts` (exportiert von `repo-depkit-common`) | ✅ Bekannt |
| `APP_STORE_CONNECT_PRIVATE_KEY` | Inhalt der `.p8`-Datei – liegt als **GitHub Repository Secret** `EXPO_APPLE_APPSTORECONNECT_API_KEY_CONTENT` (nur im CI-Kontext); im Backend über `docker-compose.yaml` → `${APP_STORE_CONNECT_PRIVATE_KEY}` | ⚠️ Muss separat beschafft werden |
| App-ID (pro Tenant) | Konstante `appleAppId` in `CustomerAppStoreIds` (`packages/common/src/CustomerAppStoreIds.ts`, exportiert von `repo-depkit-common`); kein Env-Var nötig | ✅ Bekannt (in Code) |

**App-IDs pro Tenant** (aus `CustomerAppStoreIds` in `repo-depkit-common`):
| Tenant | `appleAppId` |
|---|---|
| swosy | `6667117575` |
| studi-futter | `1548108390` |

> ⚠️ Der **Private Key** ist **nicht im Repository** gespeichert – er ist ausschließlich als GitHub Repository Secret hinterlegt und nur während CI/CD-Runs verfügbar.
> Für den Backend-Einsatz muss der Inhalt der `.p8`-Datei separat beschafft und in die Backend-`.env` eingetragen werden (s. unten).

### Google Play

| Variable | Status |
|---|---|
| Service Account JSON | ❌ Fehlt |
| Package Name | ❌ Fehlt |

---

## Was fehlt?

Um im Backend auf Reviews antworten zu können, werden folgende Umgebungsvariablen benötigt:

### Apple (noch in Backend `.env` / `docker-compose.yaml` eintragen)

```env
# App Store Connect API – Review Responses
APP_STORE_CONNECT_KEY_ID=39JT9543R7                         # aus apps/frontend/app/config.ts (EXPO_ASC_KEY_ID)
APP_STORE_CONNECT_ISSUER_ID=a8db47e8-cb43-4861-b383-58ec4f9a9fc6  # aus apps/frontend/app/config.ts (EXPO_ASC_ISSUER_ID)
APP_STORE_CONNECT_PRIVATE_KEY=                              # Inhalt der .p8-Datei (s. unten wie beschaffen)
# APP_ID ist NICHT mehr als Env-Var nötig – wird aus CustomerAppStoreIds in repo-depkit-common gelesen
```

- `KEY_ID` → Konstante `EXPO_ASC_KEY_ID` aus `packages/common/src/AppleAppStoreConfig.ts` (`repo-depkit-common`)
- `ISSUER_ID` → Konstante `EXPO_ASC_ISSUER_ID` aus `packages/common/src/AppleAppStoreConfig.ts` (`repo-depkit-common`)
- `PRIVATE_KEY` → **nicht im Repo** – liegt als GitHub Repository Secret `EXPO_APPLE_APPSTORECONNECT_API_KEY_CONTENT`; wird im Backend über `docker-compose.yaml` als `APP_STORE_CONNECT_PRIVATE_KEY` eingebunden (aus Google Drive oder neu erstellen, s. unten)
- `APP_ID` → **kein Env-Var nötig** – die App-IDs sind als Konstanten in `CustomerAppStoreIds` (`packages/common/src/CustomerAppStoreIds.ts`, importierbar via `repo-depkit-common`) gespeichert: swosy `6667117575`, studi-futter `1548108390`

### Google Play (neu anlegen)

```env
# Google Play Developer API – Review Responses
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=   # Inhalt der Service-Account-JSON-Datei (als String)
GOOGLE_PLAY_PACKAGE_NAME=           # Package Name der App (z.B. de.rocketmeals.app)
```

---

## Wie bekommt man die fehlenden Credentials?

### Apple App Store Connect – API Key (für Review Responses)

Der bestehende API Key (`EXPO_ASC_KEY_ID` = `39JT9543R7`) kann für Review Responses wiederverwendet werden, sofern er die notwendige Berechtigung hat.

1. **Key ID** → `39JT9543R7` (Konstante `EXPO_ASC_KEY_ID` in `packages/common/src/AppleAppStoreConfig.ts`, importierbar via `repo-depkit-common`)
2. **Issuer ID** → `a8db47e8-cb43-4861-b383-58ec4f9a9fc6` (Konstante `EXPO_ASC_ISSUER_ID` in `packages/common/src/AppleAppStoreConfig.ts`, importierbar via `repo-depkit-common`)

3. **Private Key (`.p8`-Datei) beschaffen:**
   - Der Dateiinhalt ist **nicht im Repository** – er liegt nur als GitHub Repository Secret `EXPO_APPLE_APPSTORECONNECT_API_KEY_CONTENT`.
   - **Option A** – Aus dem sicheren Speicher holen: Laut `SSO_APPLE.md` wurde die `.p8`-Datei in Google Drive gespeichert → Dateiinhalt von dort kopieren.
   - **Option B** – Aus GitHub Secrets exportieren: Ein GitHub-Admin kann das Secret unter `https://github.com/<org>/<repo>/settings/secrets/actions` einsehen (Wert ist verdeckt) – er müsste es bei der ursprünglichen Anlage kopiert haben.
   - **Option C** – Neuen Key erstellen (falls Datei nicht mehr verfügbar):
     - Gehe zu [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
     - Klicke auf **„+"**, Name: `Review Responses Key`, Rolle: **Customer Support** oder höher.
     - Notiere **Key ID** und **Issuer ID** (oben auf der Seite).
     - Lade die `.p8`-Datei herunter – **nur einmalig möglich!** → sicher speichern (Google Drive).

4. **Berechtigung des bestehenden Keys prüfen:**
   - Öffne [App Store Connect → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api).
   - Wähle den Key `39JT9543R7` → prüfe ob die Rolle mindestens **Customer Support** enthält.
   - Falls nicht: neuen Key erstellen (s. Option C).

5. **App-IDs (ascAppId) pro Tenant:**
   - Konstanten in `CustomerAppStoreIds` (`packages/common/src/CustomerAppStoreIds.ts`, importierbar via `repo-depkit-common`):
     - `SWOSY_APP_STORE_IDS.appleAppId` → `6667117575`
     - `STUDI_FUTTER_APP_STORE_IDS.appleAppId` → `1548108390`
   - Kein Env-Var nötig – das Backend liest die App-ID direkt aus dem Code-Package.

6. **In `.env` eintragen:**
   ```env
   APP_STORE_CONNECT_KEY_ID=39JT9543R7
   APP_STORE_CONNECT_ISSUER_ID=a8db47e8-cb43-4861-b383-58ec4f9a9fc6
   APP_STORE_CONNECT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<Inhalt der .p8-Datei>\n-----END PRIVATE KEY-----"
   # APP_ID ist nicht mehr nötig – wird aus CustomerAppStoreIds in repo-depkit-common gelesen
   ```

---

### Google Play Developer API – Service Account (für Review Responses)

1. **Google Cloud Projekt wählen und API aktivieren:**
   - Öffne die [Google Cloud Console](https://console.cloud.google.com/).
   - Wähle das Projekt, das mit dem Google Play Developer Account verknüpft ist.
   - Falls noch kein Projekt besteht: Neues Projekt erstellen.
   - **Aktiviere die Google Play Android Developer API** – ohne diesen Schritt erscheint der Menüpunkt „API access" in der Play Console **nicht**:
     - Navigiere zu **APIs & Dienste → Bibliothek** (oder nutze die Suchleiste oben und tippe `Google Play Android Developer API`).
     - Öffne den Eintrag **„Google Play Android Developer API"** und klicke auf **„Aktivieren"** / **„Enable"**.
     - Alternativ: Direktlink zur API → [Google Play Android Developer API aktivieren](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com).

2. **Service Account erstellen:**
   - Navigiere zu **IAM & Admin → Service Accounts**.
   - Klicke auf **„+ Create Service Account"**.
   - Name: z. B. `rocket-meals-review-responder`
   - Keine Cloud IAM-Rolle notwendig (Berechtigungen werden direkt in der Play Console vergeben).
   - Nach dem Erstellen: Wähle den Service Account → **Keys → Add Key → Create new key → JSON**.
   - Die JSON-Datei wird heruntergeladen – **sicher speichern!**

3. **Service Account in Google Play Console verknüpfen:**

   > ⚠️ **Wichtig:** Diese Schritte müssen auf **Konto-Ebene** (nicht innerhalb einer einzelnen App) in der Google Play Console ausgeführt werden.

   > 💡 **Hinweis:** Der Menüpunkt **„API access"** (deutsch: „API-Zugang") erscheint in der Google Play Console unter „Einstellungen/Setup" **erst, nachdem die Google Play Android Developer API in Google Cloud aktiviert wurde** (siehe Schritt 1). Ist die API aktiviert und das Cloud-Projekt mit der Play Console verknüpft, erscheint der Eintrag in der Seitenleiste.

   **3a. API-Zugang einrichten (Konto-Ebene):**
   - Öffne die [Google Play Console auf Konto-Ebene](https://play.google.com/console/developers) – stelle sicher, dass du **keine** App ausgewählt hast (du siehst links die Übersichtsnavigation des Entwicklerkontos).
   - Klicke in der linken Seitenleiste auf **„Setup"** → **„API access"** (deutsch: „Einstellungen" → „API-Zugang").
   - Falls das Google Cloud Projekt noch nicht verbunden ist: Klicke auf **„Link to a project"** und wähle das Projekt aus Schritt 1 aus (oder erstelle ein neues Projekt).
   - Sobald das Projekt verknüpft ist, erscheint darunter der Abschnitt **„Service accounts"** mit den Service Accounts aus deinem Google Cloud Projekt.

   **3b. Berechtigungen für den Service Account vergeben:**
   - Suche deinen soeben erstellten Service Account (z. B. `rocket-meals-review-responder@...iam.gserviceaccount.com`) in der Liste.
   - Klicke rechts daneben auf **„Grant access"** (oder „Manage permissions" / „Zugriff gewähren").
   - Es öffnet sich eine Seite mit zwei Abschnitten: **„Account permissions"** (Konto-Berechtigungen) und **„Add app"** (App-Berechtigungen).
   - Lass die **Account permissions** auf dem Standard (keine globale Rolle nötig).
   - Klicke im Abschnitt **„Add app"** auf **„Add app"** und wähle deine App aus der Liste aus.
   - Nach dem Hinzufügen der App erscheinen darunter die App-spezifischen Berechtigungen. Aktiviere:
     - **„Reply to reviews"** ✅ (unter dem Bereich „Store presence" oder „Replies to reviews")
   - Klicke auf **„Apply"** und anschließend auf **„Invite user"** (oder „Save") um die Berechtigungen zu speichern.

   > 💡 **Hinweis:** Die Berechtigung „Reply to reviews" befindet sich auf **App-Ebene** (nicht auf Konto-Ebene). Es reicht nicht, nur eine Konto-Rolle zu vergeben – die App muss explizit hinzugefügt und die Berechtigung dort aktiviert werden.

   > ⏳ Die Berechtigungen können nach dem Speichern bis zu **24 Stunden** brauchen, bis sie aktiv sind.

4. **Package Name ermitteln:**
   - Öffne die [Google Play Console](https://play.google.com/console) → deine App.
   - Der Package Name steht in der URL und im Dashboard, z. B. `de.rocketmeals.app`.

5. **In `.env` eintragen:**
   ```env
   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com",...}'
   GOOGLE_PLAY_PACKAGE_NAME=de.rocketmeals.app
   ```

---

## API-Endpunkte für Review Responses

### Apple App Store Connect

Die Authentifizierung erfolgt via **JWT** (ES256, signiert mit dem `.p8`-Key).

```
POST https://api.appstoreconnect.apple.com/v1/customerReviewResponses
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "data": {
    "type": "customerReviewResponses",
    "attributes": {
      "responseBody": "Danke für dein Feedback!"
    },
    "relationships": {
      "review": {
        "data": {
          "type": "customerReviews",
          "id": "<review-id>"
        }
      }
    }
  }
}
```

- Reviews lesen: `GET /v1/apps/{appId}/customerReviews`
- Antwort löschen: `DELETE /v1/customerReviewResponses/{id}`
- Docs: https://developer.apple.com/documentation/appstoreconnectapi/customer_reviews_and_review_responses

### Google Play Developer API

Die Authentifizierung erfolgt via **OAuth2** (Service Account).

```
POST https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/reviews/{reviewId}:reply
Authorization: Bearer <OAuth2-Token>
Content-Type: application/json

{
  "replyText": "Danke für dein Feedback!"
}
```

- Reviews lesen: `GET .../reviews` bzw. `GET .../reviews/{reviewId}`
- Docs: https://developers.google.com/android-publisher/api-ref/rest/v3/reviews

---

## Zusammenfassung der benötigten `.env`-Variablen

```env
# Apple App Store Connect – Review Responses
APP_STORE_CONNECT_KEY_ID=39JT9543R7                              # aus apps/frontend/app/config.ts
APP_STORE_CONNECT_ISSUER_ID=a8db47e8-cb43-4861-b383-58ec4f9a9fc6 # aus apps/frontend/app/config.ts
APP_STORE_CONNECT_PRIVATE_KEY=                                    # .p8-Datei Inhalt – aus Google Drive oder neu erstellen
# APP_ID ist nicht mehr nötig – wird aus CustomerAppStoreIds in repo-depkit-common gelesen

# Google Play – Review Responses
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=     # Inhalt der Service-Account-JSON-Datei
GOOGLE_PLAY_PACKAGE_NAME=             # Package Name der Android-App
```
