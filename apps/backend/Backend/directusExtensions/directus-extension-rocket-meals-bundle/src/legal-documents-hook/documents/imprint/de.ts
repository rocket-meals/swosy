import type { LegalDocumentText } from '../../LegalDocuments';

export const IMPRINT_DE: LegalDocumentText = {
  title: 'Über uns',
  content: `# Impressum

Die nachstehenden Informationen enthalten die gesetzlich vorgesehenen Pflichtangaben zur Anbieterkennzeichnung sowie rechtliche Hinweise zur Internetpräsenz und App.

## Herausgeber:
	
	{{operator.name}}
	{{operator.street}},
	{{operator.postal_code}} {{operator.city}}
	Tel.: {{operator.phone}}
	E-Mail: {{operator.email}}
	Geschäftsführer: {{operator.managing_director}}
	Steuernummer: {{operator.tax_number}}
	Umsatzsteuer-Identifikations-Nummer: {{operator.vat_id}}
	Registergericht: Amtsgericht {{operator.register_court}}, {{operator.register_number}}
	
	E-Mail:

	[{{operator.email}}](mailto:{{operator.email}})

	Website:

	[{{operator.website}}]({{operator.website}})

## Kontaktmöglichkeiten
	Du kannst uns per Mail oder über unsere Webseite kontaktieren.

	E-Mail:

	[{{operator.email}}](mailto:{{operator.email}})

	Website:

	[{{operator.website}}]({{operator.website}})

## Gestaltung und technische Umsetzung
	{{operator.name}}
	
	[{{operator.email}}](mailto:{{operator.email}})
	
	[{{operator.website}}]({{operator.website}})


## Verantwortlich für journalistisch-redaktionelle Inhalte:

	{{customer.name}}
	{{customer.legal_form}}
	Tel. {{customer.phone}}

	[{{customer.email}}](mailto:{{customer.email}})

    Das Studierendenwerk ist verantwortlich für die Bereitstellung der Bilder, Speisen, Speisenangebote, Kennzeichnungen und Icons für die Allergene, sowie die Kennzeichnungen. Darüber hinaus ist es für die Informationen und die Rechte an den Bildern für die Wohnungen und News verantwortlich.


## Haftungsausschluss

	### Inhalt des Onlineangebots

		{{operator.short_name}} als Betreiber dieser App und Webseite übernimmt keinerlei Gewähr für die Aktualität, Korrektheit, Vollständigkeit oder Qualität der bereitgestellten Informationen. Haftungsansprüche gegen {{operator.short_name}}, welche sich auf Schäden materieller oder ideeller Art beziehen, die durch die Nutzung oder Nichtnutzung der dargebotenen Informationen bzw. durch die Nutzung fehlerhafter und unvollständiger Informationen verursacht wurden sind grundsätzlich ausgeschlossen, sofern seitens von {{operator.short_name}} kein nachweislich vorsätzliches oder grob fahrlässiges Verschulden vorliegt. Alle Angebote sind freibleibend und unverbindlich. {{operator.short_name}} behält es sich ausdrücklich vor, Teile der Seiten oder das gesamte Angebot ohne gesonderte Ankündigung zu verändern, zu ergänzen, zu löschen oder die Veröffentlichung zeitweise oder endgültig einzustellen.

	### Übersetzungen

		Inhalte wie Speisepläne, Speisenbeschreibungen und Neuigkeiten werden in deutscher Sprache erstellt. Übersetzungen in andere Sprachen werden teilweise automatisch erzeugt und als Service angeboten. Übersetzungsfehler können dabei nicht ausgeschlossen werden. Verbindlich ist die deutsche Fassung. Das gilt insbesondere für Angaben zu Allergenen und Zusatzstoffen.

	### Verweise und Links

		Bei direkten oder indirekten Verweisen auf fremde Internetseiten ("Links"), die außerhalb des Verantwortungsbereiches des Betreibers liegen, würde eine Haftungsverpflichtung ausschließlich in dem Fall in Kraft treten, in dem der Betreiber von den Inhalten Kenntnis hat und es ihm technisch möglich und zumutbar wäre, die Nutzung im Falle rechtswidriger Inhalte zu verhindern.

		{{operator.short_name}} erklärt daher ausdrücklich, dass zum Zeitpunkt der Linksetzung die entsprechenden verlinkten Seiten frei von illegalen Inhalten waren. Der Betreiber hat keinerlei Einfluss auf die aktuelle und zukünftige Gestaltung und auf die Inhalte der gelinkten/verknüpften Seiten. Deshalb distanziert er sich hiermit ausdrücklich von allen Inhalten aller gelinkten/verknüpften Seiten, die nach der Linksetzung verändert wurden. Diese Feststellung gilt für alle innerhalb des eigenen Internetangebotes gesetzten Links und Verweise sowie für Fremdeinträge in vom {{operator.short_name}} eingerichteten Gästebüchern, Diskussionsforen und Mailinglisten. Für illegale, fehlerhafte oder unvollständige Inhalte und insbesondere für Schäden, die aus der Nutzung oder Nichtnutzung solcherart dargebotener Informationen entstehen, haftet allein der Anbieter der Seite, auf welche verwiesen wurde, nicht derjenige, der über Links auf die jeweilige Veröffentlichung lediglich verweist.

	### Urheber- und Kennzeichenrecht

		Das Layout der App und Homepage, die verwendeten Grafiken sowie die sonstigen Inhalte sind urheberrechtlich geschützt. Die Vervielfältigung von Informationen und Daten insbesondere die Verwendung von Textteilen oder Bildmaterial bedarf der vorherigen schriftlichen Zustimmung von {{operator.short_name}}. Der Nutzer darf die Inhalte nur im Rahmen der angebotenen Funktionalitäten für seinen persönlichen Gebrauch nutzen. Er erwirbt keinerlei Rechte an den Inhalten oder Programmen. Wird Software zum Download angeboten, beschränkt sich die Nutzungsberechtigung des Nutzers auf die persönliche Verwendung im Rahmen der Nutzung des Internetauftritts.

		{{operator.short_name}} ist bestrebt, in allen Publikationen die Urheberrechte der verwendeten Grafiken, Tondokumente, Videosequenzen und Texte zu beachten, von ihm selbst erstellte Grafiken, Tondokumente, Videosequenzen und Texte zu nutzen oder auf lizenzfreie Grafiken, Tondokumente, Videosequenzen und Texte zurückzugreifen. Alle innerhalb des Internetangebotes genannten und ggf. durch Dritte geschützten Marken- und Warenzeichen unterliegen uneingeschränkt den Bestimmungen des jeweils gültigen Kennzeichenrechts und den Besitzrechten der jeweiligen eingetragenen Eigentümer. Allein aufgrund der bloßen Nennung ist nicht der Schluss zu ziehen, dass Markenzeichen nicht durch Rechte Dritter geschützt sind! Das Copyright für veröffentlichte, vom Betreiber selbst erstellte Objekte bleibt allein beim Betreiber der Seiten. Eine Vervielfältigung oder Verwendung solcher Grafiken, Tondokumente, Videosequenzen und Texte in anderen elektronischen oder gedruckten Publikationen ist ohne ausdrückliche Zustimmung des Betreibers nicht gestattet.
		
		
	### Datenschutz

		Sofern innerhalb der App und des Internetangebotes die Möglichkeit zur Eingabe persönlicher oder geschäftlicher Daten (Emailadressen, Namen, Anschriften) besteht, so erfolgt die Preisgabe dieser Daten seitens des Nutzers auf ausdrücklich freiwilliger Basis. Die Inanspruchnahme und Bezahlung aller angebotenen Dienste ist - soweit technisch möglich und zumutbar - auch ohne Angabe solcher Daten bzw. unter Angabe anonymisierter Daten oder eines Pseudonyms gestattet.
		
		
	### Rechtswirksamkeit dieses Haftungsausschlusses

		Sofern Teile oder einzelne Formulierungen dieses Textes der geltenden Rechtslage nicht, nicht mehr oder nicht vollständig entsprechen sollten, bleiben die übrigen Teile des Dokumentes in ihrem Inhalt und ihrer Gültigkeit davon unberührt.`,
};
