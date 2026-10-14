/**
 * LegalEntities.ts – which customer the legal documents of this server name, and the placeholder
 * values. The company data itself lives in `repo-depkit-common` (`LegalEntities.ts`).
 *
 * A server whose customer has no entry here keeps the legal documents it already has in Directus.
 */

import { CustomerLegalEntity, OperatorLegalEntity, STUDENTENWERK_HANNOVER_LEGAL_ENTITY, STUDIERENDENWERK_OSNABRUECK_LEGAL_ENTITY } from 'repo-depkit-common';
import { SyncForCustomerEnum } from '../helpers/EnvVariableHelper';

/**
 * The customer per server. A `Record` so a new customer in `SyncForCustomerEnum` has to be added
 * here too. `null` means: no data yet, the server keeps its legal documents untouched.
 */
export const CUSTOMER_LEGAL_ENTITIES: Record<SyncForCustomerEnum, CustomerLegalEntity | null> = {
  // The test system mirrors the Osnabrück app.
  [SyncForCustomerEnum.TEST]: STUDIERENDENWERK_OSNABRUECK_LEGAL_ENTITY,
  [SyncForCustomerEnum.OSNABRUECK]: STUDIERENDENWERK_OSNABRUECK_LEGAL_ENTITY,
  [SyncForCustomerEnum.HANNOVER]: STUDENTENWERK_HANNOVER_LEGAL_ENTITY,
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
      'operator.register_court': operator.registerCourt,
      'operator.register_number': operator.registerNumber,
      'customer.name': customer.name,
      'customer.legal_form': customer.legalForm,
      'customer.phone': customer.phone,
      'customer.email': customer.email,
      'customer.privacy_policy_url': customer.privacyPolicyUrl,
    };
  }
}
