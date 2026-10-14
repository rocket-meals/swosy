/**
 * LegalEntities.ts – the company data for imprints and legal documents, in one place.
 *
 * The operator publishes every app (Rocket Meals, Geonexia, Score Tracker, ...). The customers
 * (the Studierendenwerke) are responsible for the content of their Rocket Meals app. The backend
 * fills these values into the privacy policy, the imprint and the accessibility statement
 * (`legal-documents-hook`), `ImpressumHelper` builds the imprint of the smaller apps from the operator.
 */

export type OperatorLegalEntity = {
  /** Full legal name including the legal form. */
  name: string;
  /** Name used in running text. */
  shortName: string;
  street: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  managingDirector: string;
  taxNumber: string;
  vatId: string;
  registerCourt: string;
  registerNumber: string;
};

export type CustomerLegalEntity = {
  name: string;
  /** e.g. `Anstalt des öffentlichen Rechts`. Kept in German in every language, it is a legal designation. */
  legalForm: string;
  phone: string;
  email: string;
  privacyPolicyUrl: string;
};

export const OPERATOR_LEGAL_ENTITY: OperatorLegalEntity = {
  name: 'Baumgartner Software UG (haftungsbeschränkt)',
  shortName: 'Baumgartner Software',
  street: 'Bernhardstraße 20',
  postalCode: '49413',
  city: 'Dinklage',
  phone: '+49 170 2215430',
  email: 'info@baumgartner-software.de',
  website: 'https://baumgartner-software.de',
  managingDirector: 'Nils Baumgartner',
  taxNumber: '68/213/02808',
  vatId: 'DE362633044',
  registerCourt: 'Oldenburg',
  registerNumber: 'HRB 219785',
};

export const STUDIERENDENWERK_OSNABRUECK_LEGAL_ENTITY: CustomerLegalEntity = {
  name: 'Studierendenwerk Osnabrück',
  legalForm: 'Anstalt des öffentlichen Rechts',
  phone: '(0541) 331070',
  email: 'info@sw-os.de',
  privacyPolicyUrl: 'https://www.studentenwerk-osnabrueck.de/de/datenschutzerklaerung.html',
};

export const STUDENTENWERK_HANNOVER_LEGAL_ENTITY: CustomerLegalEntity = {
  name: 'Studentenwerk Hannover',
  legalForm: 'Anstalt des öffentlichen Rechts',
  phone: '(0511) 76-88022',
  email: 'info@studentenwerk-hannover.de',
  privacyPolicyUrl: 'https://www.studentenwerk-hannover.de/datenschutz',
};
