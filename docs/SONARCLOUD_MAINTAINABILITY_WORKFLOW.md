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
„Cognitive Complexity" (109x), TODO-Kommentare (39x).
Diese Typen in kleinen, thematisch gruppierten PRs angehen.

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

## Hinweise

- Die CSV-Reports werden per CI aktualisiert (Commits `chore: update sonarcloud reports`).
  Nach einem Merge zeigt der nächste Scan die verbleibenden Issues.
- Das Zähl-Script akzeptiert optional einen Pfad und Top-N:
  `node scripts/count-sonar-maintainability-issues.js [csv] [topN]`.
