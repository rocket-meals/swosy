# Modul „Rocket Meals“ im Directus-Backend

Eigener Bereich in der Directus-Oberfläche (Modul-Leiste links, Raketen-Symbol,
`/admin/rocket-meals`) für Werkzeuge, die nicht in die generischen Ansichten von Directus passen.
Aufbau wie beim Content-Modul: links eine Seitenleiste mit den Seiten, rechts die Seite.

Directus-Module sind Vue-Komponenten (die Directus-Oberfläche selbst ist Vue).
React-Native-/Expo-Screens der Apps lassen sich hier nicht einbinden; geteilt wird stattdessen Logik
aus `repo-depkit-common` und der Übersetzungskatalog.

## Seiten

| Seite            | Pfad                                     | Was sie kann                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Speise-Feedbacks | `/admin/rocket-meals/food-feedbacks`     | Neueste Speise-Feedbacks mit Kommentar und Bild der Speise. Filter nach Status (Offen, Neu, Wartet auf Antwort, Beantwortet, Erledigt, Alle) mit Anzahl, nach Mensen (Mehrfachauswahl), Speise (Name) und Bewertung (Schlecht 1–2, Mittel 3, Gut 4–5, Ohne); Sortierung nach Datum oder Bewertung; Suche im Kommentar; Seitengröße 10/25/50/100. Mensen, Sortierung und Seitengröße merkt sich der Browser. „Als erledigt markieren“ direkt in der Liste, per Checkbox auch mehrere auf einmal. „Antworten“ / „Zum Chat“ öffnet den Chat mit dem Autor. |
| Chat             | `/admin/rocket-meals/food-feedbacks/:id` | Kommentar als erste Nachricht, Verlauf, Antwort schreiben (Eingabe wie im Claude-Chat: Enter sendet, Shift+Enter neue Zeile, auf dem Handy Senden-Knopf), Status über den Status-Chip ändern (Wartet auf Antwort / Beantwortet / Erledigt), Link zum Datensatz. Neue Nachrichten des Nutzers erscheinen ohne Neuladen (alle 20 s).                                                                                                                                                                                                                      |
| Live-Puls        | `/admin/rocket-meals/live-pulse`         | Für den zweiten Bildschirm: wer heute aktiv war (Avatar, Nickname, „vor 3 Minuten“; Ring grün unter 15 min, orange unter 1 h), ein Ticker aus Speise-Feedbacks, angekündigten Mensa-Besuchen, neuen Profilen und anonymen `app_usage_events`, Kennzahlen (aktiv in den letzten 15 min, heute aktiv, neue Profile, Gerichte angesehen, Speise-Feedbacks) und ein Balkendiagramm der aktiven Nutzer pro Stunde aus `directus_activity`. Aktualisiert sich alle 30 s.                                                                                      |

### Status eines Speise-Feedbacks

| Status             | Bedeutung                               | Daten                                            |
| ------------------ | --------------------------------------- | ------------------------------------------------ |
| Neu                | Kommentar, noch niemand hat geantwortet | `foods_feedbacks.chat` ist leer                  |
| Wartet auf Antwort | Der Nutzer hat zuletzt geschrieben      | `chats.conversation_state = waiting_for_support` |
| Beantwortet        | Support hat zuletzt geschrieben         | `chats.conversation_state = waiting_for_user`    |
| Erledigt           | Von Hand abgeschlossen                  | `chats.conversation_state = resolved`            |

„Offen“ fasst „Neu“ und „Wartet auf Antwort“ zusammen – alles, worum sich jemand kümmern muss.

Der Status lässt sich im Chat über den Status-Chip von Hand setzen, „Erledigt“ auch direkt in der
Liste (einzeln oder für alle ausgewählten; bestehende Chats in einem Request, siehe
`src/helpers/rocket-meals-module/FoodFeedbackChatActions.ts`). Hat ein Feedback noch keinen Chat,
wird er dabei angelegt (der Status steht in `chats.conversation_state`) – der Autor sieht den Chat
dann in der App, auch ohne Antwort. „Neu“ ist nicht wählbar: es bedeutet nur „noch kein Chat“.

### Was beim ersten Antworten passiert

Die erste Antwort legt den Chat an, genau in der Form, die der `app-feedbacks-hook` für
App-Feedbacks anlegt, damit der Autor ihn in der App sieht:

1. `chats` mit `alias` „Feedback zu &lt;Speise&gt;“ (in der Sprache des Autors aus
   `profiles.language`), `initial_message` = Kommentar, `conversation_state = waiting_for_support`.
2. `chats_participants` mit dem Profil des Autors.
3. `foods_feedbacks.chat` zeigt auf den Chat.
4. Die Nachricht selbst als `chat_messages` **ohne** `profile` – daran erkennen App und Hook eine
   Support-Nachricht. Der `chat-conversation-state-hook` setzt den Status auf „Beantwortet“ und
   schickt dem Autor eine Push-Benachrichtigung.

Feedbacks ohne Profil können nicht beantwortet werden; es gäbe niemanden, der den Chat sieht.

