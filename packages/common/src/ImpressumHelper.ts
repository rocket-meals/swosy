export function getFirmenname(): string {
	return 'Baumgartner Software UG (haftungsbeschränkt)';
}

export function getGeschaeftsfuehrer(): string {
	return 'Nils Baumgartner';
}

export function getAdresse(): string {
	return 'Bernhardstraße 20, 49413 Dinklage';
}

export function getTelefon(): string {
	return '+49 170 2215430';
}

export function getEmail(): string {
	return 'info@baumgartner-software.de';
}

export function getRegistergericht(): string {
	return 'Oldenburg';
}

export function getRegisternummer(): string {
	return 'HRB 219785';
}

export function getHandelsregister(): string {
	return `${getRegistergericht()}, ${getRegisternummer()}`;
}

export function getUstIdNr(): string {
	return 'DE362633044';
}

export function getImpressumMarkdown(): string {
	const email = getEmail();

	return [
		'# Impressum',
		'',
		'## Rechtliche Informationen',
		'',
		`**Firmenname:** ${getFirmenname()}`,
		'',
		`**Geschäftsführer:** ${getGeschaeftsfuehrer()}`,
		'',
		`**Adresse:** ${getAdresse()}`,
		'',
		`**Telefon:** ${getTelefon()}`,
		'',
		`**E-Mail:** [${email}](mailto:${email})`,
		'',
		'## Handelsregister',
		'',
		`**Registergericht:** ${getRegistergericht()}`,
		'',
		`**Registernummer:** ${getRegisternummer()}`,
		'',
		`**USt-IdNr:** ${getUstIdNr()}`,
	].join('\n');
}
