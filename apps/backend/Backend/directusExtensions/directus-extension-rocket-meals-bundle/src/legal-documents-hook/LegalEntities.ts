/**
 * LegalEntities.ts – the companies named in the legal documents (privacy policy, imprint,
 * accessibility statement).
 *
 * The operator publishes the app on every server. The customer (the Studierendenwerk) is
 * responsible for the content and differs per server, selected by `SYNC_FOR_CUSTOMER`. A server
 * whose customer has no entry here keeps the legal documents it already has in Directus.
 */

import { SyncForCustomerEnum } from '../helpers/EnvVariableHelper';

export type OperatorLegalEntity = {
  /** Full legal name including the legal form, e.g. `Example GmbH`. */
  name: string;
  /** Name used in running text, e.g. `Example`. */
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
  vatId: 'DE 362633044',
};

const STUDIERENDENWERK_OSNABRUECK: CustomerLegalEntity = {
  name: 'Studierendenwerk Osnabrück',
  legalForm: 'Anstalt des öffentlichen Rechts',
  phone: '(0541) 331070',
  email: 'info@sw-os.de',
  privacyPolicyUrl: 'https://www.studentenwerk-osnabrueck.de/de/datenschutzerklaerung.html',
};

/**
 * The customer per server. A `Record` so a new customer in `SyncForCustomerEnum` has to be added
 * here too. `null` means: no data yet, the server keeps its legal documents untouched.
 */
export const CUSTOMER_LEGAL_ENTITIES: Record<SyncForCustomerEnum, CustomerLegalEntity | null> = {
  // The test system mirrors the Osnabrück app.
  [SyncForCustomerEnum.TEST]: STUDIERENDENWERK_OSNABRUECK,
  [SyncForCustomerEnum.OSNABRUECK]: STUDIERENDENWERK_OSNABRUECK,
  [SyncForCustomerEnum.HANNOVER]: null,
  [SyncForCustomerEnum.AACHEN]: null,
  [SyncForCustomerEnum.MUENSTER]: null,
};

export class LegalEntities {
  static getCustomer(customer: SyncForCustomerEnum | null): CustomerLegalEntity | null {
    return customer ? CUSTOMER_LEGAL_ENTITIES[customer] : null;
  }

  /** The values for the placeholders in the documents, e.g. `operator.email` or `customer.name`. */
  static buildPlaceholderValues(operator: OperatorLegalEntity, customer: CustomerLegalEntity): Record<string, string> {
    return {
      'operator.name': operator.name,
      'operator.short_name': operator.shortName,
      'operator.street': operator.street,
      'operator.postal_code': operator.postalCode,
      'operator.city': operator.city,
      'operator.phone': operator.phone,
      'operator.email': operator.email,
      'operator.website': operator.website,
      'operator.managing_director': operator.managingDirector,
      'operator.tax_number': operator.taxNumber,
      'operator.vat_id': operator.vatId,
      'customer.name': customer.name,
      'customer.legal_form': customer.legalForm,
      'customer.phone': customer.phone,
      'customer.email': customer.email,
      'customer.privacy_policy_url': customer.privacyPolicyUrl,
    };
  }
}
