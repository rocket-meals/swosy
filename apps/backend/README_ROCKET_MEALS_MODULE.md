# Modul „Rocket Meals“ im Directus-Backend

Eigener Bereich in der Directus-Oberfläche (Modul-Leiste links, Raketen-Symbol,
`/admin/rocket-meals`) für Werkzeuge, die nicht in die generischen Ansichten von Directus passen.
Aufbau wie beim Content-Modul: links eine Seitenleiste mit den Seiten, rechts die Seite.

Directus-Module sind Vue-Komponenten (die Directus-Oberfläche selbst ist Vue).
React-Native-/Expo-Screens der Apps lassen sich hier nicht einbinden; geteilt wird stattdessen Logik
aus `repo-depkit-common` und der Übersetzungskatalog.

## Seiten

| Seite            | Pfad                                     | Was sie kann                                                                                                                                                                                                     |
| ---------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Speise-Feedbacks | `/admin/rocket-meals/food-feedbacks`     | Neueste Speise-Feedbacks mit Kommentar, Filter nach Status (Offen, Neu, Wartet auf Antwort, Beantwortet, Erledigt, Alle) mit Anzahl, Suche, Seitenweise. „Antworten“ / „Zum Chat“ öffnet den Chat mit dem Autor. |
| Chat             | `/admin/rocket-meals/food-feedbacks/:id` | Kommentar als erste Nachricht, Verlauf, Antwort schreiben (Strg/⌘+Enter sendet), als erledigt markieren / wieder öffnen, Link zum Datensatz. Neue Nachrichten des Nutzers erscheinen ohne Neuladen (alle 20 s).  |

### Status eines Speise-Feedbacks

| Status             | Bedeutung                               | Daten                                            |
| ------------------ | --------------------------------------- | ------------------------------------------------ |
| Neu                | Kommentar, noch niemand hat geantwortet | `foods_feedbacks.chat` ist leer                  |
| Wartet auf Antwort | Der Nutzer hat zuletzt geschrieben      | `chats.conversation_state = waiting_for_support` |
| Beantwortet        | Support hat zuletzt geschrieben         | `chats.conversation_state = waiting_for_user`    |
| Erledigt           | Von Hand abgeschlossen                  | `chats.conversation_state = resolved`            |

„Offen“ fasst „Neu“ und „Wartet auf Antwort“ zusammen – alles, worum sich jemand kümmern muss.

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

## Neue Seite hinzufügen

1. Eintrag in `RocketMealsModulePages.PAGES`
   (`src/helpers/rocket-meals-module/RocketMealsModulePages.ts`) – Seitenleiste und Übersicht
   entstehen daraus.
2. Route in `src/rocket-meals-module/index.ts`, Komponente unter `src/rocket-meals-module/<seite>/`.
3. Texte als Keys `rocket_meals_module_*` im Backend-Katalog (alle Sprachen), in Komponenten über
   `useAppExtensionTranslate()`.
4. Logik ohne Vue in `src/helpers/rocket-meals-module/` mit Test – die Bundle-Tests laufen in Node.

Ideen für weitere Seiten: Wohnheim-Verwaltung, Renner/Penner-Listen der Speisen.

## Freischaltung

Neue Module zeigt Directus erst, wenn sie in der Modul-Leiste aktiviert sind (Einstellungen →
Projekt → Modul-Leiste). Die ausgelieferten Settings
(`data/directus-sync-data/configuration/directus-config/collections/settings.json`) aktivieren
`rocket-meals` direkt hinter „Insights“. Sichtbar ist das Modul für alle Nutzer mit App-Zugang;
welche Daten sie sehen und schreiben dürfen, regeln wie überall die Directus-Berechtigungen.
