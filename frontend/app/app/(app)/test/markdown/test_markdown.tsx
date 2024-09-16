import {Heading, View} from '@/components/Themed';
import {ThemedMarkdown} from '@/components/markdown/ThemedMarkdown';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {SettingsRowTextEdit} from '@/components/settings/SettingsRowTextEdit';
import {useState} from 'react';

export const markdownWithDelimeters = `
Abouve

# 1. Title
	1. Content
	## 2. Subtitle
		2. Content
		### 3. Subsubtitle
			3. Content
			#### 4. Subsubsubtitle
				4. Content
				##### 5. Subsubsubsubtitle
					5. Content
					###### 6. Subsubsubsubsubtitle
						6. Content
Below
`

export const realisticMarkdownPrivacyPolicy = `
Unsere Website und unsere spezielle App (nachfolgend „App“) kann ohne Preisgabe personenbezogener Daten verwendet werden, mit Ausnahme von kurzfristiger Speicherung von Log Dateien (wie. z. B. IP-Adressen, Zugriffszeiten) zur Wahrung der Sicherheit. Solltest du jedoch bestimmte personenbezogene Daten zur Verfügung stellen (zum Beispiel im Zuge einer E-Mail-Kontaktaufnahme oder Login mit externen Anbietern wie Google, Apple und andere), wie Name, Wohnort oder E-Mail-Adresse, geschieht dies immer auf freiwilliger Basis und mit dem ausdrücklichen Einverständnis von dir.

Name und Anschrift des Verantwortlichen:

Der Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze der Mitgliedsstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist:


Studentenwerk XXX
Anstalt des öffentlichen Rechts
Der Geschäftsführer
Besuchsadresse: Straße 1, 12345 Musterstadt
Postadresse: Postfach 1234, 12345 Musterstadt
Tel. (0123) 45-6789
Fax (0123) 46-5789
Steuernummer 12 / 345 / 6789
USt-IdNr. DE123456789

E-Mail
[datenschutz@studentenwerk-muster.de](mailto:datenschutz@studentenwerk-muster.de)

Mit dieser Datenschutzerklärung informieren wir dich über unsere Verarbeitung personenbezogener Daten nach Art. 12 ff. DSGVO. Unter personenbezogenen Daten sind sämtliche Informationen zu verstehen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen. Darüber hinaus unterrichten wir dich über die Rechtsgrundlage für die Verarbeitung deiner Daten und - soweit die Verarbeitung zur Wahrung unserer berechtigten Interessen erforderlich ist - auch über unsere berechtigten Interessen sowie über deine Rechte.

# Rechtliche Grundlage

	Wir verarbeiten personenbezogene Daten mit den Bestimmungen
	- der [EU-Datenschutzgrundverordnung (DSGVO)](https://www.e-recht24.de/dsgvo-gesetz.html),
	- des [Bundesdatenschutzgesetzes (BDSG)](https://www.buzer.de/s1.htm?g=BDSG+2018&f=1),
	- des [Niedersächsischen Datenschutzgesetzes (als öffentliche Stelle des Landes)](https://lfd.niedersachsen.de/startseite/datenschutzrecht/niedersachsisches_datenschutzgesetz/das-niedersaechsische-datenschutzgesetz-56264.html).
	
	Die Rechtmäßigkeit ergibt sich:
	- aufgrund deiner Einwilligung oder
	- aus der Erfüllung von vertraglichen Pflichten oder
	- aufgrund gesetzlicher Vorgaben oder
	- im Rahmen der Interessenabwägung/öffentliches Interesse.


# Informationen zur Verarbeitung deiner Daten

	Bestimmte Informationen werden bereits automatisch verarbeitet, sobald du die App verwendest. Welche personenbezogenen Daten genau verarbeitet werden, haben wir im Folgenden für dich aufgeführt.
	
	## Beim Download erhobene Informationen
	
		Bei dem Download der App werden bestimmte erforderliche Informationen an den von dir ausgewählten App Store (Google Play oder Apple App Store) übermittelt. Insbesondere können dabei der Benutzername, die E-Mail-Adresse, die Kundennummer deines Accounts, der Zeitpunkt des Downloads, Zahlungsinformationen sowie die individuelle Gerätekennziffer verarbeitet werden. Die Verarbeitung dieser Daten erfolgt ausschließlich durch den jeweiligen App Store und liegt außerhalb unseres Einflussbereiches.
	
	## Automatisch erhobene Informationen
	
		Wir schätzen das Recht auf Anonymität sehr, weshalb du zu Beginn die Möglichkeit hast, auszuwählen, ob du die App als Gast nutzen möchtest. In diesem Fall werden keinerlei persönliche Daten an uns übermittelt, sodass jeder, der anonym bleiben möchte, dies auch sein soll. Wir speichern lediglich für einen kurzen Zeitraum in den Server Logs die IP-Adresse und Zugriffszeiten, um unsere Sicherheit zu gewährleisten. Durch die Nutzung mit einem Gastkonto wird der Funktionsumfang der App allerdings eingeschränkt, da für einige Funktionen wie das Synchronisieren von Daten und Senden von E-Mails keine Anonymität möglich ist. Auf die Speicherung von Daten des Providers haben wir keinen Einfluss.
		
		Bei jedem Aufruf unserer Internetseite und App erfasst unser System automatisiert Daten und Informationen vom Computersystem des aufrufenden Gerätes.
		
		Folgende Daten werden hierbei erhoben:
		
		Name der abgerufenen Webseite und Datei
		- IP-Adresse des Nutzers
		- Datum und Uhrzeit des Zugriffs
		- Aktionstyp (Update, Löschung, Erstellung, Login, Kommentierung)
		- Meldung über erfolgreichen Abruf
		- Übertragene Datenmenge
		- Websites, von denen das System des Nutzers auf unsere Internetseite gelangt
		- User Agent: Informationen über Browsertyp und Endgerätes und verwendete Version einschließlich Betriebssystem
		- Datenbank Collection
		- Datenbank Item Schlüssel
		
		Die Daten werden ebenfalls in den Logfiles unseres Systems gespeichert. Rechtsgrundlage für die vorübergehende Speicherung der Daten und der Logfiles ist Art. 6 Abs. 1 lit. f DSGVO.
		
		### Zweck der Datenverarbeitung
			Die vorübergehende Speicherung der IP-Adresse durch das System ist notwendig, um eine Auslieferung der Website an den Rechner des Nutzers zu ermöglichen. Hierfür muss die IP-Adresse des Nutzers für die Dauer der Sitzung gespeichert bleiben.
			
			Die Speicherung in Logfiles erfolgt, um die Funktionsfähigkeit der Website sicherzustellen. Zudem dienen uns die Daten zur Optimierung der Website und zur Sicherstellung der Sicherheit unserer informationstechnischen Systeme. Eine Auswertung der Daten zu Marketingzwecken findet in diesem Zusammenhang nicht statt.
			
			In diesen Zwecken liegt auch unser berechtigtes Interesse an der Datenverarbeitung nach Art. 6 Abs. 1 lit. f DSGVO.
		
		### Dauer der Speicherung
			Die Dauer der Speicherung kann im Abschnitt „Zeitraum der Datenspeicherung“ eingesehen werden.
			
			Widerspruchs- und Beseitigungsmöglichkeit
			Die Erfassung der Daten zur Bereitstellung der Website und die Speicherung der Daten in Logfiles ist für den Betrieb der Internetseite zwingend erforderlich. Es besteht folglich seitens des Nutzers keine Widerspruchsmöglichkeit.
	
	## Informationen von Nutzern mit einem Account
	
		Solltest du die App nicht als Gast benutzen, so wird im Rahmen deiner Nutzung der App automatisiert eine UserID (Benutzer Identifier) erstellt, welche für den vollen Nutzungsumfang der App erforderlich ist. Für die Erhebung der UserID berufen wir uns auf unser berechtigtes Interesse gem. Art. 6 Abs. 1 f) DSGVO, um die Funktionsfähigkeit und den fehlerfreien Betrieb der App zu gewährleisten und einen markt- und interessensgerechten Dienst anbieten zu können.
		
		
		Die übermittelten Bewertungen und ggf. Kommentare erheben wir auf Basis einer Einwilligung nach Art. 6 Abs. 1 a) DSGVO. Du musst deine Bewertung bzw. deinen Kommentar durch aktives Anklicken „Feedback senden“-Buttons abschicken oder Schreiben oder wirst in der App aktiv danach gefragt, ob du diese Bewertung und ggf. Kommentare übermitteln willst. Die Erhebung der pseudonymisierten Nutzungsdaten erfolgt auf Basis eines berechtigten Interesses nach Art. 6 Abs. 1 f) DSGVO i.V.m. Erwägungsgrund 47 (Direktmarketing).
		
		Du hast in der App, sofern die App nicht als Gast verwendet wird, dir jederzeit die Möglichkeit, alle bei uns gespeicherten Daten einzusehen. Im Nachfolgenden werden die weiteren zu erhebenden Daten gelistet, die zur Bereitstellung der Leistung nach Art. 6 Abs. 1 b) und f) DSGVO notwendig sind. Die Löschung deiner Daten erfolgt automatisch, wenn du dein Konto löschst oder nach 180 Tagen Inaktivität.
		
		Wir bieten hohe Transparenz, indem wir dir als Gast oder angemeldeter Nutzer die Möglichkeit geben, deine Daten einzusehen, die auf deinem Gerät lokal gespeichert sind.
		
		Zu diesen Informationen gehören:
		
		### User
		
			- id - Mit der Registrierung erhältst du ein Konto mit einer Benutzer ID, welcher deine Daten zugeordnet werden können.
			
			- first_name - Mit dem Anmelden über einen externen Anbieter (einem SSO-Login) wie z. B. Google speichern wir deinen Vornamen, um dich in der App oder bei Anschriften personalisiert zu begrüßen.
			
			- last_name - Mit dem Anmelden über einen externen Anbieter (einem SSO-Login) wie z. B. Google speichern wir deinen Nachnamen, um dich in der App oder bei Anschriften personalisiert zu begrüßen.
			
			- profile - Wir trennen dein Profil von deinem Benutzer Login. Dadurch pseudonomisieren wir die Daten, sofern wir diese analysieren.
			
			- last_access - Wir speichern den Zeitpunkt deines letzten Zugriffes, sodass wir inaktive Nutzer automatisch löschen können.
			
			- password - Sofern du dich über einen externen Anbieter angemeldet hast, speichern wir natürlich kein Passwort. Für Accounts von Mitarbeitern wird hier ein gehashed Passwort gespeichert.
			
			- provider - Falls du dich über einen externen Anbieter wie z. B. Google angemeldet hast, speichern wir den Namen dieses Anbieters.
			
			- external_identifier - Falls du dich über einen externen Anbieter wie z. B. Google angemeldet hast, speichern wir die ID dieses Anbieters, um dir deinen Account zuordnen zu können.
			
			- token - Ein vom Server generierter Token, welchen du mit deinem Passwort erhältst, um dich leichter zu autorisieren.
			
		### Profile
		
			In deinem Profil speichern wir alle relevanten Informationen, welche du geräte- und plattformübergreifend verwenden kannst. Dies kann z. B. nützlich sein, wenn du dich mit verschiedenen Rechnern oder Handy-Apps anmeldest.
			
			- id - Du erhälst automatisch eine Profil-Id, sodass wir dies loslösen können von deinem User-Account. Dieser ID werden deine Profil-Daten zugeordnet.
			
			- avatar - Neben deines Pseudonyms kannst du dir einen Avatar zusammenstellen. Dieser hat den gleichen Sinn wie der Nickname.
			
			- credit_balance - Dein aktuelles Guthaben, welches du in der Mensa hast, sofern du deine Mensa-Karte ausgelesen hast. Damit synchronisieren wir deine Daten auf deinen Geräten.
			
			- language - Wir speichern deine bevorzugte Sprache damit wir dir Nachrichten und Inhalte in deiner Sprache anzeigen können. Die Sprache wird zu Beginn automatisch über dein verwendetes Endgerät analysiert und kann von dir geändert werden.
			
			- nickname - Du erhältst die Möglichkeit, dir ein Pseudonym zu wählen, welches nicht einzigartig sein muss. Wir bitten dich, hierbei nicht deinen echten Namen einzugeben. Anhand dieses Nicknamen können vernetzte Freunde dich leichter erkennen und sehen, ob und wann du Lust hast in die Mensa zu gehen. Dadurch können andere Nutzer nicht deinen echten Namen sehen, welchen wir nur in deinem User-Account speichern.
			
			- food_feedbacks - Deine favorisierten Gerichte. Dadurch können wir dich benachrichtigen, wenn eine deiner Wunschspeisen wieder angeboten wird. Anhand dieser versuchen wir unser Angebot zu verbessern. Deine Kommentare zu den angebotenen Gerichten. Anhand dieser versuchen wir unser Angebot zu verbessern. Deine Bewertungen der angebotenen Gerichte. Anhand dieser versuchen wir unser Angebot zu verbessern.
			
			- price_group - Wir speichern die Preisklasse ab, sodass wir die Preise für deine Rabatt-Klasse anzeigen können.
			
			- data_privacy_policy_accepted - Deine Zustimmung zur Datenschutzerklärung. Wir speichern diese Information, um zu wissen, ob du die Datenschutzerklärung gelesen hast.
			
			- buildings_favorites - Deine bevorzugten Gebäude, welche für dich wichtig sind.
			
			- buildings_last_visited - Deine zuletzt angeschauten Gebäude in der App. Wir nutzen diese Information unter anderem zur Sortierung der Ergebnisse.
			
			- markings - Deine Allergene und Kennzeichnungen von Gerichten, welche du entweder nicht verträgst oder nicht magst. Dadurch können wir einerseits deine Benachrichtigungen an deine Essgewohnheiten anpassen, andererseits können wir unser Angebot anpassen, um möglichst viele Menschen anzusprechen.
			
			- devices - Deine verwendeten Endgeräte. Wir verwenden diese Informationen, um z. B. Fehler besser analysieren zu können, abhängig davon welches Endgerät du verwendest. Weitere Informationen in dem Abschnitt zu deinem Gerät.
			
			- canteen - Deine ausgewählte Mensa oder Cafeteria. Damit wir dir nur Erinnerungen von Gerichten zukommen lassen, welche auch in deiner Mensa angeboten werden.
			
			- course_timetable - Sofern du deinen Stundenplan erstellt hast, wird dieser auch in deinem Profil online gespeichert. Wir analysieren Profile mit Stundenplänen, um überfüllte Essensschlangen zu vermeiden - wir geben diese Daten ggf. nur an dein Studierendenwerk weiter.
			
			- notify_on_free_housing_rooms - Deine Zustimmung, ob wir dich benachrichtigen dürfen, wenn ein freies Zimmer in einem Wohnheim verfügbar ist.
			
			- date_created - Das Erstelldatum deines Kontos. Dadurch können wir den Zuwachs von Benutzern verfolgen.
			
			- date_updated - Das letzte Änderungsdatum deines Kontos. Dadurch können wir nachvollziehen, wann Änderungen getätigt wurden.
			
			- visited_pages - Die von dir aufgerufenen Menüpunkte/Bereiche der App. Dadurch können wir erkennen, welche Bereiche der App besonders häufig genutzt werden. Dies hilft uns, den Fokus der Verbesserung dahingehend zu setzen. StreamViews werden nur durch deine explizite Zustimmung (zur Verbesserung der App) an uns übermittelt. Wir erhoffen uns damit, Fragen beantworten zu können, wie z. B. "Verwenden Erstsemester-Studenten den Lageplan häufiger als andere?".
			
		### Informationen zu deinem Gerät
		
			- id - Eine vom Server generierte Nummer für dein Gerät. Da es Personen gibt, welche mehrere Geräte haben, unterscheiden wir zwischen diesen angemeldeten Geräten. Dieser Nummer ordnen wir weitere Informationen zu: PushNotificationToken, DeviceOS, DeviceID und StreamViews.
			
			- DeviceOS - Das Betriebssystem und die Version deines Smartphones. Anhand dieser Informationen können wir Fehlerabstürze und die zu testenden Geräte überblicken.
			
			- PushNotificationToken - Ein von deinem App Store Provider generierter Schlüssel, über den wir dir Push-Benachrichtigungen senden können. Weitere Informationen hierüber gibt es im Abschnitt "Zugriffsrechte der Mobilen App".
			
			- display - Diverse Informationen zu deinem Display: Schriftgröße, Pixelratio, Breite, Höhe, Marke, ...
			
			- platform - Deine Plattform auf der sich dein Gerät befindet: Web, iOS, Android.
			
			- brand - Die Marke deines Gerätes.
			
			- system_version - Welche Versionsnummer dein Betriebsystem hat. Du glaubst nicht, wie sehr uns das hilft, Fehler auf Android Geräten zu beheben.
			
			Eine Übermittlung deiner personenbezogenen Daten an Dritte zu anderen Zwecken findet nicht statt, es sei denn, dass du
			
			- gem. Art. 6 Abs. 1 S. 1 a) DSGVO deine ausdrückliche Einwilligung dazu erteilt hast, sowie
			
			- für den Fall, dass für die Weitergabe nach Art. 6 Abs. 1 S. 1 c) DSGVO eine gesetzliche Verpflichtung besteht.



# Weitergabe und Übertragung von Daten

	Eine Weitergabe deiner personenbezogenen Daten ohne deine ausdrückliche vorherige Einwilligung erfolgt neben den explizit in dieser Datenschutzerklärung genannten Fällen lediglich dann, wenn es gesetzlich zulässig bzw. erforderlich ist. Dies kann u. a. der Fall sein, wenn die Verarbeitung erforderlich ist, um lebenswichtige Interessen des Nutzers oder einer anderen natürlichen Person zu schützen.
	
	Wir sind für die Funktionalität unserer App auf externe Dienstleister angewiesen, die Teilprozesse oder Serviceleistungen für uns erbringen.

# Funktionen, Dienste und Dienstleister

	Damit wir dir die App zur Verfügung stellen können, arbeiten wir mit verschiedenen Dienstleistern zusammen, die uns bei der Bereitstellung der App unterstützen. Diese Dienstleister sind sorgfältig ausgewählt und beauftragt, sind an unsere Weisungen gebunden und werden regelmäßig kontrolliert. Sie verarbeiten personenbezogene Daten nur in unserem Auftrag und strikt nach unseren Weisungen. Die Dienstleister werden von uns nur dann beauftragt, wenn sie hinreichend Garantien dafür bieten, dass geeignete technische und organisatorische Maßnahmen so durchgeführt werden, dass die Verarbeitung im Einklang mit den Anforderungen der DSGVO erfolgt und den Schutz deiner Rechte gewährleistet.

	## Cloud Messaging
	
		Cloud Messaging dient uns dazu, dir Push-Nachrichten oder In-App-Messages zusenden zu können. Dabei wird dem Endgerät eine pseudonymisierte Push-Reference zugeteilt, die den Push-Nachrichten bzw. In-App-Messages als Ziel dient. Die Push-Nachrichten können in den Einstellungen des Endgeräts jederzeit deaktiviert, aber auch wieder aktiviert werden.



	## Lageplan
	
		In unserer App verwenden wir zur Darstellung der Standorte OpenStreetMap. Information über deinen aktuellen Standort werden nur auf deinem Gerät gespeichert und zu keinem Zeitpunkt an uns übermittelt. Wir erhalten auch keine Daten eines Map Providers.
		
		Die Nutzungsbedingungen von OpenStreetMap kannst du hier nachlesen: https://wiki.osmfoundation.org/wiki/Privacy_Policy (https://wiki.osmfoundation.org/wiki/Privacy_Policy). Dort erhältst du auch weitere Informationen zu deinen diesbezüglichen Rechten und Einstellungsmöglichkeiten zum Schutz deiner Privatsphäre.





	##  NFC-Zugriff
	
		Für das Auslesen des Guthabens deiner Mensa-Karte per NFC wird in der App der zuletzt ausgelesene Stand angezeigt und gespeichert. Es findet eine Weiterleitung der Daten an das Backend statt, sodass diese Daten auf deinen Geräten synchronisiert wird. Wir behalten es uns vor den Verlauf des Guthabens zu analysieren.
	
	
	
	
	## Planer
	
		Alle Termine und Veranstaltungen im Planer werden lokal auf dem mobilen Endgerät und bei uns online gespeichert und verarbeitet. Wir können unter anderem deine Daten verwenden, um unsere Mensa-Abläufe zu optimieren und dir eine bessere Erfahrung zu bieten.
		
		Auf Wunsch können bereits vorhandene Termine und Veranstaltungen von Drittanbietern wie z. B. aus Stud.IP importiert werden. Diese Daten werden ebenfalls lokal abgespeichert und an unseren Server weitergeleitet. Gegebenenfalls werden die IP-Adresse des verwendeten Endgeräts und die entsprechenden REST-Zugriffe für den Daten-Export von dem Drittanbietern wie z. B. Stud.IP selbst geloggt.
	
	
	
	## Vorschlags-System
	
		Um den Nutzerflow zu optimieren und innerhalb der App bessere und passendere Vorschläge zu erhalten, gibt es ein Vorschlags-System. Die serverseitige Verarbeitung deiner Daten findet statt, wenn du ein kein Gast Profil verwendest. Allgemeine Vorschläge, die nutzerunabhängig sind, werden weiterhin gemacht wie z. B. die Tagesempfehlung oder nur anhand deiner ausgewählten Mensa oder Filter und Sortier Einstellungen.
		
		Das Vorschlags-System greift auf die folgenden Daten zu:
		
		- Besuchte Seiten
		- Speise Feedbacks (z. B. Lieblingsgerichte, ...)
		- Bevorzugte Mensa
		- Planer
		
	
	## Expo (Updates und Pushnachrichten)
	
		Um dir die technisch notwendigen Updates, z. B. wenn eine Grundfunktionalität der App nicht funktionieren sollte oder es ein Sicherheitsproblem gibt, so schnell wie möglich zukommen zu lassen, benutzen wir Dienste von Expo.
		
		Es werden an Expo die "Allgemeine Daten" und Daten zum "Verteilen" gesendet.  Als rechtliche Grundlage führen wir hier Art. 6 Abs. 1 lit. f DSGVO und Art. 6 Abs. 1 lit. b DSGVO an.
		
		Als Datenverarbeiter außerhalb des Europäischen Wirtschaftsraums (EWR) unterliegt Expo gewissen Rahmenbedingungen, die sie einhalten müssen, um einen gleichwertigen Schutz wie innerhalb des EWR zu gewährleisten. Dieser Schutz wird durch die Standardvertragsklauseln abgesichert.
		
		### EAS Updates
		
			Damit wird deine App automatisch aktualisiert und du kannst die App wie gewohnt benutzen. Um diesen Dienst nutzen zu können, müssen wir deine Gerätekennung und die Version der App an Expo (650 Industries, Inc., 624 University Ave # 1 Palo Alto, CA, 94301-2019 United States) übermitteln. Andere Daten wie z. B. deine E-Mail-Adresse geben wir nicht weiter. Informationen zu Zweck, Umfang, Art sowie der Nutzung deiner Daten durch den Betreiber des Dienstes findest du unter folgender Adresse: [https://docs.expo.dev/regulatory-compliance/privacy-shield/](https://docs.expo.dev/regulatory-compliance/privacy-shield/) und [https://docs.expo.dev/regulatory-compliance/gdpr/](https://docs.expo.dev/regulatory-compliance/gdpr/).
		
		### Expo Pushnachrichten
		
			Verwendest du ein mobiles Endgerät, so kannst du Pushnachrichten von uns erhalten. Wir verwenden hierfür Dienste von Expo.
			
			Expo selbst verwendet wiederum Google Firebase, um Pushnachrichten zu versenden. Hierbei wird eine pseudonymisierte Push-Reference an dein Endgerät übermittelt, um dir Pushnachrichten zukommen zu lassen. Die Pushnachrichten können in den Einstellungen des Endgeräts jederzeit deaktiviert, aber auch wieder aktiviert werden.
			
			Expo nutzt Dienste von Google Firebase. Firebase ist Teil der Google Cloud Plattform und bietet für Entwickler viele Dienste an, die du hier einsehen kannst: [https://firebase.google.com/terms/](https://firebase.google.com/terms/). Einige Dienste von Firebase verarbeiten von dir als Endnutzer personenbezogene Daten. Dies ist für die Bereitstellung der Google-Dienste notwendig. Welche Daten zu welchem Zweck verarbeitet werden, kannst du unter dem Punkt Datenverarbeitungsinformationen (dataprocessing information) einsehen:  [https://firebase.google.com/support/privacy/](https://firebase.google.com/support/privacy/). Google Firebase verwendet oftmals "Instance-ID´s", die laut den Informationen von Google solange gespeichert werden, bis der Endkunde einen API-Aufruf zum Löschen der ID ausführt. Danach werden die Daten 180 Tage nach Aufruf aus dem Live- und Backup-System gelöscht. Weitere Informationen findest du unter:  [firebase.google.com/support/privacy/manage-iids](https://firebase.google.com/support/privacy/manage-iids). Diese Instance-ID´s werden bspw. ermittelt, um zu wissen, an welches Gerät Nachrichten übermittelt werden sollen.
			
			Wir erhalten keinerlei personenbezogene Daten von Google Firebase und stellen auch keine Anstrengungen an, diese Daten im Nachhinein zu personalisieren. Wir benutzen die Daten lediglich zur Analyse des Nutzungsverhaltens.



# Feedback Kommentarfeld

	Über das Feedback Kommentarfeld kannst du uns Nachrichten zusenden. Durch das Kommentarfeld verarbeiten wir deine Benutzer id, Profil id, sowie deine E-Mail Adresse. Hierfür berufen wir uns auf deine Einwilligung gem. Art. 6 Abs. 1 a) DSGVO, da die Abgabe eines Feedbacks freiwillig ist.
	
	Trittst du mit Fragen jeglicher Art per E-Mail oder Kontaktformular mit uns in Kontakt, erteilst du uns zum Zwecke der Kontaktaufnahme deine freiwillige Einwilligung. Hierfür ist die Angabe einer validen E-Mail-Adresse erforderlich oder liegt auf deinem Konto bereits vor. Diese dient der Zuordnung der Anfrage und der anschließenden Beantwortung derselben. Die Angabe weiterer Daten ist optional.
	Wir weisen ausdrücklich darauf hin, dass die Zustellung dieser Daten an uns teilweise unverschlüsselt erfolgt. Deshalb bitten wir darum, uns keine besonderen Kategorien von personenbezogenen Daten (z.B. Gesundheitsdaten) über das Kontaktformular zukommen zu lassen; nutze dafür sichere Wege wie beispielsweise den Postweg.
	Alle eingehenden und alle versendeten E-Mails werden in unserem zentralen E-Mailarchiv erfasst und in der Regel für 10 Jahre gespeichert. Diese Speicherung dient zur Erfüllung der gesetzlichen Pflichten für eine ordnungsgemäße Buchführung. Diese Archivierungspflicht betrifft zwar nur E-Mails mit Buchhaltungsbelegfunktion, aber eine systematische Trennung zwischen diesen und anderen E-Mails ist nicht möglich. Zugriff auf archivierte E-Mails erfolgt zum Zweck der Finanzbuchhaltung und des Rechnungswesens, außerdem zur Erfüllung der satzungsgemäßen Aufgaben des Studentenwerks, wenn die Inhalte von E-Mails fachlich benötigt werden.





# Zweckänderungen

	Verarbeitungen deiner personenbezogenen Daten zu anderen als den beschriebenen Zwecken erfolgen nur, soweit eine Rechtsvorschrift dies erlaubt oder du in den geänderten Zweck der Datenverarbeitung eingewilligt hast. Im Falle einer Weiterverarbeitung zu anderen Zwecken als denen, für die die Daten ursprünglich erhoben worden sind, informieren wir dich vor der Weiterverarbeitung über diese anderen Zwecke und stellen dir sämtliche weitere hierfür maßgeblichen Informationen zur Verfügung.


# Zeitraum der Datenspeicherung

	Wir speichern deine Daten im Normalfall bis zu 180 Tage. Solltest du länger als 180 Tage nicht aktiv gewesen sein (sprich du hast die App nicht verwendet, warst lange im Auslandsstudium) oder du löscht dein Konto (über die App), werden alle Daten, welche wir dir zuordnen können, automatisch gelöscht oder anonymisiert.
	
	Dabei löschen oder anonymisieren wir deine personenbezogenen Daten, sobald sie für die Zwecke, für die wir sie nach den vorstehenden Ziffern erhoben oder verwendet haben, nicht mehr erforderlich sind oder soweit diese Daten nicht für die strafrechtliche Verfolgung oder zur Sicherung, Geltendmachung oder Durchsetzung von Rechtsansprüchen länger benötigt werden. Nach Löschung deines Benutzerkontos werden deine Daten für die weitere Verwendung automatisch gelöscht, es sei denn, dass wir nach Art. 6 Abs. 1 S. 1 c) DSGVO aufgrund von steuer- und handelsrechtlichen Aufbewahrungs- und Dokumentationspflichten (aus HGB, StGB oder AO) zu einer längeren Speicherung verpflichtet sind oder du in die darüberhinausgehende Speicherung nach Art. 6 Abs. 1 S. 1 a) DSGVO eingewilligt hast.
	
	Die Bewertungen zu Speisen und anderen Leistungen werden hingegen nicht gelöscht, auch wenn du die App deinstallierst oder dieses Gericht nicht mehr auf den Speiseplänen steht. Die Bewertungen beinhalten, außer der UserID, die wie o.g. gelöscht oder anonymisiert wird, keine weiteren personenbezogenen Daten. Wir werden dich auch nicht bitten zur Löschung oder Anonysierung deiner Daten, zusätzliche personenbezogene Daten anzugeben.
	
	Die Account ID wird in unseren Systemen während des Angebots der App genutzt. Serverlogs werden in der Regel so lange vorgehalten, wie es erforderlich ist, um etwaige Fehler analysieren zu können. Im Regelfall liegt dies bei 30 Tagen.




# Deine Rechte als Betroffener

	Du hast das Recht, von uns jederzeit auf Antrag eine Auskunft über die von uns verarbeiteten, dich betreffenden personenbezogenen Daten im Umfang des Art. 15 DSGVO zu erhalten. Hierzu kannst du einen Antrag postalisch oder per E-Mail an die unten angegebenen Adressen stellen.
	
	Du hast das Recht, von uns die unverzügliche Berichtigung der dich betreffenden personenbezogenen Daten zu verlangen, sofern diese unrichtig sein sollten. Wende dich hierfür bitte an die unten angegebenen Kontaktadressen.
	
	Du hast das Recht, unter den in Art. 17 DSGVO beschriebenen Voraussetzungen von uns, die Löschung der dich betreffenden personenbezogenen Daten zu verlangen. Diese Voraussetzungen sehen insbesondere ein Löschungsrecht vor, wenn die personenbezogenen Daten für die Zwecke, für die sie erhoben oder auf sonstige Weise verarbeitet wurden, nicht mehr notwendig sind, sowie in Fällen der unrechtmäßigen Verarbeitung, des Vorliegens eines Widerspruchs oder des Bestehens einer Löschungspflicht nach Unionsrecht oder dem Recht des Mitgliedstaates, dem wir unterliegen. Zum Zeitraum der Datenspeicherung siehe im Übrigen Ziffer 5 dieser Datenschutzerklärung.
	
	Um dein Recht auf Löschung geltend zu machen, wende dich bitte an die unten angegebenen Kontaktadressen oder lösche deine Daten selbst über die App.
	
	Du hast das Recht, von uns die Einschränkung der Verarbeitung nach Maßgabe des Art. 18 DSGVO zu verlangen. Dieses Recht besteht insbesondere, wenn die Richtigkeit der personenbezogenen Daten zwischen dem Nutzer und uns umstritten ist, für die Dauer, welche die Überprüfung der Richtigkeit erfordert, sowie im Fall, dass der Nutzer bei einem bestehenden Recht auf Löschung anstelle der Löschung eine eingeschränkte Verarbeitung verlangt; ferner für den Fall, dass die Daten für die von uns verfolgten Zwecke nicht länger erforderlich sind, der Nutzer sie jedoch zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen benötigt sowie für den Fall, dass die erfolgreiche Ausübung eines Widerspruchs zwischen uns und dem Nutzer noch umstritten ist. Um dein Recht auf Einschränkung der Verarbeitung geltend zu machen, wende dich bitte an die unten angegebenen Kontaktadressen.
	
	Du hast das Recht, die dich betreffenden personenbezogenen Daten, die du uns bereitgestellt hast, in einem strukturierten, gängigen, maschinenlesbaren Format nach Maßgabe des Art. 20 DSGVO von uns zu erhalten. Um dein Recht auf Datenübertragbarkeit geltend zu machen, wende dich bitte an die unten angegebenen Kontaktadressen.
	
	Du hast das Recht, aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit gegen die Verarbeitung dich betreffender personenbezogener Daten, die u.a. aufgrund von Art. 6 Abs. 1 e) oder f) DSGVO erfolgt, Widerspruch nach Art. 21 DSGVO einzulegen. Wir werden die Verarbeitung deiner personenbezogenen Daten einstellen, es sei denn, wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die deine Interessen, Rechte und Freiheiten überwiegen, oder wenn die Verarbeitung der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen dient.
	
	Du hast das Recht, ohne Angaben von Gründen deine Einwilligung zur jeweiligen Datenverarbeitung zu widerrufen. Dies gilt für die Verarbeitung nach der Zeit des Widerrufs. Die Verarbeitung bis dahin bleibt unberührt.
	
	Gerne kannst du dich bei Beschwerden an unsere Datenschutzbeauftragte (Kontaktdaten s. unten) wenden. Darüber hinaus besteht ein Beschwerderecht bei der zuständigen Datenschutzaufsichtsbehörde, der Landesbeauftragten für Datenschutz Niedersachsen, Prinzenstraße 5, 30159 Hannover, Telefon: +49 511 120-4500, E-Mail: poststelle@lfd.niedersachsen.de



# Datensicherheit

	Wir bedienen uns geeigneter technischer und organisatorischer Sicherheitsmaßnahmen, um deine Daten gegen zufällige oder vorsätzliche Manipulationen, teilweisen oder vollständigen Verlust, Zerstörung oder gegen den unbefugten Zugriff Dritter zu schützen. Unsere Sicherheitsmaßnahmen werden entsprechend der technologischen Entwicklung fortlaufend verbessert.



# Externes Hosting

	Das Backend zur App wird beim deutschen Hoster Strato AG, Berlin gehostet. Daten, die von der App zum Backend gesendet werden, werden auf unserer Server-Instanz beim Hoster gespeichert. Hierbei handelt es sich um die Daten, die unter 1.2. aufgeführt sind.
	
	Es besteht ein Vertrag zur Auftragsverarbeitung mit der Strato AG.




# Kontakt


	Solltest du Fragen oder Anmerkungen zu unserem Umgang mit deinen personenbezogenen Daten haben oder möchtest du die unter Ziffer 6 und 7 genannten Rechte als betroffene Person ausüben, wende dich bitte an unsere Datenschutzbeauftragte.
	
	
	Studentenwerk Muster
	Anstalt des öffentlichen Rechts
	Der Geschäftsführer
	Besuchsadresse: Straße 1, 12345 Musterstadt
	Postadresse: Postfach 1234, 12345 Musterstadt
	Tel. (0123) 45-6789
	Fax (0123) 45-6789
	Steuernummer 12 / 345 / 6789
	USt-IdNr. DE123456789
	E-Mail: 
	[datenschutz@studentenwerk-muster.de](mailto:datenschutz@studentenwerk-muster.de)
	
	Website: [https://www.studentenwerk-muster.de](https://www.studentenwerk-muster.de)
	
	Diese Kontaktdaten gelten auch für die Datenschutzbeauftragte, E-Mail-Adresse der Datenschutzbeauftragten.

# Änderungen dieser Datenschutzerklärung

Wir halten diese Datenschutzerklärung immer auf dem neuesten Stand. Deshalb behalten wir uns vor, sie von Zeit zu Zeit zu ändern und Änderungen bei der Erhebung, Verarbeitung oder Nutzung deiner Daten nachzupflegen. Die aktuelle Fassung der Datenschutzerklärung ist stets unter „Datenschutzbestimmungen“ innerhalb der App abrufbar.

Stand: 14.06.2024
`

