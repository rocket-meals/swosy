export function getPrivacyPolicyMarkdown(): string {
	return `# Datenschutzerklärung – Punktlandung (Score Tracker)

*Stand: August 2026*

Diese Datenschutzerklärung gilt für die mobile App **Punktlandung** (interner Projektname „Score Tracker") für iOS und Android sowie deren Web-Version.

## Kurz gesagt

Die App funktioniert **ohne Konto und ohne eigene Server**. Alle Inhalte, die du anlegst – Spiele, Partien, Punkte, Freunde, Einstellungen und Bilder – werden **ausschließlich lokal auf deinem Gerät** gespeichert. Es gibt **kein Tracking, keine Werbung und keine Analyse-Dienste**.

## Lokale Daten

Deine Daten verlassen dein Gerät nicht, außer du exportierst sie selbst (z. B. über die Export-Funktionen in die Zwischenablage). Du kannst alle Daten jederzeit löschen:

- in der App unter **Einstellungen → Speicher → „Speicher leeren"**, oder
- durch Deinstallation der App.

Eine Datenübertragung an uns findet nicht statt; wir haben zu keinem Zeitpunkt Zugriff auf deine Inhalte.

## Bildersuche (optional)

Wenn du für ein Spiel die integrierte Bildersuche nutzt, wird dein Suchbegriff an öffentliche Bilddienste übertragen, um Ergebnisse zu laden:

- [Wikimedia Commons](https://commons.wikimedia.org)
- [Openverse](https://openverse.org)
- ggf. Google Programmable Search (nur wenn in der App-Auslieferung konfiguriert)

Dabei wird – wie bei jedem Internet-Abruf – deine IP-Adresse technisch bedingt an den jeweiligen Dienst übermittelt. Ausgewählte Bilder werden nur lokal gespeichert.

## App-Updates

Die App prüft beim Start über den Dienst **EAS Update** (Expo, https://expo.dev) auf Aktualisierungen. Dabei wird deine IP-Adresse technisch bedingt an Expo übermittelt; persönliche Daten werden nicht übertragen.

## Fotos und Kamera

Der Zugriff auf deine Fotos oder die Kamera erfolgt nur, wenn du einem Spiel ein eigenes Bild geben möchtest, und erst nach deiner ausdrücklichen Freigabe über den System-Dialog. Die Bilder bleiben lokal auf dem Gerät.

## Verantwortlicher / Kontakt

Baumgartner Software
E-Mail: [nils@baumgartner-software.de](mailto:nils@baumgartner-software.de)

Bei Fragen zum Datenschutz kannst du dich jederzeit an die oben genannte E-Mail-Adresse wenden.

---

## Privacy Policy (English summary)

**Punktlandung** ("Score Tracker") works without accounts and without our own servers. Everything you create (games, matches, scores, friends, settings, images) is stored **locally on your device only**. There is no tracking, no advertising and no analytics. Optional features that access the internet: the game image search sends your search term to public image services (Wikimedia Commons, Openverse, optionally Google), and the app checks Expo's EAS Update service for app updates – in both cases your IP address is transmitted as part of the technical request, nothing more. Photos/camera are only accessed after your explicit permission and picked images stay on the device. You can delete all data at any time via Settings → Storage → "Clear storage" or by uninstalling the app.

Contact: Baumgartner Software, [nils@baumgartner-software.de](mailto:nils@baumgartner-software.de)`;
}
