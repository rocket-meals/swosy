/**
 * Bumped whenever the privacy policy changes in a way users should be made
 * aware of again (e.g. once accounts and route/world-map sharing ship). No
 * accept-flow reads this yet - it's the anchor for that flow to be wired up
 * against once Geonexia has a login screen.
 */
export const PRIVACY_POLICY_VERSION = 1;

export function getPrivacyPolicyMarkdown(): string {
	return `# Datenschutzerklärung – Geonexia

*Stand: August 2026 (Version ${PRIVACY_POLICY_VERSION})*

## Kurz gesagt

Geonexia funktioniert aktuell **ohne Konto und ohne eigenen Server**. Alle Aktivitäten, Routen, GPS-Daten und dein Kartenfortschritt (Hex-Kacheln) werden **ausschließlich lokal auf deinem Gerät** gespeichert. Es gibt (noch) kein Konto, kein Teilen von Aktivitäten mit anderen Nutzern und keine geteilte Weltkarte. Es gibt kein Tracking, keine Werbung und keine Analyse-Dienste.

## GPS- und Aktivitätsdaten

Wenn du eine Aktivität (z. B. einen Lauf) aufzeichnest, erfasst die App deine GPS-Position, Höhe, Geschwindigkeit und Zeitstempel in kurzen Intervallen sowie daraus abgeleitete Werte (Strecke, Tempo, Kalorien, Schritte, Höhenmeter) und den Akkustand deines Geräts. GPS-Daten können Rückschlüsse auf Wohnort, Arbeitsplatz und Bewegungsgewohnheiten zulassen – deshalb werden sie besonders sorgfältig behandelt: Diese Daten verbleiben **ausschließlich lokal auf deinem Gerät** und werden nicht an uns oder Dritte übertragen. Du kannst einzelne Aktivitäten selbst als Datei exportieren, um sie z. B. mit anderen Apps oder Geräten zu teilen – das geschieht nur, wenn du es aktiv auslöst.

Du kannst alle Aktivitäten, Routen und deinen Kartenfortschritt jederzeit vollständig löschen, z. B. über **Einstellungen → Daten Verwaltung → „Alle Daten zurücksetzen"**, oder durch Deinstallation der App.

## Kartendarstellung

Zur Anzeige der Karte lädt die App Kartenkacheln vom Open-Source-Dienst **OpenFreeMap** (basierend auf Daten von OpenStreetMap). Dabei wird – wie bei jedem Internet-Abruf – deine IP-Adresse technisch bedingt an den Kartendienst übermittelt. Wir erhalten dabei keine personenbezogenen Daten von OpenFreeMap und nutzen die Kartenfunktion nicht zu Analyse- oder Trackingzwecken.

## App-Updates

Die App prüft beim Start über den Dienst **EAS Update** (Expo, https://expo.dev) auf Aktualisierungen. Dabei wird deine IP-Adresse technisch bedingt an Expo übermittelt; persönliche Daten werden nicht übertragen.

## Berechtigungen

Der Zugriff auf Standort (GPS) und Benachrichtigungen erfolgt nur nach deiner ausdrücklichen Freigabe über den System-Dialog und ausschließlich für die entsprechenden Funktionen der App (Aufzeichnung von Aktivitäten bzw. lokale Erinnerungen).

## Geplante Erweiterungen

Wir planen, Aktivitäten und Routen künftig optional an ein Nutzerkonto zu binden und erkundete Kartenbereiche (Weltkarte) mit anderen Nutzern zu teilen – nicht live, sondern erst nach Abschluss einer Aktivität –, um z. B. Laufrouten für andere bereitzustellen und Vergleiche oder gemeinsame Herausforderungen zu ermöglichen. Sobald diese Funktionen eingeführt werden, aktualisieren wir diese Datenschutzerklärung (Versionsnummer wird erhöht) und informieren dich in der App darüber.

## Verantwortlicher / Kontakt

Baumgartner Software
E-Mail: [nils@baumgartner-software.de](mailto:nils@baumgartner-software.de)

Bei Fragen zum Datenschutz kannst du dich jederzeit an die oben genannte E-Mail-Adresse wenden.`;
}