export const realisticMarkdownTest = `
# Psychologische und Sozialberatung

![Alt text for image](https://via.placeholder.com/320)

Wenn Probleme und persönliche Schwierigkeiten im Studienalltag zur Belastung werden, hilft undere Beratungsstelle.

[Mehr informationen](https://www.google.com)

## Psychologische Beratung

![Alt text for image](https://via.placeholder.com/320)

Wenn du in einer schwierigen Lebenssituation steckst, kann eine psychologische Beratung helfen. Unsere Psychologinnen und Psychologen unterstützen dich dabei, deine Probleme zu erkennen und Lösungen zu finden.

Tel: [123 456 789](tel:123456789)

E-Mail: [beratung@universität.de](mailto:beratung@universität.de)

[Mehr informationen](https://www.google.com)

## Sozialberatung

![Alt text for image](https://via.placeholder.com/320)

Die Sozialberatung unterstützt dich bei Fragen zu Studienfinanzierung, Wohnen, Sozialleistungen und vielem mehr.

Tel: [123 456 789](tel:123456789)

E-Mail: [beratung@universität.de](mailto:beratung@universität.de)

[Mehr informationen](https://www.google.com)

## Hilfe in akuten Krisen

![Alt text for image](https://via.placeholder.com/320)

Wenn du dich in einer akuten Krise befindest, kannst du dich an die folgenden Stellen wenden:
- Notruf [112](tel:112)
- Telefonseelsorge [0800 111 0 111](tel:08001110111)
- Krisendienst Psychiatrie [123 456 789](tel:123456789)

[Mehr informationen](https://www.google.com)
`


