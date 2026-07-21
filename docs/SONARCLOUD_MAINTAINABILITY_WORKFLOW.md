# SonarCloud Maintainability-Workflow (für KI-Agenten)

Dieser Workflow beschreibt, wie die verbleibenden SonarCloud-Maintainability-Issues
schrittweise abgearbeitet werden. Wenn der Nutzer z. B. schreibt „mach mit den
Maintainability-Issues weiter", ist genau dieser Ablauf gemeint.

## Ablauf

1. **Issues zählen und sortieren**

   ```bash
   node scripts/count-sonar-maintainability-issues.js
   ```

   Das Script liest `reports/sonarCloud/report_maintainability.csv`, gruppiert die
   Issues nach Meldungstyp und gibt die Top 10 mit Anzahl aus. Zur Gruppierung
   werden Zahlen sowie zitierte Bezeichner in den Meldungen normalisiert (z. B.
   zählt `Remove this useless assignment to variable "setNickname"` als
   `... to variable "X"`). Keyword-Zitate, die die Regel selbst ausmachen (z. B.
   `` `Set` ``, `` `.some(…)` ``, `` `readonly` ``), bleiben erhalten — Liste
   `KEYWORD_QUOTES` im Script bei Bedarf ergänzen.

2. **Top 10 dem Nutzer nennen** — immer mit Anzahl pro Typ.

3. **Häufigsten Typ beheben** — alle Vorkommen dieses Typs refactoren.
   - Die betroffenen Stellen (Datei + Zeile) stehen in
     `reports/sonarCloud/report_maintainability.csv`
     (Spalten: `Key,Message,Component,Line`; `Component` hat das Präfix
     `rocket-meals_rocket-meals:`).
   - Achtung: Die Zeilennummern beziehen sich auf den Stand des letzten
     SonarCloud-Scans. Vor jeder Änderung prüfen, ob die Zeile noch zum
     gemeldeten Issue passt; bei Abweichung die Stelle manuell suchen.
   - Für mechanische Fixes bevorzugt einen kleinen Codemod schreiben, der die
     CSV einliest und nur Zeilen ändert, die dem erwarteten Muster entsprechen
     (Mismatches loggen statt blind ersetzen).

4. **Wenn der häufigste Typ weniger als 10 Vorkommen hat**, zusätzlich den
   nächsthäufigsten Typ mit beheben (so lange fortsetzen, bis insgesamt ein
   sinnvoller Umfang erreicht ist bzw. ein Typ ≥ 10 Vorkommen abgearbeitet wurde).

5. **Verifizieren**
   - Nur die gemeldeten Stellen anfassen, keine ungefragten Umbauten.
   - Prüfen, dass der Fix keine Semantik ändert (z. B. bei `readonly`:
     sicherstellen, dass die Property nirgends neu zugewiesen wird — auch
     Compound-Zuweisungen `+=`, `++` und Bracket-Zugriffe `Class['prop'] = ...`
     prüfen). Stellen, an denen der Fix nicht möglich ist, unverändert lassen
     und im PR dokumentieren.
   - Wenn möglich Typecheck/Build der betroffenen Workspaces laufen lassen.

6. **PR erstellen**
   - Branch: den vom Task vorgegebenen `claude/...`-Branch verwenden.
   - Niemals direkt auf `master` pushen (PR-Pflicht, siehe `AGENTS.md`).
   - Im PR-Text: behobenen Issue-Typ, Anzahl der Fixes, bewusst ausgelassene
     Stellen mit Begründung sowie die aktuelle Top-10-Liste aufführen.

## Noch offen

Bereits erledigte Issue-Typen werden nicht mehr in diesem Dokument mitgeführt —
der aktuelle Stand ergibt sich aus `node scripts/count-sonar-maintainability-issues.js`
bzw. dem nächsten SonarCloud-Scan. Details zu bereits gefixten Typen stehen in
der Git-/PR-Historie.

**Brauchen individuelle Refactorings statt mechanischer Fixes (Stand 2026-07-21):**
„Cognitive Complexity" (109x). Diesen Typ in kleinen, thematisch gruppierten PRs angehen.

„Move this component definition out of the parent component" war trotz der
weiter unten dokumentierten Abarbeitung erneut mit 67 Vorkommen im CSV
vertreten (Stand 2026-07-21, erste Runde) — die aktuelle CSV wird nur per
CI-Scan aktualisiert, daher zeigt sie diese 67 Stellen weiterhin an, obwohl
sie in der zweiten Runde desselben Tages (siehe unten) bereits erneut
komplett abgearbeitet wurden. Nach dem nächsten SonarCloud-Scan sollte diese
Zahl auf 0 (bzw. nur noch `FoodItem.tsx:324`) fallen; falls nicht, vor der
nächsten Runde die CSV neu durchsehen statt sich auf diese Notiz zu verlassen.

