import { UniversityAffiliationHelper } from '../UniversityAffiliationHelper';
import { BackendUsageEventHelper } from '../BackendUsageEventHelper';
import fs from 'fs';
import path from 'path';

function readFixture(name: string) {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, './fixtures/university-affiliation/', name), 'utf8'));
}

describe('UniversityAffiliationHelper', () => {
  it('reads the affiliation from claims flattened by Directus', () => {
    const dfnWithoutAffiliation = readFixture('dfn-without-affiliation.json');
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
    const dfnWithoutAffiliation = readFixture('dfn-without-affiliation.json');
    const record = UniversityAffiliationHelper.createRecord('dfn', { sub: 'abc', email: 'x@y.de' });
    expect(UniversityAffiliationHelper.getStatus(record)).toEqual({ is_student: false, is_employee: false, universities: [] });
  });

  // Real answer of GET /university-affiliation (21.10.2026, DFN OIDC proxy, scope "openid profile email"):
  // the login worked, but neither eduperson_scoped_affiliation nor name or mail were released.
  it('matches the recorded answer of a DFN login without affiliation', () => {
    const claims = {
      at_hash: 'x',
      aud: 'https://baumgartner-software.de/RocketMeals',
      auth_time: 1,
      'eduperson_assurance.0': 'https://refeds.org/assurance',
      exp: 1,
      iat: 1,
      iss: 'https://oidc-proxy.aai.dfn.de',
      nonce: 'x',
      sid: 'x',
      sub: 'x',
    };
    const dfnWithoutAffiliation = readFixture('dfn-without-affiliation.json');
    const record = UniversityAffiliationHelper.createRecord('dfn', claims, new Date(dfnWithoutAffiliation.recorded_at));
    expect(UniversityAffiliationHelper.toResponse('dfn', record)).toEqual(dfnWithoutAffiliation);
  });

  it('builds an anonymous usage event from the status', () => {
    const record = UniversityAffiliationHelper.createRecord('dfn', { sub: 'abc', 'eduperson_scoped_affiliation.0': 'student@uni-hannover.de' });
    const event = BackendUsageEventHelper.buildUniversityStatusConfirmedEvent(UniversityAffiliationHelper.getStatus(record), new Date(2026, 9, 21, 20, 0));
    expect(event).toEqual({
      event_type: 'account',
      event_name: 'university_status_confirmed',
      session_id: 'Backend_2026_10_21',
      payload: { is_student: true, is_employee: false, universities: ['uni-hannover.de'] },
    });
  });
});

