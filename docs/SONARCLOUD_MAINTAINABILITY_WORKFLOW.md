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
„Cognitive Complexity" (109x), „Move this component definition out of the parent
component" (97x), „Array index in keys" (60x, braucht stabile IDs), TODO-Kommentare
(39x), Funktions-Verschachtelung (35x), Exception-Handling (23x).
Diese Typen in kleinen, thematisch gruppierten PRs angehen.

## Hinweise

- Die CSV-Reports werden per CI aktualisiert (Commits `chore: update sonarcloud reports`).
  Nach einem Merge zeigt der nächste Scan die verbleibenden Issues.
- Das Zähl-Script akzeptiert optional einen Pfad und Top-N:
  `node scripts/count-sonar-maintainability-issues.js [csv] [topN]`.
