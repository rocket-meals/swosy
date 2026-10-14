import { getAdresse, getEmail, getFirmenname, getUstIdNr, OPERATOR_LEGAL_ENTITY, STUDENTENWERK_HANNOVER_LEGAL_ENTITY, STUDIERENDENWERK_OSNABRUECK_LEGAL_ENTITY } from 'repo-depkit-common';

describe('LegalEntities', () => {
  it('has a value for every field', () => {
    for (const entity of [OPERATOR_LEGAL_ENTITY, STUDIERENDENWERK_OSNABRUECK_LEGAL_ENTITY, STUDENTENWERK_HANNOVER_LEGAL_ENTITY]) {
      expect(Object.values(entity).every(value => value.trim().length > 0)).toBe(true);
    }
  });

  it('is the source of the imprint of the smaller apps', () => {
    expect(getFirmenname()).toBe(OPERATOR_LEGAL_ENTITY.name);
    expect(getAdresse()).toBe('Bernhardstraße 20, 49413 Dinklage');
    expect(getEmail()).toBe(OPERATOR_LEGAL_ENTITY.email);
    expect(getUstIdNr()).toBe('DE362633044');
  });
});