Der `chat-conversation-state-hook` erkennt Support jetzt an der App-Berechtigung des Schreibenden
(`accountability.app`) und nicht mehr nur an Admin-Rechten – so werden auch Antworten von
Mensa-Mitarbeitenden mit eigener Rolle richtig als Support gewertet.

## Gemeinsame Logik in `repo-depkit-common`

Die Regeln hinter den Chats stehen nicht im Modul, sondern in `packages/common` – so rechnen App,
Directus-Hooks und Modul garantiert gleich. Im Bundle bleibt nur, was Directus-spezifisch ist
(Darstellung, Icons, Endpunkte, Feldlisten:
`src/helpers/rocket-meals-module/FoodFeedbackChatHelper.ts`).

| Helper (`repo-depkit-common`)  | Was er regelt                                                                                                                                   | Genutzt von                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `ChatHelper`                   | Support- vs. Nutzer-Nachricht, Status nach einer Nachricht, Sortierung, neuer Support-Chat, Teilnehmer                                          | `chat-conversation-state-hook`, `app-feedbacks-hook`, Modul, App-Chat |
| `FoodFeedbackChatStatusHelper` | Status eines Speise-Feedbacks, Filter (Directus-Filter und im Speicher), wer beantwortet werden kann, Sprache des Autors, Chat für ein Feedback | Modul; für eine Ansicht in der App direkt nutzbar                     |
| `RelationHelper`               | ID einer Relation, egal ob als Schlüssel oder als ausgeklappte Zeile geladen                                                                    | Modul, Chat-Logik                                                     |

Neue Logik, die auch eine App brauchen könnte, gehört dorthin (mit Test unter
`packages/common/src/__tests__/`). Code, der in die Directus-Oberfläche gebündelt wird, importiert
sie per Deep-Import (`repo-depkit-common/src/ChatHelper`), damit der Paket-Index nicht
moment-timezone und Co. in den Browser zieht.

## Sprache

Alle Texte des Moduls und der `[Erweitert]`-Panels erscheinen in der Sprache, in der Directus selbst
gerade angezeigt wird – nicht in der Sprache des Browsers. Directus nimmt die Sprache aus dem
Benutzerprofil (`Sprache`), sonst die Projekt-Standardsprache (Einstellungen → Projekt) und schreibt
sie nach `<html lang>`; `useAppExtensionTranslate()` liest genau das und wechselt bei einer Änderung
sofort mit.

## Neue Seite hinzufügen

1. Eintrag in `RocketMealsModulePages.PAGES`
   (`src/helpers/rocket-meals-module/RocketMealsModulePages.ts`) – Seitenleiste und Übersicht
   entstehen daraus.
2. Route in `src/rocket-meals-module/index.ts`, Komponente unter `src/rocket-meals-module/<seite>/`.
3. Texte als Keys `rocket_meals_module_*` im Backend-Katalog (alle Sprachen), in Komponenten über
   `useAppExtensionTranslate()`.
4. Fachlogik nach `packages/common` (siehe oben), Directus-spezifische Logik ohne Vue in
   `src/helpers/rocket-meals-module/` – beides mit Test, die Tests laufen in Node.

### Live-Puls: woher die Daten kommen

| Anzeige            | Quelle                                                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zuletzt aktiv      | `profiles.date_updated` (die App setzt es beim Start und bei jedem Wechsel in den Vordergrund), heute, neueste zuerst                                                                                      |
| Avatare            | `GET /profile-avatar/<profileId>?size=64` – zeichnet `profiles.avatar` mit derselben Logik wie die App (`AvatarSvg` in `repo-depkit-common-ui`)                                                            |
| Gerichte angesehen | `app_usage_events` mit `food_details_opened`, geschrieben vom `food-details-usage-event-hook` beim Abruf `GET /items/foodoffers/<id>` aus einer App; anonym, `session_id` = `Backend_<Jahr>_<Monat>_<Tag>` |
| Diagramm           | verschiedene Nutzer pro Stunde in `directus_activity`, nur Collections, in denen App-Nutzer schreiben (Mitarbeitende, die Speisen pflegen, zählen nicht)                                                   |

Die Avatare werden absichtlich auf dem Server gezeichnet: die DiceBear-Stile sind rund 2 MB
JavaScript und würden sonst mit jeder Seite der Directus-Oberfläche geladen. Die Stunden fragt die
Seite einzeln mit Zeitstempeln ab statt mit Directus' `hour()`, damit in der Zeitzone des Browsers
gezählt wird.

Ideen für weitere Seiten: Wohnheim-Verwaltung, Renner/Penner-Listen der Speisen.

## Freischaltung

Neue Module zeigt Directus erst, wenn sie in der Modul-Leiste aktiviert sind (Einstellungen →
Projekt → Modul-Leiste). Die ausgelieferten Settings
(`data/directus-sync-data/configuration/directus-config/collections/settings.json`) aktivieren
`rocket-meals` direkt hinter „Insights“. Sichtbar ist das Modul für alle Nutzer mit App-Zugang;
welche Daten sie sehen und schreiben dürfen, regeln wie überall die Directus-Berechtigungen.
