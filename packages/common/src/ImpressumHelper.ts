import { OPERATOR_LEGAL_ENTITY } from './LegalEntities';

export function getFirmenname(): string {
	return OPERATOR_LEGAL_ENTITY.name;
}

export function getGeschaeftsfuehrer(): string {
	return OPERATOR_LEGAL_ENTITY.managingDirector;
}

export function getAdresse(): string {
	return `${OPERATOR_LEGAL_ENTITY.street}, ${OPERATOR_LEGAL_ENTITY.postalCode} ${OPERATOR_LEGAL_ENTITY.city}`;
}

export function getTelefon(): string {
	return OPERATOR_LEGAL_ENTITY.phone;
}

export function getEmail(): string {
	return OPERATOR_LEGAL_ENTITY.email;
}

export function getRegistergericht(): string {
	return OPERATOR_LEGAL_ENTITY.registerCourt;
}

export function getRegisternummer(): string {
	return OPERATOR_LEGAL_ENTITY.registerNumber;
}

export function getHandelsregister(): string {
	return `${getRegistergericht()}, ${getRegisternummer()}`;
}

export function getUstIdNr(): string {
	return OPERATOR_LEGAL_ENTITY.vatId;
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