export const extensiveMarkdownTest = `
# Markdown Test Document

## Headers
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

## Text Styles
*Italic text* or _Italic text_

**Bold text** or __Bold text__

***Bold and italic*** or ___Bold and italic___

~~Strikethrough text~~

## Lists

### Unordered Lists
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
- Item 3

### Ordered Lists
1. First item
2. Second item
   1. Subitem 2.1
   2. Subitem 2.2
3. Third item

## Links
[OpenAI](https://www.openai.com)

## Images
![Alt text for image](https://via.placeholder.com/150)

## Code
Inline code: \`print("Hello, World!")\`

### Code Block
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`
    `


export default function ScreenMarkdownTest() {
	const [mardkown, setMarkdown] = useState<string | undefined>(extensiveMarkdownTest)

	return (
		<View
			style={{
				width: '100%',
				height: '100%',
			}}
		>
			<View style={{
				width: '100%',
				paddingBottom: 10,
			}}
			>
				<Heading>{'Parameters'}</Heading>
				<SettingsRowTextEdit
					value={mardkown}
					labelRight={'Edit Markdown'}
					leftIcon={'text'}
					accessibilityLabel={'Edit Markdown'}
					labelLeft={'Edit Markdown'}
					onSave={
						(value) => {
							if (value) {
								setMarkdown(value)
							} else {
								setMarkdown(undefined)
							}
						}
					}
				/>
			</View>
			<View style={{
				width: '100%',
				height: '100%',
				flex: 1,
			}}
			>
				<MyScrollView>
					<ThemedMarkdown>
						{mardkown}
					</ThemedMarkdown>
				</MyScrollView>
			</View>
		</View>
	);
}