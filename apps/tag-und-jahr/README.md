# Tag und Jahr – iPhone-Widget-App

Eine Expo-App, deren Kern ein iOS-Home-Bildschirm-Widget ist: eine Jahresuhr als Objekt zur Betrachtung vergehender Zeit.

Das Widget zeigt nur vier Elemente:

- eine **gelbe Jahresscheibe**,
- eine **braune Tagesscheibe**,
- einen **roten Strich**, der den 21. März (Frühlingsbeginn) darstellt und in einem Jahr einmal im Kreis wandert – am Frühlingsbeginn steht er auf zwölf Uhr,
- einen **winzigen blauen Punkt**, der in 24 Stunden einmal um das Zentrum wandert – um Mitternacht (Ortszeit) steht er auf zwölf Uhr.

Es zeigt keine Uhrzeit und keine Beschriftungen. Es ist keine „normale" Uhr: Es geht nicht um die Uhrzeit, sondern um die Wahrnehmung des Vergehens der Zeit.

## Technik

Anders als bei einem manuell gepflegten Xcode-Projekt entsteht das Widget hier komplett aus dem Expo-Workflow:

- **[`expo-widgets`](https://docs.expo.dev/versions/latest/sdk/widgets/)** (ab Expo SDK 55, hier SDK 57) erzeugt beim Prebuild das Widget-Extension-Target, die App Group und alle nötigen Dateien. Kein manueller Xcode-Schritt nötig – auch EAS-Builds (TestFlight) funktionieren damit unverändert.
- Das Widget-Layout ist in TypeScript geschrieben ([`frontend/widgets/TagUndJahrWidget.tsx`](frontend/widgets/TagUndJahrWidget.tsx)) und rendert echte SwiftUI-Views über `@expo/ui/swift-ui`. Die `'widget'`-Direktive bündelt die Funktion isoliert für die Widget-Extension; deshalb stehen alle Farben und Formeln inline in der Funktion (keine Imports möglich).
- Die Uhr wird direkt mit SwiftUI-Formen gezeichnet (Kreise, Kapsel) – keine externe Bilddatei nötig, dadurch bleibt die Darstellung in allen Widgetgrößen scharf.
- Die App selbst ([`frontend/app/index.tsx`](frontend/app/index.tsx)) zeigt dieselbe Uhr per SVG und plant bei jedem Start bzw. jeder Rückkehr in den Vordergrund die Widget-Timeline neu: Zustände im Abstand von **30 Minuten** für die nächsten 7 Tage. WidgetKit garantiert keine minutengenaue Aktualisierung; iOS entscheidet, wann es die Zustände tatsächlich rendert. Für ein kontemplatives Objekt ist diese Unschärfe sachgerecht.
- Die Zeitmathematik liegt testbar in [`frontend/helpers/clock.ts`](frontend/helpers/clock.ts) (Jest-Tests in `frontend/__tests__/`).

### Funktionslogik

- **Tagespunkt:** `Sekunden seit örtlicher Mitternacht / 86.400 × 360°`, Start oben, im Uhrzeigersinn.
- **Jahresmarke:** `Zeit seit letztem 21. März / Jahreszyklus × 360°`, Start oben am Frühlingsbeginn, im Uhrzeigersinn.

### Apple-Capabilities (App Groups, Push)

> ⚠️ **Niemals `EXPO_NO_CAPABILITY_SYNC=1` setzen.** Die Apple-Capabilities (App Groups für das Widget, Push Notifications) sollen **immer automatisch** mit den Entitlements der App synchronisiert werden – manuelles Pflegen im Developer-Portal driftet zwangsläufig auseinander.
>
> Hintergrund: eas-cli/`@expo/apple-utils` schickt den Capability-Sync als einen Sammel-PATCH, den die heutige App-Store-Connect-API ablehnt („Unexpected or invalid value at 'data.relationships.bundleIdCapabilities.data.[0].attributes'"). Der Credentials-Bootstrap ([`scripts/eas-setup-ios-build-credentials.js`](../../scripts/eas-setup-ios-build-credentials.js), läuft in der CI vor `eas build`) ersetzt deshalb genau diesen einen Aufruf durch die dokumentierten Einzel-Requests (POST/DELETE `/v1/bundleIdCapabilities`) – gleiche Sync-Semantik, funktionierendes Request-Format. Sobald die Capabilities stimmen, ist jeder weitere Sync (auch der in `eas build`) ein No-op und der fehlerhafte Codepfad wird gar nicht mehr erreicht. Sollte der Fehler upstream gefixt werden, kann dieser Patch entfallen; der Auto-Sync bleibt in jedem Fall an.

### Grenzen

- `expo-widgets` ist als Alpha gekennzeichnet – API-Details können sich mit künftigen SDKs ändern.
- Das Widget benötigt einen Development Build bzw. TestFlight-Build (nicht Expo Go) und iOS 17 oder neuer.
- Auf Android und im Web läuft nur die In-App-Ansicht; das Home-Widget ist iOS-only (der Android-Support von `expo-widgets` ist noch experimentell und hier bewusst nicht aktiviert).

## Entwicklung

```bash
yarn workspace tag-und-jahr start     # Metro/Expo Dev Server
yarn workspace tag-und-jahr test      # Jest-Tests der Zeitmathematik
yarn workspace tag-und-jahr ios       # Lokaler iOS-Build (Mac mit Xcode nötig)
```

Build & TestFlight laufen wie bei Geonexia und Score Tracker über die CI (`.github/workflows/ci.yml`): Build-Nummer in [`frontend/config.ts`](frontend/config.ts) erhöhen, auf `master` mergen, der Rest passiert automatisch (EAS-Build, TestFlight-Upload, OTA-Updates). Beim ersten CI-Lauf legt die Action das EAS-Projekt automatisch an (`eas init`) und ergänzt die Projekt-ID in `app.config.ts`. Für den iOS-Build muss die App einmalig in App Store Connect angelegt und die Apple-ID der App in `frontend/config.ts` (`appleAppId`) sowie `frontend/eas.json` (`ascAppId`) eingetragen werden.
