import { UniversityAffiliationHelper } from '../UniversityAffiliationHelper';

describe('UniversityAffiliationHelper', () => {
  it('reads the affiliation from claims flattened by Directus', () => {
    const record = UniversityAffiliationHelper.createRecord('dfn', {
      sub: 'abc',
      'eduperson_scoped_affiliation.0': 'Student@uni-hannover.de',
      'eduperson_scoped_affiliation.1': 'member@uni-hannover.de',
    });
    expect(record.scoped_affiliations).toEqual(['student@uni-hannover.de', 'member@uni-hannover.de']);
    expect(record.received_claims).toEqual(['eduperson_scoped_affiliation', 'sub']);
    expect(UniversityAffiliationHelper.getStatus(record)).toEqual({ is_student: true, is_employee: false, universities: ['uni-hannover.de'] });
  });

  it('reads an unflattened array and a space separated string', () => {
    expect(UniversityAffiliationHelper.extractClaimValues({ eduperson_scoped_affiliation: ['staff@hs-hannover.de'] }, 'eduperson_scoped_affiliation')).toEqual(['staff@hs-hannover.de']);
    expect(UniversityAffiliationHelper.extractClaimValues({ eduperson_affiliation: 'employee member' }, 'eduperson_affiliation')).toEqual(['employee', 'member']);
  });

  it('reports no status without affiliation claims', () => {
    const record = UniversityAffiliationHelper.createRecord('dfn', { sub: 'abc', email: 'x@y.de' });
    expect(UniversityAffiliationHelper.getStatus(record)).toEqual({ is_student: false, is_employee: false, universities: [] });
  });
});
