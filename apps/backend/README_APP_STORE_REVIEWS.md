# App Store Review Responses – Credentials Guide

Diese Dokumentation beschreibt, welche Zugangsdaten bereits vorhanden sind und welche noch fehlen, um auf **Apple App Store Reviews** und **Google Play Reviews** automatisiert über die API antworten zu können.

---

## Übersicht: Was ist bereits vorhanden?

### Apple App Store Connect

| Variable | Wo definiert | Status |
|---|---|---|
| `EXPO_ASC_KEY_ID` | `apps/frontend/app/config.ts` | ✅ Vorhanden (`39JT9543R7`) |
| `EXPO_ASC_ISSUER_ID` | `apps/frontend/app/config.ts` | ✅ Vorhanden (`a8db47e8-...`) |
| `EXPO_APPLE_APPSTORECONNECT_API_KEY_CONTENT` | GitHub Secrets (CI only) | ✅ Vorhanden (nur für EAS Build) |
| `EXPO_APPLE_TEAM_ID` | `apps/frontend/app/config.ts` | ✅ Vorhanden (`6U99CRVHVR`) |
| App Store App-ID (`ascAppId`) | `apps/frontend/app/tenants/eas/*.json` | ✅ Vorhanden (pro Tenant) |

> ⚠️ Diese Werte sind aktuell **ausschließlich im CI/CD-Kontext (GitHub Actions)** nutzbar.
> Für den Backend-Hook müssen sie zusätzlich als **Umgebungsvariablen im Backend** bereitgestellt werden (`.env` + `docker-compose.yaml`).

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
APP_STORE_CONNECT_KEY_ID=           # Key ID des App Store Connect API Keys
APP_STORE_CONNECT_ISSUER_ID=        # Issuer ID des App Store Connect Accounts
APP_STORE_CONNECT_PRIVATE_KEY=      # Inhalt der .p8-Datei (mehrzeilig, z.B. -----BEGIN PRIVATE KEY-----\n...)
APP_STORE_CONNECT_APP_ID=           # Numerische App-ID (z.B. 6667117575) – eine pro Tenant
```

> `KEY_ID` und `ISSUER_ID` sind bereits bekannt (`EXPO_ASC_KEY_ID` / `EXPO_ASC_ISSUER_ID` in `config.ts`).
> Das `.p8`-File ist in `EXPO_APPLE_APPSTORECONNECT_API_KEY_CONTENT` als GitHub Secret gespeichert – dieser Inhalt muss auch in die Backend-`.env` übertragen werden.

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

1. **Key ID und Issuer ID** sind bereits bekannt (s. `apps/frontend/app/config.ts`).

2. **Berechtigung prüfen:**
   - Öffne [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
   - Wähle den bestehenden Key (`39JT9543R7`) aus.
   - Stelle sicher, dass die Rolle mindestens **Customer Support** (für Review Responses) hat.
   - Falls nicht: neuen Key mit korrekter Rolle erstellen (s. unten).

3. **Neuen API Key erstellen (falls nötig):**
   - Gehe zu [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
   - Klicke auf **„+"** (Generate API Key).
   - Name: z. B. `Review Responses Key`
   - Rolle: **Customer Support** oder höher
   - Klicke **Generate**.
   - Notiere:
     - **Key ID** (wird in der Liste angezeigt)
     - **Issuer ID** (oben auf der Seite, einmalig pro Account)
   - Lade die `.p8`-Datei herunter – **sie kann nur einmalig heruntergeladen werden!**
   - Speichere den Dateiinhalt sicher (z. B. in einem Passwortmanager oder Google Drive).

4. **App-ID (ascAppId) ermitteln:**
   - Gehe zu [App Store Connect → My Apps](https://appstoreconnect.apple.com/apps)
   - Öffne die gewünschte App.
   - Die numerische App-ID steht in der URL: `https://appstoreconnect.apple.com/apps/**6667117575**/...`
   - Alternativ: In `apps/frontend/app/tenants/eas/*.json` unter `submit.production.ios.ascAppId`.

5. **In `.env` eintragen:**
   ```env
   APP_STORE_CONNECT_KEY_ID=39JT9543R7
   APP_STORE_CONNECT_ISSUER_ID=a8db47e8-cb43-4861-b383-58ec4f9a9fc6
   APP_STORE_CONNECT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<Inhalt der .p8-Datei>\n-----END PRIVATE KEY-----"
   APP_STORE_CONNECT_APP_ID=6667117575
   ```

---

### Google Play Developer API – Service Account (für Review Responses)

1. **Google Cloud Projekt wählen:**
   - Öffne die [Google Cloud Console](https://console.cloud.google.com/).
   - Wähle das Projekt, das mit dem Google Play Developer Account verknüpft ist.
   - Falls noch kein Projekt besteht: Neues Projekt erstellen und die [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com) aktivieren.

2. **Service Account erstellen:**
   - Navigiere zu **IAM & Admin → Service Accounts**.
   - Klicke auf **„+ Create Service Account"**.
   - Name: z. B. `rocket-meals-review-responder`
   - Keine Cloud IAM-Rolle notwendig (Berechtigungen werden direkt in der Play Console vergeben).
   - Nach dem Erstellen: Wähle den Service Account → **Keys → Add Key → Create new key → JSON**.
   - Die JSON-Datei wird heruntergeladen – **sicher speichern!**

3. **Service Account in Google Play Console verknüpfen:**
   - Öffne die [Google Play Console](https://play.google.com/console).
   - Gehe zu **Setup → API access**.
   - Verbinde das Google Cloud Projekt (falls noch nicht verbunden).
   - Scrolle zu **„Service accounts"** und klicke auf **„Grant access"** beim erstellten Service Account.
   - Weise folgende Berechtigungen zu:
     - **Reply to reviews** ✅
   - Speichere die Änderungen.

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
APP_STORE_CONNECT_KEY_ID=             # bereits bekannt: 39JT9543R7
APP_STORE_CONNECT_ISSUER_ID=          # bereits bekannt: a8db47e8-cb43-4861-b383-58ec4f9a9fc6
APP_STORE_CONNECT_PRIVATE_KEY=        # Inhalt der .p8-Datei (aus GitHub Secret EXPO_APPLE_APPSTORECONNECT_API_KEY_CONTENT)
APP_STORE_CONNECT_APP_ID=             # Numerische App-ID, z.B. 6667117575

# Google Play – Review Responses
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=     # Inhalt der Service-Account-JSON-Datei
GOOGLE_PLAY_PACKAGE_NAME=             # Package Name der Android-App
```