TODO-Kommentare (36x, Regel „Complete the task associated to this TODO
comment") werden **nicht mehr hier gefixt**, sondern in Tracking-Issue
[#3984](https://github.com/rocket-meals/rocket-meals/issues/3984) verschoben:
Für jede der 36 Stellen enthält das Issue einen GitHub-Permalink (Datei +
Zeile zum Stand des Commits, an dem die TODOs entfernt wurden) sowie den
ursprünglichen Kommentartext. Die TODO-Zeilen selbst wurden aus dem Code
entfernt (nur der Kommentar, keine Logik geändert) — das eigentliche
Nachholen der Arbeit passiert über das Issue, nicht über diesen Workflow.

Am 2026-07-21 zusätzlich mechanisch abgearbeitet:
- **„Mark the props of the component as read-only"** (7x): die betroffenen
  Komponenten-Parameter wurden in `Readonly<{...}>` gewrappt (bestehende
  Konvention im Repo für Inline-Prop-Typen).
- **„`X` should be a `Set`..."** (9x) und **„This pattern can be replaced
  with 'X'"** (10x, redundante Ein-Zeichen-Regex-Zeichenklassen): Arrays, die
  nur für Existenzprüfungen genutzt werden, wurden zu `Set` +
  `.has(...)` konvertiert (jede Fundstelle wurde vorher auf inkompatible
  Array-only-Nutzung wie Indexzugriff/`.length`/Sortierung geprüft); die
  Regex-Zeichenklassen (`[/]`, `["]`, `[+]`, …) wurden durch das
  literale/escapte Zeichen ersetzt.
- **„Review this redundant assignment..."** (9x): 8 von 9 Stellen waren
  echte tote Zuweisungen (Variable wird auf allen Pfaden mit demselben Wert
  belegt, den sie schon hält) und wurden entfernt.
  `packages/common-ui/src/components/CardWithText/index.tsx:112` wurde
  **bewusst unverändert gelassen** — dort wird `resolvedAspectRatio` aus dem
  `aspectRatio`-Prop (beliebige Zahl, nicht nur der Default `1`) neu belegt;
  die Werte stimmen nur zufällig für quadratische Verhältnisse überein,
  Entfernen würde individuelle Aspect-Ratios stillschweigend brechen.
- **„'X' is deprecated"** (3 von 18x): nur die mechanisch sicheren Stellen —
  `hashHelper.ts` (`.substr` → `.slice`) sowie die zwei Aufrufstellen von
  `TranslationHelper.updateItemTranslations` mit veralteter Signatur
  (`food-sync-hook/ParseSchedule.ts:1184`,
  `news-sync-hook/NewsParseSchedule.ts:72`). Die übrigen 15 Stellen
  (Cesium-Deprecations `hexTilesEnclosed`/`billboardsFlat`/
  `billboardAnchorColor` in Geonexia, `CollectionHelper`-Methoden,
  `newWindow.document.write`) brauchen fachliche Migration und wurden
  bewusst nicht angefasst.

Am 2026-07-21 (zweite Runde desselben Tages) zusätzlich abgearbeitet:

- **„Move this component definition out of the parent component"** — die
  erneut aufgetauchten 67 Vorkommen (siehe Hinweis oben) wurden komplett
  abgearbeitet. Es handelte sich fast durchgehend um denselben Rest-Fall:
  Eine frühere Runde hatte den JSX-Inhalt bereits in eine benannte
  Modul-Ebene-Komponente ausgelagert (`HeaderIconButton`, `TabIconButton`,
  `NavigationTriggerButton`, `TranslatedMenuHeader`/`TranslatedStackHeader`
  u. Ä.), aber die umschließende Inline-Arrow-Funktion
  (`trigger={triggerProps => (<X .../>)}` bzw. `header: () => (<X .../>)`)
  blieb im Elternkomponenten-Body stehen — syntaktisch weiterhin eine
  „Funktion, die JSX zurückgibt, verschachtelt im Elternkomponenten-Body",
  daher erneut gemeldet. Fix: jede dieser Wrapper-Funktionen wurde in eine
  `make*Trigger`/`make*Header`-Factory auf Modul-Ebene gehoben (Vorbild:
  die bereits bestehende `makeDrawerIcon`-Factory), die alle
  geschlossenen Werte (Handler, Farben, Flags, Icon-Namen) als explizite
  Parameter entgegennimmt und die stabile `(triggerProps) => JSX`- bzw.
  `() => JSX`-Funktion zurückgibt. Der Aufrufort enthält dadurch nur noch
  einen Funktionsaufruf, keine Funktionsdefinition mehr.
  - Betroffen: `apps/frontend/app/app/(app)/_layout.tsx` (19x, neue
    `makeTranslatedMenuHeader`/`makeTranslatedStackHeader`-Factories),
    sechs kleinere `_layout.tsx`-Dateien (`chats`, `foodoffers`,
    `support-ticket`, `(monitor)`, `(monitor)/list-week-screen`, `(user)`;
    9x, gleiches Factory-Muster lokal je Datei), geonexia-
    `activities/[id].tsx`/`activities/index.tsx`/`routes/[id].tsx` und
    score-tracker `games/[id].tsx`/`games/index.tsx`/`players/index.tsx`/
    `index.tsx` (7x, `headerLeft`/`headerRight`-Callbacks), die
    Header/Tabs-Komponenten von campus/foodoffers/housing/map (17x,
    `CustomTooltip`-Trigger) sowie zehn weitere Einzelkomponenten
    (`CustomStackHeader`, `SettingsListMarkingLabel`,
    `SettingsListLikeDislike`, `BuildingItem`, `CanteenFeedbackLabels`,
    `CourseTimetable`, `CustomMenuHeader`, `FeedbackLabel`,
    `MarkingLabels`, `NewsItem`; 15x, ebenfalls `CustomTooltip`-Trigger).
  - **Bewusst weiterhin unverändert:** `FoodItem.tsx:324` (siehe oben,
    ~30 geschlossene Werte — weiterhin zu riskant für eine mechanische
    Extraktion) sowie der zweite, nicht gemeldete `CustomTooltip` in
    `BuildingItem.tsx` (wrapt `renderCard`, war nicht Teil dieser Runde).
  - Keine Render-Ausgabe, kein Styling, keine Navigations-/Business-Logik
    geändert — rein mechanische Extraktion mit expliziten Parametern statt
    Closures.
- **„Move this array 'sort' operation..."** (7x): `arr.sort(...)` wurde in
  eine eigene Anweisung aufgeteilt (`arr.sort(...); const sorted = arr;`),
  statt auf `toSorted` umzustellen — der Backend-Extension-Workspace
  targetiert `ES2019`/`lib: ["ES2019"]`, wo `Array.prototype.toSorted`
  (ES2023) nicht typsicher verfügbar ist; für Konsistenz wurde dasselbe
  Muster auch in den Frontend-Stellen verwendet statt nur dort, wo
  `toSorted` type-technisch ginge.
- **Klassen-Umbenennung auf PascalCase** (7x): Unterstriche aus
  Klassennamen entfernt (z. B. `DemoNews_Parser` → `DemoNewsParser`,
  `iPhoneSystemActionHelper` → `IPhoneSystemActionHelper`) — inklusive
  Umbenennung der jeweiligen Datei, damit Dateiname und Klassenname wieder
  übereinstimmen; alle Imports/Testreferenzen mit aktualisiert.
- **Ternary → nullish coalescing** (4x) für Fälle, in denen der geprüfte
  Wert nur `| undefined` (nicht `| null`) typisiert ist.
- **`export…from`** (6x): Re-Exports, die lokal nicht weiterverwendet
  werden, direkt am Ursprungsmodul re-exportiert statt Import + separater
  Re-Export-Zeile.
- **Unused-local-Ersetzung durch `_`** (5x) in
  `apps/geonexia/frontend/assets/objects/1_fix_viewbox.py`.
- **„Do not use Array index in keys"** (15x) und **„'X' is deprecated"**
  (15x im aktuellen CSV) erneut geprüft: entsprechen weiterhin exakt den
  oben dokumentierten Fällen (statische/nie umsortierte Listen bzw.
  Cesium-/CollectionHelper-Migrationen) — bewusst unverändert gelassen.

„Exception-Handling" (23x) ist als erster dieser schweren Fälle abgearbeitet: alle
gemeldeten Catch-Blöcke (leer, nur Kommentar, oder Rethrow ohne Original-Error)
protokollieren jetzt den tatsächlichen Fehler bzw. reichen ihn in der Fehlermeldung
weiter, ohne das bestehende Fallback-/Swallow-Verhalten zu ändern.

„Funktions-Verschachtelung" (35x, „not nest functions more than 4 levels deep")
ist als zweiter Fall abgearbeitet: die jeweils innerste verschachtelte Funktion
wurde in eine benannte Funktion auf Modul- oder Komponentenebene extrahiert
(Closures als explizite Parameter), ohne die Logik zu verändern. Wo mehrere
Stellen im selben oder in Schwesterdateien exakt denselben Block dupliziert
hatten (`ExpoUpdateLoader`, das Forst-Billboard-Fire-and-forget in
`apps/geonexia/frontend/app/{_layout,activities/index,settings/index}.tsx`, der
`onDone`-Handler in `activities/[id].tsx`, der Terrain-Kategorie-Picker in
`apps/geonexia/frontend/app/index.tsx`), wurde je ein gemeinsamer Helper
extrahiert — außer bei den Forst-Billboard-Blöcken, die sich in einem Detail
unterscheiden (der kleine Baum an der `MIDDLE`-Ankerposition wird nur in
`_layout.tsx` und `settings/index.tsx` gesetzt, nicht in `activities/index.tsx`);
dieser Unterschied wurde unverändert beibehalten, kein Verhalten angeglichen.

„Array index in keys" (60x) ist als dritter Fall abgearbeitet: 46 Stellen bekamen
ein stabiles bzw. zusammengesetztes Key-Feld (z. B. `item.id`, `item.label`,
`day.id`; bei Datensätzen ohne eigene ID wie SonarCloud-Map-Features ein
zusammengesetzter Key aus `class`/`subclass`/`name` + Index als Tie-Breaker für
echte Duplikate). Bei drei Markierungs-Listen (`list-day-screen`,
`list-week-screen/details`, `labels`) wurde dazu die geteilte
Marking-Transform-Funktion um das ursprüngliche `id`-Feld ergänzt, das vorher
beim Umformen in die Anzeige-Struktur verloren ging.

14 Stellen wurden bewusst unverändert gelassen (Index-Key ist hier vertretbar,
da die Liste statisch bzw. nie umsortiert/gefiltert wird): Debug-Log-Anzeigen
(`seaphara`, `RateAppSettingsItem`, `3d-kyle-test`, `map/index.tsx`,
`expo-update-test`), reine Paginierungs-Punkte und feste Hexagon-Geometrie
(geonexia `onboarding`, `index.tsx`s `HEX_POLYGON_POINTS`), ein In-Place
mutiertes Memory-Spielfeld (`game-ideas`), aus statischem Text abgeleitete
Markdown-Zeilen (`DataAccess.tsx`, `course-timetable/index.tsx`) sowie die
URL-Liste in `rss-feed-config/index.tsx` (nur Anhängen/Editieren, kein
Löschen/Umsortieren vorhanden — vor einer Restrukturierung zu ID-Objekten
erst klären, ob Löschen/Umsortieren tatsächlich nie kommen soll).

„Move this component definition out of the parent component" (97x) ist jetzt
komplett abgearbeitet bis auf eine bewusst offengelassene Stelle. Die
verschachtelten Funktionen (meist ein `CustomTooltip`-
`trigger={triggerProps => (...)}`-Block, ein `navigation.setOptions({
headerLeft/headerRight/header: () => (...) })` oder ein `drawerIcon`/
`drawerContent`-Callback) wurden auf Modul- oder Dateiebene als eigene
benannte Komponente extrahiert; Closures wurden als explizite Props
durchgereicht. Bei `MyMarkdown.tsx` (drei `react-native-render-html`-Renderer)
wurden bewusst Factory-Funktionen (`makeLinkRenderer`, `makeSubRenderer`,
`makeSupRenderer`) statt parameterloser Komponenten verwendet, da die
Renderer `contrastColor`/`textColor`/`fontSize` aus dem `useMemo` weiterhin
benötigen.

Die 51 Vorkommen in den `_layout.tsx`-Navigationsdateien (`apps/frontend/app/app/(app)/_layout.tsx`
20x, `apps/geonexia/frontend/app/_layout.tsx` 12x,
`apps/score-tracker/frontend/app/_layout.tsx` 7x, plus 12x in kleineren
`_layout.tsx`-Dateien) folgten demselben Muster wie die restlichen 45 —
`header`/`headerLeft`/`headerRight` werden von React Navigation direkt als
Funktion aufgerufen, nie als JSX-Tag instanziiert, also kein echter
Remount-Bug. Zwei wiederkehrende Muster wurden dabei über eine Datei hinweg
gebündelt statt pro Stelle einzeln zu extrahieren:
- **`drawerIcon: ({color,size}) => (<Icon .../>)`** (17x in den Drawer-Configs
  von score-tracker und geonexia) → `makeDrawerIcon(IconSet, name)`, eine
  Factory, die eine stabile Funktion zurückgibt (`drawerIcon:
  makeDrawerIcon(Ionicons, 'menu-outline')`) — eliminiert den Inline-Arrow an
  der Aufrufstelle komplett statt ihn nur zu verkleinern.
- **`header: () => <CustomStackHeader label={translate(key)} .../>`** bzw.
  `<CustomMenuHeader ...>` (rund 30x über `apps/frontend`) → zwei neue geteilte
  Komponenten `TranslatedStackHeader`/`TranslatedMenuHeader`
  (`apps/frontend/app/components/Custom{Stack,Menu}Header/Translated*Header.tsx`),
  die `useLanguage()` selbst aufrufen statt `translate` von außen
  durchzureichen — dadurch entfällt die Closure ganz, nicht nur ihre
  Verschachtelung.
Einzeln extrahiert wurden nur die strukturell abweichenden Fälle: der
`ChatDetailsHeader` in `chats/_layout.tsx` (braucht `router`/`theme` für einen
Refresh-Button), die statischen `BuildingDetailsHeader`/`ApartmentDetailsHeader`/
`StatisticsHeader` (kein `translate` nötig) und `FeedbackAndSupportHeader`
(zwei verkettete `translate()`-Aufrufe, passt nicht ins
Ein-`labelKey`-Schema).

**Eine Stelle bewusst offengelassen:** `FoodItem.tsx:324` — der
`CustomTooltip`-Trigger dort schließt über ~30 Werte (Styles, Handler,
Item-Daten), was ihn zum mit Abstand größten und riskantesten Kandidaten in
diesem gesamten Issue-Typ macht. Da `CustomTooltip` den Trigger ohnehin nur
als Funktion aufruft (kein JSX-Tag, also kein echtes Remount-Risiko), überwiegt
das Risiko, beim Durchreichen so vieler Closures etwas zu vertauschen, den
Nutzen einer sofortigen Extraktion. Für eine eigene, ruhige Änderung
vormerken.

Anmerkung zur Sonar-Regel: Ein Großteil der gefixten Stellen sind
Render-Prop-Funktionen (`trigger`, `headerLeft`/`headerRight`), die von ihrem
Aufrufer direkt als Funktion aufgerufen werden, nicht als JSX-Tag instanziiert
— es gibt dort also keinen echten Remount-Bug (React vergibt nur beim
JSX-Tag `<Foo/>` eine Komponentenidentität). Sonar meldet sie trotzdem, weil
es rein syntaktisch auf „Funktion gibt JSX zurück, verschachtelt im
Elternkomponenten-Body" prüft. Echte Remount-Bugs mit sichtbarem Impact waren
nur `CustomMarkdown.tsx` (`TextContent`/`ImageContent`, als JSX-Tags gerendert
— Bild-Ladefehler-State ist vorher bei jedem Re-Render von `CustomMarkdown`
verloren gegangen) und `FeedbackSupport.tsx` (`IconSelector`).

Am 2026-07-21 (dritte Runde desselben Tages) wurde ein breiter Schwung
mechanischer Fixes über ~20 verschiedene, jeweils kleine (1-16x) Issue-Typen
abgearbeitet (insgesamt ca. 75 Einzelfundstellen), da der häufigste
verbleibende Typ „Cognitive Complexity" (109x) bewusst individuelle
Refactorings statt mechanischer Fixes braucht (siehe oben) und daher nicht
Teil dieser Runde war:

- **Context-Provider-Werte in `useMemo`** (4x): `SettingsContext`,
  `ThemeContext`, `ExpoUpdateChecker`, `ModalProvider` (`packages/common-ui`)
  übergaben ein bei jedem Render neu erzeugtes Objekt an `Context.Provider`.
  Bei `ModalProvider` wurden dazu zusätzlich `open`/`close`/
  `openAndDiscardOthers`/`closeAll`/`handleSheetChange` und ihre internen
  Helper (`clearCloseTimeout`, `notifyClosed`, `takePendingClosed`,
  `finalizeConfirmedClose`) mit `useCallback` referenzstabil gemacht, da sie
  nur auf Refs und stabile `setState`-Funktionen zugreifen (kein Zugriff auf
  sich änderndes State/Props in der Closure) — rein additive Memoisierung,
  keine Verhaltensänderung.
- **Union-Type „von `string` überdeckt"** (5x): `foodoffers/hooks.ts`
  (`sheet: 'menu' | 'sort' | string`) und `HousingHeader.tsx`
  (`drawerPosition: 'left' | 'right' | 'system' | string`) — die
  Literal-Member waren durch den bereits vorhandenen `string`-Typ ohnehin
  nie eigenständig wirksam; auf den reinen `string`-Typ vereinfacht (keine
  Laufzeitänderung).
- **Doppelte Funktionsimplementierungen** (3x): `resourceHelper.tsx`
  (`getFromCategoryTranslation`/`getFromCategoryTranslation`/
  `getFoodAttributesTranslation` teilen sich jetzt eine private
  `getNameFromTranslation`-Hilfsfunktion), `MyUnsupportedCardReader.ts`
  (`isNfcEnabled` ruft jetzt `isNfcSupported()` auf statt den Body zu
  duplizieren) und `packages/common/src/DateHelper.ts`
  (`getDateInMinutes` ruft jetzt `addMinutes` auf).
- **Anonyme Funktionen benannt** (3x): `module.exports = function (...)` in
  allen drei `app.config.ts` (`frontend`, `geonexia`, `score-tracker`) zu
  `function getExpoConfig(...)`.
- **Redundante Type-Aliase entfernt** (3x): `TTSEnabled` (→ `boolean`),
  `H3Index` (→ `string`, nur intern in `H3Helper.ts` verwendet) und
  `MutationOptions` (→ `any`, Vorkommen und Imports in `FilesServiceHelper.ts`/
  `ItemsServiceHelper.ts` mit aktualisiert).
- **`switch` mit ≤2 Fällen durch `if` ersetzt** (3x): `forms-sync-hook/index.ts`
  und `food-sync-hook/index.ts` (jeweils ein einzelner Case + leerer
  `default`) sowie `form-submissions/index.tsx` (Case `'alphabetical'` und
  `default` hatten identischen Fallthrough-Body — Switch komplett entfernt,
  Sortierung läuft jetzt unbedingt, exakt gleiches Verhalten für alle
  `option`-Werte).
- **`Boolean`/`String`-Wrapper-Typen** (3x) durch `boolean`/`string` ersetzt:
  `LabelHeader.tsx`, `Login/types.ts`, `SubmissionWarningModal/types.ts`.
- **Union-Typen zu benannten Type-Aliasen extrahiert** (2 Meldungen, 3
  Fundstellen): `ListGroupPosition` in `geonexia/app/index.tsx` (3
  Vorkommen) und `ProfileField` in `FriendsContent/index.tsx` (3 Vorkommen).
- **Fehlender `default`-Case in Shell-Scripts** (2x): beide
  `run-maestro-web-test.sh` (`frontend`, `score-tracker`) bekamen einen
  expliziten `*) ;;`-Case in der Flag-Parsing-`case`.
- **Doppelte Zeichen in Regex-Zeichenklasse** (2x): `[\r\n\t\x00-\x1f]` in
  `DirectusDatabaseSync.ts` und `importSchema.js` — `\r`/`\n`/`\t` sind
  bereits Teil von `\x00-\x1f`; zu `[\x00-\x1f]` vereinfacht.
- **Überflüssiger `void`-Operator** (2x): `void main();` in beiden
  `generate-eas-config.ts` (`score-tracker`, `scripts`) — `main()` ist
  synchron (kein Promise), `void` also ohne Zweck.
- **Ungenutzte PropTypes/Props entfernt** (4x): `onDebugEvent` aus
  `AvatarEditorModalContentProps` ausgenommen (`Omit<AvatarEditorBehaviorProps,
  'onDebugEvent'>` — wird von `AvatarEditorModalContent` nirgends
  konsumiert/weitergereicht, andere Komponenten mit `onDebugEvent` bleiben
  unverändert), `accentColor` aus `SettingsListLeftRightProps` entfernt
  (nirgends gelesen) und `closeSheet` aus `MyScrollViewModalProps` (beide
  Varianten, `packages/common-ui` und `apps/frontend`) — die Komponente hat
  `closeSheet` nie destrukturiert/verwendet. Da `closeSheet` an mehreren
  Stellen dennoch an `<MyScrollViewModal>` durchgereicht wurde (totes
  Prop-Drilling), mussten zusätzlich die Aufrufstellen angepasst werden:
  beide `useMyScrollViewModal.tsx`-Hooks (`packages/common-ui` und
  `apps/frontend`), `HoursSheet.tsx` (`HourSheet`) und `CalendarSheet.tsx` —
  überall wurde nur der nie wirksame `closeSheet`-Prop entfernt, keine
  Verhaltensänderung (per TypeScript-Diff gegen den Stand vor dieser Runde
  verifiziert, siehe unten).
- **`node:buffer`-Import bewusst NICHT geändert** (2x, `form-queue/index.tsx`,
  `form-submission/index.tsx`, beide `apps/frontend`): Metro (React
  Native/Expo) unterstützt das `node:`-URL-Schema für Kernmodul-Polyfills
  nicht (im installierten `metro-resolver` gibt es keine entsprechende
  Sonderbehandlung) — anders als bei den Node.js-ausgeführten Backend-Skripten
  hätte das Bundle hier vermutlich mit „Unable to resolve module node:buffer"
  gebrochen. Blieb bei `from 'buffer'`.
- **Redundante Jump-Statements** (2x): `SettingsListMarkingLabel.tsx` und
  `MarkingLabels.tsx` hatten je ein `if (isAnonymousUser) { ...; return; }
  else { ... }` als letzte Anweisung der Funktion — das `return` wurde
  entfernt (der `else`-Zweig wird dadurch weiterhin korrekt übersprungen,
  keine Verhaltensänderung, da nichts nach dem `if/else` folgt).
- **Object-Default-Stringifizierung** (6x): `form-submission/index.tsx`
  (`normalizeExpectedValue`/`normalizeCurrentValue` nutzen jetzt
  `JSON.stringify(...)` statt `String(...)` im Objekt-Fallback-Pfad) sowie
  vier echte Logging-Stellen in `ParseSchedule.ts` und
  `FormImportSyncWorkflow.ts`: `WorkflowResultHash.getHash()` gibt
  `Record<string, unknown> | Array<unknown> | null` zurück (keinen String!)
  — die String-Konkatenation `'... ' + hash.getHash()` produzierte in den
  Logs tatsächlich `[object Object]` statt des Hash-Inhalts. Zu
  `JSON.stringify(hash.getHash())` geändert — echte Verbesserung der
  Log-Aussagekraft, keine Logik geändert.
- **Leere Blöcke** (2x): `app/index.tsx` (`if (updated) {...} else {}` —
  leeres `else` entfernt) und `HoursSheet.tsx` (`if (!timeRanges ...) {}
  else { ... }` — Bedingung negiert (`if (timeRanges && timeRanges.length >
  0) { ... }`), leerer Zweig entfernt).
- **Dockerfile-RUN-Merges** (2x, `apps/backend/Dockerfile`): die beiden
  `apk update`-RUNs (git, dann Puppeteer-Dependencies) zu einem RUN
  zusammengeführt (dabei automatisch auch das separate „remove cache"-Finding
  miterledigt, da der ganze Befehl jetzt `--no-cache` nutzt) sowie die drei
  aufeinanderfolgenden `corepack`/`pnpm install`-RUNs zu einem RUN verkettet.
  Zusätzlich die Paketliste alphanumerisch sortiert (weiteres Sonar-Finding)
  und in `apps/backend/dockerDatabaseBackup/Dockerfile` das veraltete
  `MAINTAINER`-Instruction durch `LABEL maintainer="..."` ersetzt.
- **Regex-Vereinfachungen**: `[0-9]` → `\d` in `CourseBottomSheet.tsx` (2
  Vorkommen in einer Zeile) und `hexId.charCodeAt(i)` →
  `hexId.codePointAt(i) ?? 0` in `ActivityMapRebuildHelper.ts`.
- **Ternary → `Math.max()`** (2x): `CourseTimetable.tsx`
  (`offset > 0 ? offset : 0` → `Math.max(offset, 0)`) und
  `ByteSizeHelper.ts` (`decimals < 0 ? 0 : decimals` →
  `Math.max(decimals, 0)`).
- **Interface-Namen an PascalCase angepasst** (2x): `sheetProps` →
  `SheetProps` in `EditFormSubmissionSheet/types.ts` und
  `SubmissionWarningSheet/types.ts` (inkl. aller Imports/Nutzungen).
- **Promise-Chain → Top-Level-`await`**: `apps/backend/sync/importSchema.js`
  ist ESM (`"type": "module"`, nutzt bereits `import`), Top-Level-`await` ist
  also gültig — `mainPush()/mainPull().then(...).catch(console.error)` zu
  `try { await ...; process.exit(0); } catch (error) { console.error(error);
  }` geändert (identisches Verhalten: kein `process.exit` bei Fehlern, wie
  zuvor bei `.catch`).
- **Diverse Einzelfälle** (je 1x, ~20 Stück): u. a. `.slice(-2)` statt
  `.slice(len-2, len)` in `hashHelper.ts`; `.some(...)` statt
  `.filter(...).length > 0` in `achievements/index.tsx`; benannte
  Jest-Resolver-Funktion statt anonymer Arrow in `jest.resolver.js`;
  gehoistete `DEFAULT_KM_ANNOUNCEMENT_CONTENT`-Konstante statt
  Objekt-Literal als Parameter-Default in `TTSHelper.ts`; `return value`
  statt `return Promise.resolve(value)` in `MaxManagerConnector.ts`
  (Funktion ist bereits `async`); unnötig umbenanntes Destructuring
  (`updateObject: updateObject`) in `TranslationHelper.ts`; Default- statt
  Named-Import für `puppeteer-core` in `PuppeteerGenerator.ts`
  (`esModuleInterop` ist im Workspace aktiv); `let headersObject;` statt
  `= undefined` in `importSchema.js`; leere `MyMapHelper`-Klasse entfernt
  (nirgends als Wert importiert, nur der Dateiname für Typ-Imports
  gebraucht); `link.remove()` statt `document.body.removeChild(link)` in
  `image-full-screen/index.tsx`; zusammengelegte `ON_LOGIN`/`UPDATE_LOGIN`
  Switch-Cases in `authReducer.ts` (identischer Body); unnötiges
  Objekt-Spread-in-Objekt-Literal in `WorkflowRunJobInterface.ts`;
  `for _ in range(...)` statt ungenutztem `level` in
  `getBase64IconForMail.py`; redundante `data &&`-Prüfung entfernt in
  `form-submission/index.tsx` (durch äußeres `if (data)` bereits garantiert);
  einzelnes `if` im `else`-Block zu `else if`-Kette abgeflacht in
  `HoursSheet.tsx`; `!(x > 0)` zu `(x ?? 0) <= 0` in
  `ApartmentDetailsContent.tsx` (statt naivem `x <= 0`, da `x` über
  Optional-Chaining `undefined` sein kann und `undefined <= 0` anders als
  `!(undefined > 0)` auswertet — mit `?? 0` bleibt das Verhalten für den
  `undefined`-Fall identisch).
- **Echter Bug gefunden und mitgefixt**: `locales/keys.ts` —
  `MayShort = 'May'` zeigte auf den Übersetzungs-Eintrag der ausgeschriebenen
  „May"-Übersetzung statt auf den eigenständigen, bereits in
  `translations.json` vorhandenen `"MayShort"`-Eintrag (der z. B. für
  Arabisch/Spanisch/Chinesisch andere Werte als „May" hat). Der Kalender
  (`CalendarSheet.tsx`, `monthNamesShort`) zeigte dadurch für den
  abgekürzten Mai-Monatsnamen in diesen Sprachen fälschlich die
  ausgeschriebene Übersetzung. Zu `MayShort = 'MayShort'` korrigiert.
- **Bewusst nicht geändert:**
  - `Object.prototype.hasOwnProperty.call(...)` in `packages/common/src/DateHelper.ts`
    (→ `Object.hasOwn()`, ES2022): `DateHelper` wird auch vom
    Backend-Extension-Workspace importiert, der `target`/`lib: ["ES2019"]`
    nutzt — gleiche Kategorie Risiko wie das bereits dokumentierte
    `toSorted()`-Skip oben.
  - `JSON.parse(JSON.stringify(lottieJSON))` in `animationHelper.ts`
    (→ `structuredClone(...)`): Laufzeitunterstützung in Hermes/React
    Native über alle unterstützten Versionen hinweg nicht sicher verifizierbar
    in dieser Session; Risiko eines Laufzeitfehlers (`structuredClone is not
    defined`) höher bewertet als der Lint-Gewinn.
  - `Cognitive Complexity` (weiterhin 109x) und das 51-Case-`switch` in
    `settingsReducer.ts` (Meldung „Reduce non-empty switch cases from 51 to
    30") bleiben für eigene, gezielte Refactoring-Runden vorgemerkt.

Verifiziert per `tsc --noEmit` (Baseline vor dieser Runde vs. danach,
`git stash`/`git stash pop`) für alle betroffenen Workspaces (`apps/frontend/app`,
`apps/geonexia/frontend`, `apps/score-tracker/frontend`, `apps/backend-sync`,
`apps/scripts`) sowie `yarn typecheck` für die Backend-Extension: keine neuen
Fehler, nur Zeilennummern-Verschiebungen bei vorbestehenden (unabhängigen)
Fehlern. Dabei zwei durch die `closeSheet`-Prop-Entfernung verursachte
Compile-Fehler gefunden und behoben (Aufrufstellen in `HoursSheet.tsx` und
`CalendarSheet.tsx`, die `closeSheet` noch direkt an `<MyScrollViewModal>`
übergeben hatten).

## Hinweise

- Die CSV-Reports werden per CI aktualisiert (Commits `chore: update sonarcloud reports`).
  Nach einem Merge zeigt der nächste Scan die verbleibenden Issues.
- Das Zähl-Script akzeptiert optional einen Pfad und Top-N:
  `node scripts/count-sonar-maintainability-issues.js [csv] [topN]`.
